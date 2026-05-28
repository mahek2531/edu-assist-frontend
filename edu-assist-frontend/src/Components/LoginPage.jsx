import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { buildApiUrl, GOOGLE_CLIENT_ID } from '../lib/api';
import { AuthPortalScene, Feedback, GameModal, PasswordSentinel } from './ui/GameUI';

const LoginPage = () => {
  const { role: routeRole } = useParams();
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);

  const validRole =
    routeRole === 'junior' || routeRole === 'senior' ? routeRole : null;

  const [role, setRole] = useState(validRole);
  const isJunior = role === 'junior';

  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  const [forgotData, setForgotData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showForgotNewPass, setShowForgotNewPass] = useState(false);
  const [showForgotConfirmPass, setShowForgotConfirmPass] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState({
    login: false,
    forgotNew: false,
    forgotConfirm: false,
  });
  const [typingField, setTypingField] = useState('');
  const typingTimerRef = useRef({});

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setRole(validRole);
  }, [validRole]);

  useEffect(() => () => {
    Object.values(typingTimerRef.current).forEach(clearTimeout);
  }, []);

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
        text: 'continue_with',
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
      setErrorMsg('Role is missing');
      return;
    }

    if (!response?.credential) {
      setErrorMsg('Google login failed');
      return;
    }

    setGoogleLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const endpoint =
      role === 'junior'
        ? buildApiUrl('/api/junior/google-login')
        : buildApiUrl('/api/senior/google-login');

    try {
      const res = await axios.post(endpoint, {
        token: response.credential,
        role: role.toUpperCase(),
      });

      if (res.data.status) {
        const student = res.data.student;
        setSuccessMsg('Google login successful! Redirecting...');
        saveUserAndRedirect(student, role);
      } else {
        setErrorMsg(res.data.message || 'Google login failed');
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || 'Google login failed. Please try again.'
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleForgotChange = (e) => {
    const { name, value } = e.target;
    setForgotData((prev) => ({ ...prev, [name]: value }));
  };

  const markPasswordTyping = (field) => {
    setTypingField(field);
    clearTimeout(typingTimerRef.current[field]);
    typingTimerRef.current[field] = setTimeout(() => {
      setTypingField((current) => (current === field ? '' : current));
    }, 650);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (!role) {
      setErrorMsg('Role is missing');
      setLoading(false);
      return;
    }

    const endpoint =
      role === 'junior'
        ? buildApiUrl('/api/junior/login')
        : buildApiUrl('/api/senior/login');

    try {
      const res = await axios.post(endpoint, loginData);

      if (res.data.status) {
        const student = res.data.student;
        setSuccessMsg('Login successful! Redirecting...');
        saveUserAndRedirect(student, role);
      } else {
        setErrorMsg(res.data.message || 'Login failed');
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || 'Invalid credentials or server error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const { email, newPassword, confirmPassword } = forgotData;

    if (!role) return setErrorMsg('Role is missing');
    if (!email.trim()) return setErrorMsg('Email is required');
    if (!newPassword || !confirmPassword) {
      return setErrorMsg('Both password fields are required');
    }
    if (newPassword !== confirmPassword) {
      return setErrorMsg('Passwords do not match');
    }
    if (newPassword.length < 6) {
      return setErrorMsg('Password must be at least 6 characters');
    }

    const forgotEndpoint =
      role === 'junior'
        ? buildApiUrl('/api/junior/forgotPassword')
        : buildApiUrl('/api/senior/forgotPassword');

    try {
      const res = await axios.post(forgotEndpoint, {
        email: email.trim(),
        newPassword,
        confirmPassword,
      });

      if (res.data.status) {
        setSuccessMsg(res.data.message || 'Password updated successfully!');
        setTimeout(() => {
          setShowForgotPassword(false);
          setForgotData({
            email: '',
            newPassword: '',
            confirmPassword: '',
          });
        }, 2000);
      } else {
        setErrorMsg(res.data.message || 'Failed to reset password');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error resetting password');
    }
  };

  if (!role) {
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
            </div>
          </div>
        </nav>

        <section className="relative min-h-screen flex items-center bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-700 pt-24 overflow-hidden ea-auth-stage">
          <AuthPortalScene variant="student" />
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
                    Student Login Portal
                  </span>
                </div>

                <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tight text-white">
                  Welcome Back
                  <br />
                  <span className="bg-gradient-to-r from-indigo-300 to-blue-300 text-transparent bg-clip-text">
                    to Edu Assist
                  </span>
                </h1>

                <p className="text-lg md:text-xl text-indigo-100 max-w-xl leading-relaxed">
                  Select your student role to continue to your login page and access the Edu Assist platform.
                </p>

                <div className="mt-10 space-y-4">
                  <div className="flex items-center gap-3 text-indigo-100">
                    <span className="text-xl ea-accent-text">+</span>
                    <span>Junior students can ask doubts and learn</span>
                  </div>
                  <div className="flex items-center gap-3 text-indigo-100">
                    <span className="text-xl ea-accent-text">+</span>
                    <span>Senior students can answer and mentor juniors</span>
                  </div>
                  <div className="flex items-center gap-3 text-indigo-100">
                    <span className="text-xl ea-accent-text">+</span>
                    <span>Quick and simple role-based login</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center lg:justify-end">
                <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/30 p-8 md:p-10 text-gray-900 ea-command-panel ea-auth-card">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-4">
                      EA
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      Choose Login Type
                    </h2>
                    <p className="text-gray-600 mt-2">
                      Continue as Junior or Senior student
                    </p>
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={() => navigate('/login/junior')}
                      className="w-full py-3.5 rounded-xl font-semibold shadow-lg transition transform bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-[1.02]"
                    >
                      Login as Junior
                    </button>

                    <button
                      onClick={() => navigate('/login/senior')}
                      className="w-full py-3.5 rounded-xl font-semibold shadow-lg transition transform bg-purple-600 hover:bg-purple-700 text-white hover:scale-[1.02]"
                    >
                      Login as Senior
                    </button>
                  </div>

                  <div className="mt-6 text-center space-y-2">
                    <p className="text-sm text-gray-600">
                      New here?
                    </p>
                    <a
                      href="/"
                      className="text-indigo-600 hover:text-indigo-700 font-medium transition"
                    >
                      Go to Home
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

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
              href={role === 'junior' ? '/register/junior' : '/register/senior'}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-medium shadow-md transition"
            >
              Register
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
                  {isJunior ? 'Junior Login' : 'Senior Login'}
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tight text-white">
                Sign In to
                <br />
                <span className="bg-gradient-to-r from-indigo-300 to-blue-300 text-transparent bg-clip-text">
                  Edu Assist
                </span>
              </h1>

              <p className="text-lg md:text-xl text-indigo-100 max-w-xl leading-relaxed">
                Access your {isJunior ? 'junior' : 'senior'} account to continue using the Edu Assist platform.
              </p>

              <div className="mt-10 space-y-4">
                <div className="flex items-center gap-3 text-indigo-100">
                  <span className="text-xl ea-accent-text">+</span>
                  <span>Secure role-based login access</span>
                </div>
                <div className="flex items-center gap-3 text-indigo-100">
                  <span className="text-xl ea-accent-text">+</span>
                  <span>Reset your password easily if needed</span>
                </div>
                <div className="flex items-center gap-3 text-indigo-100">
                  <span className="text-xl ea-accent-text">+</span>
                  <span>Continue directly to your dashboard</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
                <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/30 p-8 md:p-10 text-gray-900 ea-command-panel ea-auth-card">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-4">
                    EA
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {isJunior ? 'Junior Login' : 'Senior Login'}
                  </h2>
                  <p className="text-gray-600 mt-2">
                    Enter your details to continue
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="ea-auth-field">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      value={loginData.email}
                      onChange={handleLoginChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    />
                  </div>

                  <div className="ea-auth-field ea-password-field">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => {
                          handleLoginChange(e);
                          markPasswordTyping('login');
                        }}
                        onFocus={() => setPasswordFocus((prev) => ({ ...prev, login: true }))}
                        onBlur={() => setPasswordFocus((prev) => ({ ...prev, login: false }))}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition pr-12"
                      />
                      <PasswordSentinel
                        visible={showLoginPassword}
                        focused={passwordFocus.login}
                        typing={typingField === 'login'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 ea-password-toggle"
                      >
                        {showLoginPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {successMsg && (
                    <Feedback type="success">{successMsg}</Feedback>
                  )}

                  {errorMsg && (
                    <Feedback type="error">{errorMsg}</Feedback>
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
                    {loading ? 'Logging in...' : 'Login'}
                  </button>
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
                        Signing in with Google...
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-6 text-center space-y-2">
                  <p className="text-sm text-gray-600">
                    Don't have an account?
                  </p>
                  <a
                    href={role === 'junior' ? '/register/junior' : '/register/senior'}
                    className="text-indigo-600 hover:text-indigo-700 font-medium transition"
                  >
                    Go to Register
                  </a>
                </div>

                <div className="mt-3 text-center">
                  <button
                    onClick={() => navigate('/login')}
                    className="text-sm text-gray-500 hover:text-gray-700 transition"
                  >
                    Change Login Type
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {showForgotPassword && (
        <GameModal className="p-8 relative ea-auth-card">
            <button
              onClick={() => setShowForgotPassword(false)}
              className="absolute top-4 right-5 text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              ×
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Reset Password
            </h2>
            <p className="text-gray-600 mb-8">
              Enter your email and set a new password
            </p>

            <form onSubmit={handleForgotSubmit} className="space-y-5">
              <div className="ea-auth-field">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={forgotData.email}
                  onChange={handleForgotChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>

              <div className="ea-auth-field ea-password-field">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showForgotNewPass ? 'text' : 'password'}
                    name="newPassword"
                    placeholder="Enter new password"
                    value={forgotData.newPassword}
                    onChange={(e) => {
                      handleForgotChange(e);
                      markPasswordTyping('forgotNew');
                    }}
                    onFocus={() => setPasswordFocus((prev) => ({ ...prev, forgotNew: true }))}
                    onBlur={() => setPasswordFocus((prev) => ({ ...prev, forgotNew: false }))}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition pr-12"
                  />
                  <PasswordSentinel
                    visible={showForgotNewPass}
                    focused={passwordFocus.forgotNew}
                    typing={typingField === 'forgotNew'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowForgotNewPass(!showForgotNewPass)}
                    aria-label={showForgotNewPass ? 'Hide new password' : 'Show new password'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 ea-password-toggle"
                  >
                    {showForgotNewPass ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="ea-auth-field ea-password-field">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showForgotConfirmPass ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Confirm new password"
                    value={forgotData.confirmPassword}
                    onChange={(e) => {
                      handleForgotChange(e);
                      markPasswordTyping('forgotConfirm');
                    }}
                    onFocus={() => setPasswordFocus((prev) => ({ ...prev, forgotConfirm: true }))}
                    onBlur={() => setPasswordFocus((prev) => ({ ...prev, forgotConfirm: false }))}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition pr-12"
                  />
                  <PasswordSentinel
                    visible={showForgotConfirmPass}
                    focused={passwordFocus.forgotConfirm}
                    typing={typingField === 'forgotConfirm'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowForgotConfirmPass(!showForgotConfirmPass)}
                    aria-label={showForgotConfirmPass ? 'Hide confirm password' : 'Show confirm password'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 ea-password-toggle"
                  >
                    {showForgotConfirmPass ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {successMsg && (
                <Feedback type="success">{successMsg}</Feedback>
              )}

              {errorMsg && (
                <Feedback type="error">{errorMsg}</Feedback>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="w-1/2 py-3 rounded-xl font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`w-1/2 py-3 rounded-xl font-semibold text-white transition ea-auth-submit ${
                    isJunior
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  Reset
                </button>
              </div>
            </form>
        </GameModal>
      )}
    </div>
  );
};

export default LoginPage;
