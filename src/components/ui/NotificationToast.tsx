import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCircle2, AlertOctagon } from 'lucide-react';

interface NotificationToastProps {
  notifications: any[];
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ notifications }) => {
  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            className="pointer-events-auto bg-white border border-gray-100 shadow-xl rounded-2xl p-4 flex items-start gap-4 w-80"
          >
            <div className={`mt-1 p-2 rounded-full ${n.type === 'alert' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                {n.type === 'alert' ? <AlertOctagon size={16} /> : <CheckCircle2 size={16} />}
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-sm tracking-tight">{n.title}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.desc}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
