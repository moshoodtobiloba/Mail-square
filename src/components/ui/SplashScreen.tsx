import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo, LogoText } from './Logo';

interface SplashScreenProps {
  isVisible: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ 
              duration: 1, 
              ease: [0.22, 1, 0.36, 1],
              delay: 0.2
            }}
            className="flex flex-col items-center gap-6"
          >
            <Logo size={120} className="shadow-2xl shadow-blue-500/20 rounded-[30px]" />
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <LogoText className="text-3xl" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-gray-400 text-sm font-medium tracking-widest uppercase mt-2"
              >
                Unified Workspace
              </motion.p>
            </div>
          </motion.div>

          {/* Progress bar simulation */}
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: 200 }}
            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
            className="h-0.5 bg-[#0B57D0] absolute bottom-20 left-1/2 -translate-x-1/2 rounded-full overflow-hidden"
          >
            <div className="w-full h-full opacity-20 bg-gray-200 absolute inset-0" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
