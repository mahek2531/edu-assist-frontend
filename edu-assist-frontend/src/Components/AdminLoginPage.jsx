import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../lib/api';
import { AuthPortalScene, Feedback, PasswordSentinel } from './ui/GameUI';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [passwordTyping, setPasswordTyping] = useState(false);
  const passwordTypingTimerRef = useRef(null);

  useEffect(() => () => {
    clearTimeout(passwordTypingTimerRef.current);
  }, []);

  const markPasswordTyping = () => {
    setPasswordTyping(true);
    clearTimeout(passwordTypingTimerRef.current);
    passwordTypingTimerRef.current = setTimeout(() => setPasswordTyping(false), 650);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await axios.post(buildApiUrl('/api/admin/login'), {
        email: email.trim(),
        password,
      });

      const responseData = res.data;

      const adminData =
        responseData?.admin ||
        responseData?.user ||
        responseData?.data ||
        responseData?.student ||
        (responseData?.id ? responseData : null);

      const isSuccess =
        responseData?.success === true ||
        responseData?.status === true ||
        !!adminData;

      if (isSuccess && adminData) {
        localStorage.setItem('admin', JSON.stringify(adminData));
        localStorage.setItem('role', 'admin');
        navigate('/dashboard');
      } else {
        setErrorMsg(responseData?.message || 'Invalid email or password');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setErrorMsg(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Login failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased overflow-x-hidden ea-onboarding-shell">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm ea-command-nav">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex justify-between items-center">
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md transform group-hover:rotate-12 transition duration-300">
              EA
            </div>
            <span className="text-2xl font-extrabold text-gray-900 tracking-tight relative">
              Edu Assist
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 group-hover:w-full transition-all duration-300"></span>
            </span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            <a href="/" className="text-gray-700 hover:text-indigo-700 font-medium transition">
              Home
            </a>
            <a href="/help" className="text-gray-700 hover:text-indigo-700 font-medium transition">
              Help
            </a>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 md:pt-40 md:pb-28 bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-950 text-white relative overflow-hidden min-h-screen flex items-center ea-auth-stage">
        <AuthPortalScene variant="admin" />
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div className="ea-auth-copy">
              <div className="inline-block mb-6">
                <span className="bg-indigo-500/40 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold border border-indigo-400/40">
                  Admin Portal
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
                Welcome Back
                <br />
                <span className="bg-gradient-to-r from-indigo-300 to-blue-300 text-transparent bg-clip-text">
                  Admin Login
                </span>
              </h1>

              <p className="text-lg md:text-xl text-indigo-100 max-w-xl leading-relaxed">
                Access the Edu Assist admin panel to manage student verification,
                monitor doubts, review help requests, and keep the platform running smoothly.
              </p>

              <div className="mt-10 space-y-4">
                <div className="flex items-center gap-3 text-indigo-100">
                  <span className="text-xl ea-accent-text">+</span>
                  <span>Verify junior and senior registrations</span>
                </div>
                <div className="flex items-center gap-3 text-indigo-100">
                  <span className="text-xl ea-accent-text">+</span>
                  <span>Manage pending doubts and approvals</span>
                </div>
                <div className="flex items-center gap-3 text-indigo-100">
                  <span className="text-xl ea-accent-text">+</span>
                  <span>Review student help and support requests</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/30 p-8 md:p-10 text-gray-900 ea-command-panel ea-auth-card">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-4">
                    EA
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">Admin Sign In</h2>
                  <p className="text-gray-600 mt-2">Enter your credentials to continue</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="ea-auth-field">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="Enter admin email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          markPasswordTyping();
                        }}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      />
                      <PasswordSentinel
                        visible={showPassword}
                        focused={passwordFocused}
                        typing={passwordTyping}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((visible) => !visible)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 ea-password-toggle"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  {errorMsg && (
                    <Feedback type="error">{errorMsg}</Feedback>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3.5 rounded-xl font-semibold shadow-lg transition transform ea-auth-submit ${
                      loading
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-[1.02]'
                    }`}
                  >
                    {loading && <span className="ea-auth-button-loader" aria-hidden="true" />}
                    {loading ? 'Logging in...' : 'Login'}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <a
                    href="/"
                    className="text-indigo-600 hover:text-indigo-700 font-medium transition"
                  >
                    Back to Homepage
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

export default AdminLogin;
