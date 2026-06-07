import { useEffect, useState } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { motion } from 'framer-motion';

export function ProtectedRoute() {
  const { isLoggedIn, isLoading, checkAuth } = useAuthStore();
  const location = useLocation();
  const [initialCheck, setInitialCheck] = useState(false);

  useEffect(() => {
    checkAuth();
    setInitialCheck(true);
  }, [checkAuth]);

  // 首次加载时显示加载动画
  if (!initialCheck || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          {/* Logo */}
          <motion.div
            className="w-16 h-16 mx-auto mb-6 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center shadow-lg"
            animate={{ 
              boxShadow: [
                '0 10px 40px rgba(79, 70, 229, 0.3)',
                '0 10px 60px rgba(124, 58, 237, 0.4)',
                '0 10px 40px rgba(79, 70, 229, 0.3)',
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="text-white text-2xl font-bold">AI</span>
          </motion.div>
          
          {/* 加载动画 */}
          <div className="flex items-center justify-center gap-1 mb-3">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-[#4F46E5]"
                animate={{ 
                  y: [0, -8, 0],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 0.6, 
                  repeat: Infinity, 
                  delay: i * 0.1,
                  ease: 'easeInOut'
                }}
              />
            ))}
          </div>
          
          {/* 加载文案 */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[var(--text-secondary)] text-sm"
          >
            验证身份中...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
