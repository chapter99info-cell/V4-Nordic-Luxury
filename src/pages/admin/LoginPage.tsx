import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, User, ChevronRight, Delete, X, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../../i18n/I18nContext';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Staff } from '../../types';
import emailjs from '@emailjs/browser';
import { toast } from 'sonner';
import { sendLineNotification } from '../../services/notificationService';

export const LoginPage: React.FC = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showStaffSelection, setShowStaffSelection] = useState(false);
  const [activeStaff, setActiveStaff] = useState<Staff[]>([]);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const OWNER_PIN = '9999';
  const STAFF_PIN = '1111';

  useEffect(() => {
    if (showStaffSelection) {
      const q = query(collection(db, 'staff'), where('isActive', '==', true));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setActiveStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff)));
      });
      return () => unsubscribe();
    }
  }, [showStaffSelection]);

  const startPress = () => {
    timerRef.current = setTimeout(() => {
      handleRecovery();
    }, 3000);
  };

  const endPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleRecovery = async () => {
    try {
      const securityDoc = await getDoc(doc(db, 'shop_settings', 'security'));
      if (!securityDoc.exists()) {
        console.error('Security settings not found');
        return;
      }

      const { ownerPin, ownerPrivateEmail } = securityDoc.data();

      // 1. Send Email via EmailJS
      if (ownerPrivateEmail) {
        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID,
          import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
          {
            to_email: ownerPrivateEmail,
            owner_pin: ownerPin,
            shop_name: 'Mira Royale',
          },
          import.meta.env.VITE_EMAILJS_PUBLIC_KEY
        );
      }

      // 2. Send LINE Notification (Messaging API)
      const lineMessage = `\n[SECURITY ALERT]\nOwner PIN Recovery Triggered\nYour PIN is: ${ownerPin}`;
      await sendLineNotification(lineMessage);

      toast.success('ข้อมูลการกู้คืนถูกส่งไปยังช่องทางส่วนตัวของเจ้าของร้านแล้ว');
    } catch (error) {
      console.error('Recovery error:', error);
      toast.error('เกิดข้อผิดพลาดในการกู้คืนข้อมูล');
    }
  };

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      if (newPin.length === 4) {
        validatePin(newPin);
      }
    }
  };

  const validatePin = (enteredPin: string) => {
    if (enteredPin === OWNER_PIN) {
      localStorage.setItem('isAdmin', 'true');
      localStorage.setItem('isAuthorized', 'true');
      localStorage.setItem('userRole', 'owner');
      navigate('/admin');
    } else if (enteredPin === STAFF_PIN) {
      setShowStaffSelection(true);
    } else {
      setError(t('login.invalid_code'));
      setTimeout(() => {
        setPin('');
        setError('');
      }, 1000);
    }
  };

  const handleStaffSelect = (staffName: string) => {
    localStorage.setItem('staffName', staffName);
    localStorage.setItem('isAdmin', 'true');
    localStorage.setItem('isAuthorized', 'true');
    localStorage.setItem('userRole', 'staff');
    navigate('/admin'); // Assuming 'My Tasks' is the default view for staff in /admin
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 font-sans overflow-hidden">
      <AnimatePresence mode="wait">
        {!showStaffSelection ? (
          <motion.div 
            key="pin-pad"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="w-full max-w-sm bg-zinc-900/50 border border-[#D4AF37]/20 p-8 rounded-[3rem] backdrop-blur-xl text-center"
          >
            <div 
              className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-6 cursor-pointer select-none"
              onMouseDown={startPress}
              onMouseUp={endPress}
              onMouseLeave={endPress}
              onTouchStart={startPress}
              onTouchEnd={endPress}
              onDoubleClick={handleRecovery}
            >
              <Lock className="text-[#D4AF37]" size={28} />
            </div>
            
            <h1 className="text-xl font-serif font-bold text-[#D4AF37] mb-1">{t('login.staff_only')}</h1>
            <p className="text-white/40 text-[10px] mb-8 tracking-widest uppercase">{t('login.authorized_access')}</p>

            {/* PIN Display */}
            <div className="flex justify-center gap-4 mb-10">
              {[...Array(4)].map((_, i) => (
                <div 
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                    pin.length > i ? 'bg-[#D4AF37] border-[#D4AF37] scale-125' : 'border-white/20'
                  }`}
                />
              ))}
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-xs font-bold mb-6"
              >
                {error}
              </motion.p>
            )}

            {/* Number Pad */}
            <div className="grid grid-cols-3 gap-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumberClick(num)}
                  className="w-full aspect-square rounded-2xl bg-white/5 text-white text-2xl font-bold hover:bg-[#D4AF37] hover:text-black transition-all active:scale-95"
                >
                  {num}
                </button>
              ))}
              <div />
              <button
                onClick={() => handleNumberClick('0')}
                className="w-full aspect-square rounded-2xl bg-white/5 text-white text-2xl font-bold hover:bg-[#D4AF37] hover:text-black transition-all active:scale-95"
              >
                0
              </button>
              <button
                onClick={handleDelete}
                className="w-full aspect-square rounded-2xl bg-white/5 text-white flex items-center justify-center hover:bg-rose-500/20 hover:text-rose-500 transition-all active:scale-95"
              >
                <Delete size={24} />
              </button>
            </div>

            <button 
              onClick={() => navigate('/')}
              className="mt-8 text-white/20 text-[10px] uppercase tracking-widest hover:text-white transition-colors"
            >
              {t('login.back_to_public')}
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="staff-selection"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-md bg-zinc-900/50 border border-[#D4AF37]/20 p-10 rounded-[3rem] backdrop-blur-xl text-center"
          >
            <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="text-[#D4AF37]" size={28} />
            </div>
            
            <h1 className="text-xl font-serif font-bold text-[#D4AF37] mb-1">Select Your Name</h1>
            <p className="text-white/40 text-[10px] mb-8 tracking-widest uppercase">Tap to start working</p>

            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
              {activeStaff.length === 0 ? (
                <p className="text-white/30 py-10">No active staff found</p>
              ) : (
                activeStaff.map((staff) => (
                  <button
                    key={staff.id}
                    onClick={() => handleStaffSelect(staff.name)}
                    className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group hover:bg-[#D4AF37] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <img src={staff.avatar} alt={staff.name} className="w-10 h-10 rounded-full border border-white/10" />
                      <div className="text-left">
                        <p className="text-white font-bold group-hover:text-black transition-colors">{staff.name}</p>
                        <p className="text-white/40 text-[10px] uppercase tracking-widest group-hover:text-black/60 transition-colors">{staff.role}</p>
                      </div>
                    </div>
                    <ChevronRight className="text-white/20 group-hover:text-black transition-colors" size={20} />
                  </button>
                ))
              )}
            </div>

            <button 
              onClick={() => setShowStaffSelection(false)}
              className="mt-8 text-white/20 text-[10px] uppercase tracking-widest hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <X size={14} /> Back to PIN Pad
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;
