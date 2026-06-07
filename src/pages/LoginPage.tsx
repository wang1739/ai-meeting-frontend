import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoginData {
  email: string;
  password: string;
}

interface LoginError {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const [formData, setFormData] = useState<LoginData>({ email: '', password: '' });
  const [errors, setErrors] = useState<LoginError>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const validateEmail = (email: string): string | undefined => {
    if (!email) return '请输入邮箱';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return '请输入有效的邮箱地址';
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return '请输入密码';
    if (password.length < 6) return '密码至少需要6个字符';
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: LoginError = {};
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;
    setErrors(newErrors);
    return !emailError && !passwordError;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await login(formData.email, formData.password);

      if (rememberMe) {
        localStorage.setItem('remember_me', 'true');
      }

      // 成功动画
      setShowSuccess(true);
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1000);
    } catch (error: any) {
      setErrors({ general: error.message || '网络错误，请稍后重试' });
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof LoginData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] dark:bg-[#0F172A]">
      {/* 渐变背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-500/10 to-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md mx-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Logo 区域 */}
          <div className="text-center mb-8">
            <motion.div
              className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <span className="text-white text-2xl font-bold">AI</span>
            </motion.div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">AI智能会议助手</h1>
            <p className="text-[var(--text-secondary)] mt-1">登录您的账户</p>
          </div>

          {/* 主卡片 */}
          <div className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--shadow-lg)] p-8 border border-[var(--border-color)]">
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                {/* 邮箱输入 */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    邮箱
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      onKeyDown={handleKeyDown}
                      className={`w-full h-12 px-4 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                        errors.email
                          ? 'border-red-300 focus:ring-red-200/50 bg-red-50/50 dark:bg-red-900/10'
                          : 'border-[var(--border-color)] focus:ring-indigo-200/50 dark:focus:ring-indigo-500/30'
                      }`}
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        boxShadow: errors.email ? 'none' : '0 0 0 3px rgba(79, 70, 229, 0.1)',
                      }}
                      placeholder="请输入邮箱"
                      disabled={isLoading}
                    />
                    {!errors.email && formData.email && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <AnimatePresence>
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-1.5 text-sm text-red-500"
                      >
                        {errors.email}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* 密码输入 */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    密码
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      onKeyDown={handleKeyDown}
                      className={`w-full h-12 px-4 pr-12 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                        errors.password
                          ? 'border-red-300 focus:ring-red-200/50 bg-red-50/50 dark:bg-red-900/10'
                          : 'border-[var(--border-color)] focus:ring-indigo-200/50 dark:focus:ring-indigo-500/30'
                      }`}
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        boxShadow: errors.password ? 'none' : '0 0 0 3px rgba(79, 70, 229, 0.1)',
                      }}
                      placeholder="请输入密码"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <AnimatePresence>
                    {errors.password && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-1.5 text-sm text-red-500"
                      >
                        {errors.password}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* 记住我和忘记密码 */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        rememberMe
                          ? 'bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] border-transparent'
                          : 'border-[var(--border-color)] bg-[var(--bg-primary)] group-hover:border-indigo-400'
                      }`}
                      onClick={() => setRememberMe(!rememberMe)}
                    >
                      <AnimatePresence>
                        {rememberMe && (
                          <motion.svg
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </motion.svg>
                        )}
                      </AnimatePresence>
                    </div>
                    <span className="text-sm text-[var(--text-secondary)]">记住我</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-[#3B82F6] hover:text-[#2563EB] hover:underline transition-colors"
                  >
                    忘记密码？
                  </button>
                </div>

                {/* 全局错误提示 */}
                <AnimatePresence>
                  {errors.general && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -10, height: 0 }}
                      className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2"
                    >
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                      <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 成功提示 */}
                <AnimatePresence>
                  {showSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -10, height: 0 }}
                      className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center justify-center gap-2"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                      >
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </motion.div>
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">登录成功，正在跳转...</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 登录按钮 */}
                <motion.button
                  type="submit"
                  disabled={isLoading || showSuccess}
                  whileHover={{ scale: showSuccess ? 1 : 1.01 }}
                  whileTap={{ scale: showSuccess ? 1 : 0.98 }}
                  className="w-full h-12 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white font-semibold rounded-lg hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                      登录中...
                    </span>
                  ) : showSuccess ? (
                    <span className="flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      登录成功
                    </span>
                  ) : (
                    '登录'
                  )}
                </motion.button>
              </div>
            </form>

            {/* 注册链接 */}
            <div className="mt-6 text-center">
              <p className="text-[var(--text-secondary)] text-sm">
                还没有账户？{' '}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => navigate('/register')}
                  className="text-[#3B82F6] hover:text-[#2563EB] font-medium hover:underline inline-flex items-center gap-1"
                >
                  立即注册
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </motion.button>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
