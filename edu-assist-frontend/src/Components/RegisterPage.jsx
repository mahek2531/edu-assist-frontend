import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { buildApiUrl, GOOGLE_CLIENT_ID } from '../lib/api';
import { AuthPortalScene, Feedback, PasswordSentinel } from './ui/GameUI';

const RegisterPage = () => {
  const { role } = useParams();
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);

  const isJunior = role === 'junior';
  const isSenior = role === 'senior';

  const expertiseOptions = [
    'Java',
    'DBMS',
    'Python',
    'Web Development',
    'Maths',
    'Operating System',
    'Computer Network',
    'DSA',
  ];

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    rollNumber: '',
    photo: null,
    otp: '',
    expertiseSubjects: '',
  });

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [passwordTyping, setPasswordTyping] = useState(false);
  const passwordTypingTimerRef = useRef(null);

  useEffect(() => {
    if (!role || !GOOGLE_CLIENT_ID) return;

    const initializeGoogle = () => {
      if (!window.google || !googleButtonRef.current) return;

      googleButtonRef.current.innerHTML = '';

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'signup_with',
        width: 320,
      });
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
      return;
    }

    const existingScript = document.getElementById('google-signin-script');
    if (existingScript) {
      existingScript.addEventListener('load', initializeGoogle);
      return () => existingScript.removeEventListener('load', initializeGoogle);
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.id = 'google-signin-script';
    script.onload = initializeGoogle;
    document.body.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [role]);

  useEffect(() => () => {
    clearTimeout(passwordTypingTimerRef.current);
  }, []);

  const isIncompleteGoogleProfile = (student) => {
    const rollNumber = student?.rollNumber ? String(student.rollNumber).trim() : '';
    const photo = student?.photo ? String(student.photo).trim() : '';

    return !rollNumber || !photo || photo.startsWith('http');
  };

  const saveUserAndRedirect = (student, selectedRole) => {
    if (selectedRole === 'junior') {
      localStorage.setItem('juniorUser', JSON.stringify(student));
      localStorage.removeItem('seniorUser');
      localStorage.setItem('role', 'junior');
      localStorage.setItem('juniorUserId', student.id);
      localStorage.removeItem('seniorUserId');
    } else {
      localStorage.setItem('seniorUser', JSON.stringify(student));
      localStorage.removeItem('juniorUser');
      localStorage.setItem('role', 'senior');
      localStorage.setItem('seniorUserId', student.id);
      localStorage.removeItem('juniorUserId');
    }

    localStorage.removeItem('user');
    localStorage.removeItem('userId');

    const targetPath = isIncompleteGoogleProfile(student)
      ? `/complete-profile/${selectedRole}`
      : selectedRole === 'junior'
        ? '/juniorDashboard'
        : '/seniorDashboard';

    setTimeout(() => {
      navigate(targetPath);
    }, 1200);
  };

  const handleGoogleResponse = async (response) => {
    if (!role) {
      setErrorMessage('Role is missing');
      return;
    }

    if (!response?.credential) {
      setErrorMessage('Google signup failed');
      return;
    }

    setGoogleLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const endpoint = isJunior
      ? buildApiUrl('/api/junior/google-login')
      : buildApiUrl('/api/senior/google-login');

    try {
      const res = await axios.post(endpoint, {
        token: response.credential,
        role: role.toUpperCase(),
      });

      if (res.data.status) {
        const student = res.data.student;
        setSuccessMessage('Google signup successful! Redirecting...');
        saveUserAndRedirect(student, role);
      } else {
        setErrorMessage(res.data.message || 'Google signup failed');
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Google signup failed. Please try again.'
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const markPasswordTyping = () => {
    setPasswordTyping(true);
    clearTimeout(passwordTypingTimerRef.current);
    passwordTypingTimerRef.current = setTimeout(() => setPasswordTyping(false), 650);
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, photo: e.target.files[0] }));
  };

  const handleExpertiseChange = (subject) => {
    setFormData((prev) => {
      const selectedSubjects = prev.expertiseSubjects
        ? prev.expertiseSubjects.split(',').filter(Boolean)
        : [];
      const nextSubjects = selectedSubjects.includes(subject)
        ? selectedSubjects.filter((item) => item !== subject)
        : [...selectedSubjects, subject];

      return { ...prev, expertiseSubjects: nextSubjects.join(',') };
    });
  };

  const buildFormData = (includeOtp = false) => {
    const data = new FormData();
    data.append('name', formData.name);
    data.append('email', formData.email);
    data.append('password', formData.password);
    data.append('rollNumber', formData.rollNumber);

    if (formData.photo) {
      data.append('photo', formData.photo);
    }

    if (isSenior) {
      data.append('expertiseSubjects', formData.expertiseSubjects);
    }

    if (includeOtp) {
      data.append('otp', formData.otp);
    }

    return data;
  };

  const validateBaseForm = () => {
    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.rollNumber ||
      !formData.photo
    ) {
      setErrorMessage('All fields are required');
      return false;
    }

    if (isSenior && !formData.expertiseSubjects) {
      setErrorMessage('Please select at least one expertise subject');
      return false;
    }

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return false;
    }

    return true;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (!validateBaseForm()) {
      setLoading(false);
      return;
    }

    const endpoint = isJunior
      ? '/api/junior/send-otp'
      : '/api/senior/send-otp';

    try {
      const res = await axios.post(buildApiUrl(endpoint), buildFormData(false), {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.status === true || res.data.success === true) {
        setOtpSent(true);
        setSuccessMessage('OTP sent to your email. Please enter it below.');
      } else {
        setErrorMessage(res.data.message || 'Failed to send OTP');
      }
    } catch (err) {
      const serverMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to send OTP';

      setErrorMessage(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpAndRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.otp) {
      setErrorMessage('Please enter OTP');
      setLoading(false);
      return;
    }

    const endpoint = isJunior
      ? '/api/junior/verify-otp-register'
      : '/api/senior/verify-otp-register';

    try {
      const res = await axios.post(buildApiUrl(endpoint), buildFormData(true), {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.status === true || res.data.success === true) {
        setSuccessMessage(res.data.message || 'Registration successful!');
        setTimeout(() => {
          navigate(`/login/${role}`);
        }, 1800);
      } else {
        setErrorMessage(res.data.message || 'Registration failed');
      }
    } catch (err) {
      const serverMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Registration failed';

      setErrorMessage(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  const selectedExpertiseSubjects = formData.expertiseSubjects
    ? formData.expertiseSubjects.split(',').filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased overflow-x-hidden ea-onboarding-shell">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm ea-command-nav">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex justify-between items-center">
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md transform group-hover:rotate-12 transition duration-300">
              EA
            </div>
            <span className="text-2xl font-extrabold bg-gradient-to-r from-indigo-700 to-blue-600 bg-clip-text text-transparent">
              Edu Assist
            </span>
          </a>

          <div className="hidden md:flex items-center gap-6">
            <a href="/" className="text-gray-700 hover:text-indigo-600 font-medium transition">
              Home
            </a>
            <a href="/help" className="text-gray-700 hover:text-indigo-600 font-medium transition">
              Help
            </a>
            <a
              href={`/login/${role}`}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-medium shadow-md transition"
            >
              Login
            </a>
          </div>
        </div>
      </nav>

      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-700 pt-24 overflow-hidden ea-auth-stage">
        <AuthPortalScene variant={isJunior ? 'junior' : 'senior'} />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div className="ea-auth-copy">
              <div className="inline-block mb-6">
                <span className="bg-indigo-500/40 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold border border-indigo-400/40">
                  {isJunior ? 'Junior Registration' : 'Senior Registration'}
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tight text-white">
                Create Your
                <br />
                <span className="bg-gradient-to-r from-indigo-300 to-blue-300 text-transparent bg-clip-text">
                  Edu Assist Account
                </span>
              </h1>

              <p className="text-lg md:text-xl text-indigo-100 max-w-xl leading-relaxed">
                {isJunior
                  ? 'Register as a junior student to post doubts, track solutions, and connect with seniors.'
                  : 'Register as a senior student, choose your expertise subjects, and help juniors solve doubts.'}
              </p>

              <div className="mt-10 space-y-4">
                <div className="flex items-center gap-3 text-indigo-100">
                  <span className="text-xl ea-accent-text">+</span>
                  <span>Email OTP verification for secure registration</span>
                </div>
                <div className="flex items-center gap-3 text-indigo-100">
                  <span className="text-xl ea-accent-text">+</span>
                  <span>College email users are auto verified</span>
                </div>
                <div className="flex items-center gap-3 text-indigo-100">
                  <span className="text-xl ea-accent-text">+</span>
                  <span>{isSenior ? 'Expertise-based doubt matching' : 'Verified seniors help solve your doubts'}</span>
                </div>
              </div>

              <div className="hidden lg:block mt-10 max-w-sm rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between text-indigo-100 text-sm font-semibold">
                  <span>Profile XP</span>
                  <span>{otpSent ? '100%' : '50%'}</span>
                </div>
                <div className="ea-level-bar mt-3">
                  <span style={{ width: otpSent ? '100%' : '50%' }} />
                </div>
                <p className="mt-4 text-sm text-indigo-100">
                  Complete the checkpoint, verify your email, and enter the platform ready to play your role.
                </p>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end py-10 lg:py-0">
              <div className="w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/30 p-8 md:p-10 text-gray-900 ea-command-panel ea-auth-card">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-4">
                    EA
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {isJunior ? 'Junior Registration' : 'Senior Registration'}
                  </h2>
                  <p className="text-gray-600 mt-2">
                    {otpSent ? 'Enter the OTP sent to your email' : 'Fill your details to continue'}
                  </p>
                  <div className="mt-5 ea-level-bar" aria-label={otpSent ? 'Registration step 2 of 2' : 'Registration step 1 of 2'}>
                    <span style={{ width: otpSent ? '100%' : '50%' }} />
                  </div>
                  <div className="ea-auth-progress-dots" aria-hidden="true">
                    <span className="is-active">Profile Build</span>
                    <span className={otpSent ? 'is-active' : ''}>OTP Unlock</span>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-indigo-600">
                    {otpSent ? 'Step 2 of 2 - Verify and unlock access' : 'Step 1 of 2 - Build your student profile'}
                  </p>
                </div>

                <form
                  onSubmit={otpSent ? handleVerifyOtpAndRegister : handleSendOtp}
                  className="space-y-5"
                >
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="ea-auth-field">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        name="name"
                        type="text"
                        placeholder="Enter your name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        disabled={otpSent}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-gray-100 disabled:text-gray-500"
                      />
                    </div>

                    <div className="ea-auth-field">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={otpSent}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-gray-100 disabled:text-gray-500"
                      />
                    </div>

                    <div className="ea-auth-field ea-password-field">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          name="password"
                          type={showRegisterPassword ? 'text' : 'password'}
                          placeholder="Minimum 6 characters"
                          value={formData.password}
                          onChange={(e) => {
                            handleChange(e);
                            markPasswordTyping();
                          }}
                          onFocus={() => setPasswordFocused(true)}
                          onBlur={() => setPasswordFocused(false)}
                          required
                          disabled={otpSent}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-gray-100 disabled:text-gray-500"
                        />
                        <PasswordSentinel
                          visible={showRegisterPassword}
                          focused={passwordFocused}
                          typing={passwordTyping}
                        />
                        <button
                          type="button"
                          disabled={otpSent}
                          onClick={() => setShowRegisterPassword((visible) => !visible)}
                          aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50 ea-password-toggle"
                        >
                          {showRegisterPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>

                    <div className="ea-auth-field">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Roll Number
                      </label>
                      <input
                        name="rollNumber"
                        type="text"
                        placeholder="Enter your roll number"
                        value={formData.rollNumber}
                        onChange={handleChange}
                        required
                        disabled={otpSent}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition disabled:bg-gray-100 disabled:text-gray-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Profile Photo
                    </label>
                    <label
                      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition ${
                        otpSent
                          ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'border-indigo-200 bg-indigo-50/60 hover:border-indigo-400 hover:bg-indigo-50'
                      }`}
                    >
                      <span className="font-semibold text-gray-800">
                        {formData.photo ? formData.photo.name : 'Click to upload your profile photo'}
                      </span>
                      <span className="mt-1 text-sm text-gray-500">
                        JPG, PNG, or image file
                      </span>
                      <input
                        type="file"
                        onChange={handleFileChange}
                        required
                        disabled={otpSent}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {isSenior && (
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-800">
                            Expertise Subjects
                          </label>
                          <p className="text-sm text-gray-600 mt-1">
                            Select the subjects you are confident to solve.
                          </p>
                        </div>
                        <span className="text-xs font-semibold bg-white text-indigo-700 px-3 py-1 rounded-full border border-indigo-100 w-fit">
                          {selectedExpertiseSubjects.length} selected
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {expertiseOptions.map((subject) => {
                          const selected = selectedExpertiseSubjects.includes(subject);
                          return (
                            <label
                              key={subject}
                              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                                selected
                                  ? 'border-indigo-500 bg-white text-indigo-700 shadow-sm'
                                  : 'border-gray-200 bg-white/70 text-gray-700 hover:border-indigo-300 hover:bg-white'
                              } ${otpSent ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <input
                                type="checkbox"
                                value={subject}
                                checked={selected}
                                onChange={() => handleExpertiseChange(subject)}
                                disabled={otpSent}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed"
                              />
                              <span>{subject}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {otpSent && (
                    <div className="ea-auth-field">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Enter OTP
                      </label>
                      <input
                        name="otp"
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={formData.otp}
                        onChange={handleChange}
                        required
                        maxLength={6}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition ea-otp-field"
                      />
                    </div>
                  )}

                  {successMessage && (
                    <Feedback type="success">{successMessage}</Feedback>
                  )}

                  {errorMessage && (
                    <Feedback type="error">{errorMessage}</Feedback>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3.5 rounded-xl font-semibold shadow-lg transition transform ea-auth-submit ${
                      loading
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : isJunior
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-[1.02]'
                          : 'bg-purple-600 hover:bg-purple-700 text-white hover:scale-[1.02]'
                    }`}
                  >
                    {loading && <span className="ea-auth-button-loader" aria-hidden="true" />}
                    {loading
                      ? otpSent
                        ? 'Verifying OTP...'
                        : 'Sending OTP...'
                      : otpSent
                        ? 'Verify OTP & Register'
                        : 'Send OTP'}
                  </button>

                  {otpSent && (
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setFormData((prev) => ({ ...prev, otp: '' }));
                        setErrorMessage('');
                        setSuccessMessage('');
                      }}
                      className="w-full py-3 rounded-xl font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
                    >
                      Edit Details
                    </button>
                  )}
                </form>

                <div className="my-6 flex items-center gap-4">
                  <div className="h-px flex-1 bg-gray-300"></div>
                  <span className="text-sm text-gray-500">or</span>
                  <div className="h-px flex-1 bg-gray-300"></div>
                </div>

                {!GOOGLE_CLIENT_ID ? (
                  <p className="text-sm text-red-600 text-center">
                    Google Client ID is missing in frontend environment.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      <div ref={googleButtonRef}></div>
                    </div>
                    {googleLoading && (
                      <p className="text-sm text-indigo-600 text-center font-medium">
                        Continuing with Google...
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-6 text-center space-y-2">
                  <p className="text-sm text-gray-600">
                    Already have an account?
                  </p>
                  <a
                    href={`/login/${role}`}
                    className="text-indigo-600 hover:text-indigo-700 font-medium transition"
                  >
                    Go to Login
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RegisterPage;
