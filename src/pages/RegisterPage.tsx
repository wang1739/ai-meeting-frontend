import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

interface RegisterError {
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
  general?: string;
}

// 密码强度计算
function getPasswordStrength(password: string): { level: number; label: string; color: string } {
  if (!password) return { level: 0, label: '', color: '' };
  
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

  if (score <= 1) return { level: 1, label: '弱', color: 'bg-red-500' };
  if (score <= 3) return { level: 2, label: '中等', color: 'bg-yellow-500' };
  return { level: 3, label: '强', color: 'bg-green-500' };
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [errors, setErrors] = useState<RegisterError>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);

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

  const validateConfirmPassword = (password: string, confirmPassword: string): string | undefined => {
    if (!confirmPassword) return '请确认密码';
    if (password !== confirmPassword) return '两次密码不一致';
    return undefined;
  };

  const validateName = (name: string): string | undefined => {
    if (!name) return '请输入姓名';
    if (name.length < 2 || name.length > 20) return '姓名长度应在2-20个字符之间';
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: RegisterError = {};
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = validateConfirmPassword(formData.password, formData.confirmPassword);
    const nameError = validateName(formData.name);
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;
    if (nameError) newErrors.name = nameError;
    setErrors(newErrors);
    return !emailError && !passwordError && !confirmPasswordError && !nameError;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await register(formData.email, formData.name, formData.password);
      navigate('/', { replace: true });
    } catch (error: any) {
      if (error.message === '该邮箱已注册') {
        setErrors({ 
          general: '该邮箱已注册，是否直接登录？',
          email: error.message 
        });
      } else {
        setErrors({ general: error.message || '网络错误，请稍后重试' });
      }
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof RegisterData, value: string) => {
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

  // 校验状态
  const isNameValid = formData.name.length >= 2 && formData.name.length <= 20;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const isPasswordValid = formData.password.length >= 6;
  const isConfirmValid = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] dark:bg-[#0F172A] py-8">
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
          {/* 返回按钮 */}
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">返回登录</span>
          </button>

          {/* Logo 区域 */}
          <div className="text-center mb-8">
            <motion.div
              className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <span className="text-white text-2xl font-bold">AI</span>
            </motion.div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">创建你的专属会议助手</h1>
            <p className="text-[var(--text-secondary)] mt-1">填写以下信息完成注册</p>
          </div>

          {/* 主卡片 */}
          <div className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--shadow-lg)] p-8 border border-[var(--border-color)]">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* 姓名输入 */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    姓名
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      onKeyDown={handleKeyDown}
                      className={`w-full h-12 px-4 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                        errors.name
                          ? 'border-red-300 focus:ring-red-200/50'
                          : 'border-[var(--border-color)] focus:ring-indigo-200/50'
                      }`}
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        boxShadow: errors.name ? 'none' : '0 0 0 3px rgba(79, 70, 229, 0.1)',
                      }}
                      placeholder="请输入姓名（2-20字符）"
                      disabled={isLoading}
                    />
                    {!errors.name && isNameValid && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <AnimatePresence>
                    {errors.name && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-1.5 text-sm text-red-500"
                      >
                        {errors.name}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

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
                          ? 'border-red-300 focus:ring-red-200/50'
                          : 'border-[var(--border-color)] focus:ring-indigo-200/50'
                      }`}
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        boxShadow: errors.email ? 'none' : '0 0 0 3px rgba(79, 70, 229, 0.1)',
                      }}
                      placeholder="请输入邮箱"
                      disabled={isLoading}
                    />
                    {!errors.email && isEmailValid && (
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
                          ? 'border-red-300 focus:ring-red-200/50'
                          : 'border-[var(--border-color)] focus:ring-indigo-200/50'
                      }`}
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        boxShadow: errors.password ? 'none' : '0 0 0 3px rgba(79, 70, 229, 0.1)',
                      }}
                      placeholder="请输入密码（至少6位）"
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
                  
                  {/* 密码强度指示条 */}
                  <AnimatePresence>
                    {formData.password && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ 
                                width: passwordStrength.level === 1 ? '33%' : passwordStrength.level === 2 ? '66%' : '100%'
                              }}
                              className={`h-full ${passwordStrength.color} transition-all duration-300`}
                            />
                          </div>
                          <span className={`text-xs font-medium ${
                            passwordStrength.level === 1 ? 'text-red-500' : 
                            passwordStrength.level === 2 ? 'text-yellow-500' : 'text-green-500'
                          }`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)]">
                          建议使用大小写字母、数字和特殊字符组合
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

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

                {/* 确认密码输入 */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    确认密码
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      onKeyDown={handleKeyDown}
                      className={`w-full h-12 px-4 pr-12 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 ${
                        errors.confirmPassword
                          ? 'border-red-300 focus:ring-red-200/50'
                          : 'border-[var(--border-color)] focus:ring-indigo-200/50'
                      }`}
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        boxShadow: errors.confirmPassword ? 'none' : '0 0 0 3px rgba(79, 70, 229, 0.1)',
                      }}
                      placeholder="请再次输入密码"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <AnimatePresence>
                    {errors.confirmPassword && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-1.5 text-sm text-red-500"
                      >
                        {errors.confirmPassword}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* 全局错误/提示 */}
                <AnimatePresence>
                  {errors.general && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -10, height: 0 }}
                      className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-blue-600 dark:text-blue-400">{errors.general}</p>
                          {errors.general.includes('直接登录') && (
                            <button
                              type="button"
                              onClick={() => navigate('/login')}
                              className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline mt-1"
                            >
                              前往登录 →
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 注册按钮 */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-12 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white font-semibold rounded-lg hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg mt-2"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                      注册中...
                    </span>
                  ) : (
                    '注册'
                  )}
                </motion.button>
              </div>
            </form>

            {/* 登录链接 */}
            <div className="mt-6 text-center">
              <p className="text-[var(--text-secondary)] text-sm">
                已有账户？{' '}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => navigate('/login')}
                  className="text-[#3B82F6] hover:text-[#2563EB] font-medium hover:underline"
                >
                  立即登录
                </motion.button>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
