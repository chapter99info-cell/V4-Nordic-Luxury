import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Waves, 
  Palmtree, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  ChevronRight,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';

interface StaffMobileAlertProps {
  staffName: string;
  serviceName: string;
  startTime: string;
  onAcknowledge: () => void;
  onHeadingBack: () => void;
  onClose: () => void;
}

export const StaffMobileAlert: React.FC<StaffMobileAlertProps> = ({
  staffName = 'Mina',
  serviceName = '60-min Oil Massage',
  startTime = '14:30',
  onAcknowledge,
  onHeadingBack,
  onClose
}) => {
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [isHeadingBack, setIsHeadingBack] = useState(false);

  const handleAcknowledge = () => {
    setIsAcknowledged(true);
    onAcknowledge?.();
  };

  const handleHeadingBack = () => {
    setIsHeadingBack(true);
    onHeadingBack?.();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#F5F5F0] flex flex-col items-center justify-center overflow-hidden font-sans">
      {/* Wave Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg width="100%" height="100%" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,1000 C300,800 400,1000 700,800 C1000,600 1000,1000 1000,1000 L0,1000 Z" fill="#006D77" />
          <path d="M0,900 C200,700 300,900 600,700 C900,500 1000,900 1000,900 L0,900 Z" fill="#006D77" opacity="0.5" />
          <path d="M0,800 C100,600 200,800 500,600 C800,400 1000,800 1000,800 L0,800 Z" fill="#006D77" opacity="0.2" />
        </svg>
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
        <button onClick={onClose} className="p-2 text-[#006D77]/40 hover:text-[#006D77] transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-2 px-4 py-1.5 bg-white/50 backdrop-blur-md rounded-full border border-white/20 shadow-sm">
          <Palmtree size={14} className="text-amber-500" />
          <span className="text-[10px] font-bold text-[#006D77] uppercase tracking-widest">At the Beach</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md px-8 flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: 'spring' }}
          className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-[#006D77]/10 mb-8 border border-white"
        >
          <Waves className="text-[#006D77] animate-pulse" size={48} />
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl md:text-4xl font-serif font-bold text-[#006D77] leading-tight mb-4"
        >
          Your Next Golden <br/> Queue is Ready 🌊
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-lg text-stone-500 font-medium mb-12"
        >
          Hi <span className="text-[#006D77] font-bold">{staffName}</span>, you have a <br/>
          <span className="text-stone-800 font-bold">{serviceName}</span> <br/>
          starting in <span className="text-amber-600 font-bold italic">15 minutes</span>. <br/>
          See you soon!
        </motion.p>

        {/* Info Cards */}
        <div className="w-full grid grid-cols-2 gap-4 mb-12">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white shadow-sm flex flex-col items-center gap-2"
          >
            <Clock className="text-amber-500" size={20} />
            <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Start Time</span>
            <span className="text-xl font-bold text-[#006D77]">{startTime}</span>
          </motion.div>
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white shadow-sm flex flex-col items-center gap-2"
          >
            <MapPin className="text-[#006D77]" size={20} />
            <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Location</span>
            <span className="text-xl font-bold text-[#006D77]">Main Shop</span>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAcknowledge}
            disabled={isAcknowledged}
            className={`w-full py-6 rounded-[2rem] font-bold text-lg uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 ${
              isAcknowledged 
                ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                : 'bg-[#006D77] text-white shadow-[#006D77]/20 hover:bg-[#005a63]'
            }`}
          >
            {isAcknowledged ? <CheckCircle2 size={24} /> : <Sparkles size={24} />}
            {isAcknowledged ? 'Acknowledged' : 'Acknowledge'}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleHeadingBack}
            disabled={isHeadingBack}
            className={`w-full py-6 rounded-[2rem] font-bold text-lg uppercase tracking-widest transition-all border-2 flex items-center justify-center gap-3 ${
              isHeadingBack 
                ? 'bg-amber-100 border-amber-200 text-amber-700' 
                : 'bg-white border-[#006D77]/10 text-[#006D77] hover:bg-stone-50'
            }`}
          >
            {isHeadingBack ? <CheckCircle2 size={24} /> : <ChevronRight size={24} />}
            {isHeadingBack ? 'Heading Back Now' : 'Heading Back'}
          </motion.button>
        </div>
      </div>

      {/* Bottom Decoration */}
      <div className="absolute bottom-12 text-stone-400 text-[10px] font-bold uppercase tracking-[0.3em] opacity-50">
        Mira Royale • Beach Calm Edition
      </div>
    </div>
  );
};
