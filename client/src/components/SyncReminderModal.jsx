import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ArrowRight, RefreshCw } from 'lucide-react';

const SyncReminderModal = ({ isOpen, onClose, onSync }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#030712]/80 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-[#0f172a]/90 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/20 blur-[80px] rounded-full" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 blur-[80px] rounded-full" />

            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative z-10 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 bg-indigo-500/10 rounded-2xl mb-6 border border-indigo-500/20 shadow-inner">
                <Sparkles className="h-8 w-8 text-indigo-400" />
              </div>

              <h2 className="text-2xl font-black text-white mb-3 tracking-tight">
                Daily Discovery Pulse
              </h2>
              
              <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">
                Ready for your daily roles? Click the <span className="text-indigo-400 font-bold">Sync New</span> button to discover the latest tech gradients and apprenticeships tailored for you.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    onSync();
                    onClose();
                  }}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-600/30 active:scale-[0.98] group"
                >
                  <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
                  Sync Latest Now
                </button>
                
                <button
                  onClick={onClose}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl font-bold text-[11px] tracking-widest uppercase transition-all"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SyncReminderModal;
