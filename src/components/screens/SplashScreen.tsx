'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import ar from '@/lib/localization';

export default function SplashScreen() {
  const setScreen = useAppStore((state) => state.setScreen);

  useEffect(() => {
    // Navigate to login after 3 seconds
    const timer = setTimeout(() => {
      setScreen('login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [setScreen]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Logo Animation */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10"
      >
        {/* App Icon */}
        <motion.div
          initial={{ rotateY: 0 }}
          animate={{ rotateY: 360 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
          className="w-32 h-32 rounded-3xl bg-white/20 backdrop-blur-lg flex items-center justify-center shadow-2xl border border-white/30"
        >
          <span className="text-6xl font-bold text-white">ن</span>
        </motion.div>
      </motion.div>

      {/* App Name */}
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="mt-8 text-5xl font-bold text-white"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        {ar.appName}
      </motion.h1>

      {/* Tagline */}
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="mt-4 text-xl text-white/80"
      >
        {ar.splashTagline}
      </motion.p>

      {/* Loading Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-12"
      >
        <div className="flex space-x-2 space-x-reverse">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
              }}
              className="w-3 h-3 bg-white rounded-full"
            />
          ))}
        </div>
      </motion.div>

      {/* Version */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 text-white/50 text-sm"
      >
        MVP v1.0.0
      </motion.p>
    </div>
  );
}
