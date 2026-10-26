import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { FiLock, FiEye, FiEyeOff, FiCheckCircle, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';
import axios from 'axios';
import { serverUrl } from '../App';

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password strength logic
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
  const strengthColors = ['bg-gray-300', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${serverUrl}/api/auth/reset-password`, {
        token,
        password,
        confirmPassword
      });

      setSuccess(response.data.message || 'Password reset successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/auth');
      }, 2500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password. The link may have expired.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black px-4 sm:px-8 flex flex-col justify-between py-8">
      {/* HEADER */}
      <motion.header
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl w-full mx-auto rounded-2xl bg-black/90 backdrop-blur-xl border border-white/10 px-8 py-5 shadow-[0_20px_45px_rgba(0,0,0,0.6)] flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-gray-300 to-white bg-clip-text text-transparent">
            Edu<span className="text-indigo-400">Note</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Set a new account password</p>
        </div>
        <Link
          to="/auth"
          className="text-xs sm:text-sm text-gray-300 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <FiArrowLeft /> Back to Login
        </Link>
      </motion.header>

      {/* FORM CARD */}
      <main className="max-w-md w-full mx-auto my-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl p-8 bg-gradient-to-br from-black/95 via-black/90 to-black/95 backdrop-blur-2xl border border-white/10 shadow-[0_25px_70px_rgba(0,0,0,0.7)] text-white"
        >
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-3">
              <FiLock className="text-xl text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Reset Password</h2>
            <p className="text-sm text-gray-400 mt-1">Enter your new secure password below</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm flex items-start gap-2.5"
            >
              <FiAlertCircle className="text-lg shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-start gap-2.5"
            >
              <FiCheckCircle className="text-lg shrink-0 mt-0.5 text-emerald-400" />
              <span>{success}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div>
              <label htmlFor="reset-new-password" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                New Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="reset-new-password"
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
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              {/* Password strength meter */}
              {password && (
                <div className="mt-2.5">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400">Strength:</span>
                    <span className="font-medium text-gray-200">{strengthLabels[strength]}</span>
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="reset-confirm-password" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="reset-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading || !!success}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold text-sm shadow-[0_10px_30px_rgba(99,102,241,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </motion.button>
          </form>
        </motion.div>
      </main>

      {/* FOOTER */}
      <footer className="text-center text-xs text-gray-400">
        EduNote &copy; {new Date().getFullYear()} &bull; AI-Powered Revision & Exam Preparation
      </footer>
    </div>
  );
}

export default ResetPassword;
