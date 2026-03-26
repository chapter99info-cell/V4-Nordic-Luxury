import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Palmtree, 
  Store, 
  Send, 
  CheckCircle2, 
  Loader2,
  BellRing
} from 'lucide-react';
import { 
  collection, 
  query, 
  onSnapshot, 
  where, 
  addDoc, 
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Staff } from '../types';

export const StaffNotificationTrigger: React.FC = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifyingId, setNotifyingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, 'staff'), where('isActive', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const staff = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Staff));
      setStaffList(staff);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const sendNudge = async (staff: Staff) => {
    setNotifyingId(staff.id);
    
    try {
      // 1. Create a notification document in Firestore
      // This can trigger a Cloud Function to send a real FCM push
      await addDoc(collection(db, 'notifications'), {
        userId: staff.id,
        title: 'Your Next Golden Queue is Ready 🌊',
        message: `Hi ${staff.name}, you have a 60-min Oil Massage starting in 15 minutes. See you soon!`,
        type: 'booking_assigned',
        isRead: false,
        createdAt: serverTimestamp(),
        shopId: 'SHOP01' // Fallback or from config
      });

      // Simulate network delay for the "premium" feel
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccessId(staff.id);
      setTimeout(() => setSuccessId(null), 3000);
    } catch (error) {
      console.error("Error sending nudge:", error);
    } finally {
      setNotifyingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin text-[#006D77]" size={24} />
      </div>
    );
  }

  return (
    <div className="bg-[#F5F5F0] p-8 rounded-[2.5rem] border border-[#006D77]/10 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-serif font-bold text-[#006D77]">Staff Signal Center</h3>
          <p className="text-stone-500 text-sm font-medium">Notify your team with a gentle nudge</p>
        </div>
        <BellRing className="text-[#006D77]/20" size={32} />
      </div>

      <div className="space-y-4">
        {staffList.map((staff) => (
          <motion.div 
            key={staff.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between p-4 bg-white rounded-2xl border border-stone-100 group hover:border-[#006D77]/20 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <img 
                  src={staff.avatar || staff.imageUrl || 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=200&h=200'} 
                  alt={staff.name}
                  className="w-12 h-12 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all"
                  referrerPolicy="no-referrer"
                />
                <div className={`absolute -bottom-1 -right-1 p-1 rounded-full border-2 border-white shadow-sm ${
                  staff.locationStatus === 'At the Beach' ? 'bg-amber-400' : 'bg-[#006D77]'
                }`}>
                  {staff.locationStatus === 'At the Beach' ? (
                    <Palmtree size={10} className="text-white" />
                  ) : (
                    <Store size={10} className="text-white" />
                  )}
                </div>
              </div>
              <div>
                <p className="font-bold text-stone-800">{staff.name}</p>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1">
                  {staff.locationStatus || 'In-Store'}
                </p>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => sendNudge(staff)}
                disabled={notifyingId === staff.id}
                className={`relative overflow-hidden px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
                  successId === staff.id 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-[#006D77] text-white hover:bg-[#005a63] shadow-lg shadow-[#006D77]/20'
                }`}
              >
                {notifyingId === staff.id ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : successId === staff.id ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <Send size={14} />
                )}
                {successId === staff.id ? 'Sent' : 'Send Nudge'}

                {/* Ripple Effect Animation */}
                <AnimatePresence>
                  {notifyingId === staff.id && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0.5 }}
                      animate={{ scale: 4, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute inset-0 bg-white/30 rounded-full"
                    />
                  )}
                </AnimatePresence>
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
