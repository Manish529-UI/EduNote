import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setUserData } from '../redux/userSlice';
import { serverUrl } from '../App';

function Auth() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'forgot'

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sync mode with URL search params
  useEffect(() => {
    const urlMode = searchParams.get('mode');
    if (urlMode === 'register' || urlMode === 'login' || urlMode === 'forgot') {
      setMode(urlMode);
    }
  }, [searchParams]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setSearchParams({ mode: newMode });
  };

  // Password strength calculation
  const calculateStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = calculateStrength(password);
  const strengthLabels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-gray-400', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'];

  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please provide a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your confirm password.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${serverUrl}/api/auth/register`,
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          confirmPassword
        },
        { withCredentials: true }
      );

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      setSuccess('Account created successfully! Redirecting...');
      dispatch(setUserData(response.data.user));

      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${serverUrl}/api/auth/login`,
        {
          email: email.trim().toLowerCase(),
          password
        },
        { withCredentials: true }
      );

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      setSuccess('Logged in successfully! Redirecting...');
      dispatch(setUserData(response.data.user));

      setTimeout(() => {
        navigate('/', { replace: true });
      }, 800);
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${serverUrl}/api/auth/forgot-password`,
        { email: email.trim().toLowerCase() },
        { withCredentials: true }
      );

      setSuccess(
        response.data.message ||
          'If an account with that email exists, password reset instructions have been sent.'
      );
    } catch (err) {
      const msg = err.response?.data?.message || 'Error processing your request. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-black px-4 sm:px-8 py-6 flex flex-col justify-between">
      {/* HEADER */}
      <motion.header
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.0 }}
        className="max-w-7xl w-full mx-auto rounded-2xl bg-black/90 backdrop-blur-xl border border-white/10 px-6 sm:px-8 py-5 shadow-[0_20px_45px_rgba(0,0,0,0.6)] flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-gray-300 to-white bg-clip-text text-transparent">
            Edu<span className="text-indigo-400">Note</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 mt-0.5">AI-powered exam-oriented notes & revision</p>
        </div>

        <div className="flex items-center gap-2 text-xs sm:text-sm">
          {mode === 'login' && (
            <button
              onClick={() => switchMode('register')}
              className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium border border-white/15 transition-all cursor-pointer"
            >
              Create Account
            </button>
          )}
          {mode === 'register' && (
            <button
              onClick={() => switchMode('login')}
              className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium border border-white/15 transition-all cursor-pointer"
            >
              Sign In
            </button>
          )}
          {mode === 'forgot' && (
            <button
              onClick={() => switchMode('login')}
              className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium border border-white/15 transition-all cursor-pointer flex items-center gap-1"
            >
              <FiArrowLeft /> Back to Login
            </button>
          )}
        </div>
      </motion.header>

      {/* MAIN CONTENT GRID */}
      <main className="max-w-7xl w-full mx-auto py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* LEFT COLUMN: AUTH FORM */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg mx-auto"
        >
          <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-black/95 via-black/90 to-black/95 backdrop-blur-2xl border border-white/10 shadow-[0_25px_70px_rgba(0,0,0,0.7)] text-white">
            {/* Mode Switcher Tabs */}
            {mode !== 'forgot' && (
              <div className="flex bg-white/5 p-1 rounded-xl mb-6 border border-white/10">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-white text-black shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                    mode === 'register'
                      ? 'bg-white text-black shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}

            {/* Title / Description */}
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {mode === 'login' && 'Welcome Back'}
                {mode === 'register' && 'Create Your Account'}
                {mode === 'forgot' && 'Reset Password'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                {mode === 'login' && 'Sign in with your email and password to access your notes.'}
                {mode === 'register' && 'Get 50 free credits instantly to generate high-yield revision notes.'}
                {mode === 'forgot' && 'Enter your registered email and we will send you a reset link.'}
              </p>
            </div>

            {/* Feedback Alerts */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="err"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-5 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs sm:text-sm flex items-start gap-2.5"
                >
                  <FiAlertCircle className="text-base sm:text-lg shrink-0 mt-0.5 text-red-400" />
                  <span>{error}</span>
                </motion.div>
              )}
              {success && (
                <motion.div
                  key="succ"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-5 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-start gap-2.5"
                >
                  <FiCheckCircle className="text-base sm:text-lg shrink-0 mt-0.5 text-emerald-400" />
                  <span>{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* FORMS */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="login-password" className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold text-sm shadow-[0_10px_25px_rgba(99,102,241,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing In...
                    </span>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <FiArrowRight />
                    </>
                  )}
                </motion.button>

                <p className="text-center text-xs text-gray-400 pt-2">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="text-white hover:underline font-semibold cursor-pointer"
                  >
                    Create Account
                  </button>
                </p>
              </form>
            )}

            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label htmlFor="reg-name" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="reg-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-email" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="reg-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-password" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>

                  {/* Password strength meter */}
                  {password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-400">Strength:</span>
                        <span className="font-medium text-gray-300">{strengthLabels[strength]}</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden flex gap-1">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`h-full flex-1 rounded-full transition-all duration-300 ${
                              strength >= step ? strengthColors[strength] : 'bg-transparent'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="reg-confirm-password" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="reg-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-400 mt-1">Passwords do not match.</p>
                  )}
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold text-sm shadow-[0_10px_25px_rgba(99,102,241,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating Account...
                    </span>
                  ) : (
                    <>
                      <span>Create Account (50 Free Credits)</span>
                      <FiArrowRight />
                    </>
                  )}
                </motion.button>

                <p className="text-center text-xs text-gray-400 pt-2">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-white hover:underline font-semibold cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
              </form>
            )}

            {mode === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold text-sm shadow-[0_10px_25px_rgba(99,102,241,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending Instructions...
                    </span>
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <FiArrowRight />
                    </>
                  )}
                </motion.button>

                <p className="text-center text-xs text-gray-400 pt-2">
                  Remember your password?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-white hover:underline font-semibold cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </p>
              </form>
            )}
          </div>

          <p className="mt-5 text-center text-xs text-gray-500">
            Start with 50 free credits &bull; Secure bcrypt encryption &bull; Instant access
          </p>
        </motion.div>

        {/* RIGHT COLUMN: 3D FEATURE CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Feature icon="🎁" title="50 Free Credits" des="Start with 50 credits to generate notes without paying." />
          <Feature icon="📘" title="Exam Notes" des="High-yield, revision-ready exam-oriented notes." />
          <Feature icon="📂" title="Project Notes" des="Well-structured documentation for assignments & projects." />
          <Feature icon="📊" title="Charts & Graphs" des="Auto-generated diagrams, charts and flow graphs." />
          <div className="sm:col-span-2">
            <Feature icon="⬇️" title="Free PDF Download" des="Download clean, printable PDFs instantly with organized headings." />
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="text-center text-xs text-gray-400 mt-6">
        EduNote &copy; {new Date().getFullYear()} &bull; AI-Powered Revision & Exam Preparation
      </footer>
    </div>
  );
}

function Feature({ icon, title, des }) {
  return (
    <motion.div
      whileHover={{ y: -8, rotateX: 6, rotateY: -6, scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      className="relative rounded-2xl p-6 bg-gradient-to-br from-black/90 via-black/80 to-black/90 backdrop-blur-2xl border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.7)] text-white"
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="relative z-10" style={{ transform: 'translateZ(25px)' }}>
        <div className="text-3xl mb-3">{icon}</div>
        <h3 className="text-base font-semibold mb-1.5">{title}</h3>
        <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">{des}</p>
      </div>
    </motion.div>
  );
}

export default Auth;
