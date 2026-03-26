import React, { useState, useEffect } from 'react';
import { Service, Staff, PromoSettings } from '../types';
import { apiService } from '../services/api';
import { sendAdminPaymentNotification, sendClientConfirmationEmail } from '../services/notificationService';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar as CalendarIcon, Clock, User, CheckCircle2, ChevronLeft, ChevronRight, Mail, Phone, Tag, Sparkles } from 'lucide-react';
import { PaymentSelection } from './PaymentSelection';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, db } from '../firebase';
import { updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { shopConfig } from '../config/shopConfig';

interface BookingModalProps {
  service: Service | null;
  user?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ service, user, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [selectedDuration, setSelectedDuration] = useState<string>(service ? Object.keys(service.rates)[0] : '');
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [clientName, setClientName] = useState(user?.displayName || '');
  const [clientEmail, setClientEmail] = useState(user?.email || '');
  const [clientPhone, setClientPhone] = useState(user?.phoneNumber || '');
  const [loading, setLoading] = useState(false);
  const [promo, setPromo] = useState<PromoSettings | null>(null);

  useEffect(() => {
    if (service) {
      apiService.getStaff().then(setStaff);
      setSelectedDuration(Object.keys(service.rates)[0]);
    }

    // Fetch Promo Settings
    const unsubscribePromo = onSnapshot(doc(db, 'shop_settings', 'promo'), (doc) => {
      if (doc.exists()) {
        setPromo(doc.data() as PromoSettings);
      }
    });

    return () => unsubscribePromo();
  }, [service]);

  useEffect(() => {
    if (user) {
      setClientName(user.displayName || '');
      setClientEmail(user.email || '');
      setClientPhone(user.phoneNumber || '');
    }
  }, [user]);

  if (!service) return null;

  const handleBooking = async (paymentMethod: 'card' | 'cash', finalPrice: number, slipFile?: File) => {
    if (!selectedStaff || !selectedTime || !clientName || !clientEmail) return;
    setLoading(true);
    try {
      const bookingData = {
        serviceId: service.id,
        therapistId: selectedStaff.id,
        therapistName: selectedStaff.name,
        date: selectedDate,
        startTime: selectedTime,
        endTime: calculateEndTime(selectedTime, parseInt(selectedDuration)),
        clientId: user?.uid || 'guest-user',
        clientName: clientName,
        clientEmail: clientEmail,
        clientPhone: clientPhone,
        serviceName: service.name,
        duration: parseInt(selectedDuration),
        price: finalPrice,
        status: 'pending' as any,
        paymentStatus: (paymentMethod === 'card' ? 'deposit-paid' : 'unpaid') as any,
        paymentMethod: (paymentMethod === 'card' ? 'Card' : 'Transfer') as any,
        isWalkIn: false,
        createdAt: new Date().toISOString(),
        depositPaid: paymentMethod === 'card',
        intakeFormCompleted: false,
        source: 'Web' as any
      };
      
      const createdBooking = await apiService.createBooking(bookingData);
      
      if (paymentMethod === 'card') {
        await sendClientConfirmationEmail(createdBooking);
      }
      
      if (slipFile && createdBooking.id) {
        try {
          const storageRef = ref(storage, `payment_slips/${createdBooking.id}/${Date.now()}_${slipFile.name}`);
          const snapshot = await uploadBytes(storageRef, slipFile);
          const downloadUrl = await getDownloadURL(snapshot.ref);
          
          const bookingRef = doc(db, 'bookings', createdBooking.id);
          await updateDoc(bookingRef, {
            paymentSlipUrl: downloadUrl,
            status: 'payment_pending',
            paymentStatus: 'pending-verification'
          });
          
          createdBooking.paymentSlipUrl = downloadUrl;
          createdBooking.status = 'payment_pending';
          
          await sendAdminPaymentNotification(createdBooking);
        } catch (uploadErr) {
          console.error("Error uploading slip:", uploadErr);
        }
      }
      
      setStep(5);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 5000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateEndTime = (start: string, duration: number) => {
    const [h, m] = start.split(':').map(Number);
    const totalMinutes = h * 60 + m + duration + 15;
    const endH = Math.floor(totalMinutes / 60);
    const endM = totalMinutes % 60;
    return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
  };

  const times = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center md:items-end">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="bg-white w-full max-w-2xl md:rounded-t-[3rem] overflow-hidden shadow-2xl relative z-10 flex flex-col h-full md:h-auto md:max-h-[90vh]"
      >
        {/* Header (Mobile Optimized) */}
        <div className="bg-primary p-6 md:p-8 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 flex items-center justify-center">
              <CalendarIcon className="text-secondary" size={24} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-serif font-bold tracking-tight">
                {step === 1 ? 'Select Duration' : step === 2 ? 'Choose Details' : step === 3 ? 'Review' : step === 4 ? 'Payment' : 'Success'}
              </h2>
              <p className="text-white/60 text-[10px] md:text-xs uppercase tracking-widest font-medium">
                {service.name}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="grid grid-cols-1 gap-4">
                  {Object.entries(service.rates).map(([duration, price]) => (
                    <button
                      key={duration}
                      onClick={() => {
                        setSelectedDuration(duration);
                        setStep(2);
                      }}
                      className={`p-8 rounded-[2.5rem] border-2 text-left transition-all flex items-center justify-between group ${
                        selectedDuration === duration 
                          ? 'border-primary bg-primary/5 shadow-xl shadow-primary/10 scale-[1.02]' 
                          : 'border-beige/20 bg-white hover:border-sage/40'
                      }`}
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-sage/10 flex items-center justify-center text-sage group-hover:bg-primary group-hover:text-white transition-colors">
                          <Clock size={28} />
                        </div>
                        <div>
                          <p className="text-xl font-serif font-bold text-primary">{duration} Minutes</p>
                          <p className="text-[10px] text-earth/40 uppercase tracking-widest font-bold">Full Treatment Session</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-serif font-bold text-primary">{shopConfig.currency}{price}</p>
                        <ChevronRight className="text-sage ml-auto mt-1" size={20} />
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                {/* Staff Selection */}
                <div className="space-y-6">
                  <label className="text-xs font-bold text-earth/40 uppercase tracking-[0.2em] flex items-center gap-2">
                    <User size={16} className="text-sage" /> Select Therapist
                  </label>
                  <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
                    {staff.filter(s => s.isActive).map((s) => (
                      <motion.button
                        key={s.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedStaff(s)}
                        className={`flex-shrink-0 w-36 p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 ${
                          selectedStaff?.id === s.id 
                            ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20' 
                            : 'border-beige/20 bg-white hover:border-sage/40'
                        }`}
                      >
                        <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-sage/10 bg-beige/10">
                          <img 
                            src={
                              s.imageUrl || 
                              s.avatar || 
                              (s.name.toLowerCase().includes('senior') 
                                ? '/image_d57467.png' 
                                : 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=200&h=200')
                            } 
                            alt={s.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-primary leading-tight mb-1">{s.name}</p>
                          <p className="text-[9px] text-sage font-bold uppercase tracking-widest">{s.role}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Time Selection with Dynamic Pricing */}
                <div className="space-y-6">
                  <label className="text-xs font-bold text-earth/40 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Clock size={16} className="text-sage" /> Select Time
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 bg-sage/5 backdrop-blur-md p-6 rounded-[2.5rem] border border-sage/10">
                    {times.map((time) => {
                      const originalPrice = service.rates[selectedDuration];
                      const discountedPrice = promo?.isEnabled 
                        ? originalPrice * (1 - promo.discountPercentage / 100)
                        : originalPrice;

                      return (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`py-5 rounded-2xl border-2 text-base font-bold tracking-widest transition-all hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-1 ${
                            selectedTime === time 
                              ? 'border-primary bg-primary text-white shadow-xl shadow-primary/20' 
                              : 'border-beige/20 bg-white text-primary hover:border-primary/30'
                          }`}
                        >
                          <span>{time}</span>
                          {promo?.isEnabled && (
                            <span className="text-[8px] opacity-70 line-through">{shopConfig.currency}{originalPrice}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setStep(1)}
                    className="flex-1 py-5 rounded-full border-2 border-primary text-primary font-bold uppercase tracking-widest hover:bg-primary/5 transition-all"
                  >
                    Back
                  </button>
                  <button 
                    disabled={!selectedStaff || !selectedTime}
                    onClick={() => setStep(3)}
                    className="flex-[2] py-5 rounded-full bg-primary text-white font-bold uppercase tracking-widest hover:bg-sage transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="bg-section p-8 rounded-[2.5rem] border border-beige/10 space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-serif font-bold text-primary">{service.name}</h3>
                      <p className="text-earth/40 text-xs uppercase tracking-widest font-bold">{selectedDuration} Minutes</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-serif font-bold text-primary">
                        {shopConfig.currency}{promo?.isEnabled ? (service.rates[selectedDuration] * (1 - promo.discountPercentage / 100)) : service.rates[selectedDuration]}
                      </p>
                      {promo?.isEnabled && (
                        <p className="text-xs text-sage font-bold uppercase tracking-widest">Promotion Applied</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="h-[1px] bg-beige/20" />
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] text-earth/40 uppercase tracking-widest font-bold">Therapist</p>
                      <p className="text-sm font-bold text-primary">{selectedStaff?.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-earth/40 uppercase tracking-widest font-bold">Date & Time</p>
                      <p className="text-sm font-bold text-primary">{selectedDate} at {selectedTime}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 text-sage" size={20} />
                    <input 
                      type="text" 
                      placeholder="Your Full Name"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full pl-16 pr-6 py-5 rounded-full bg-beige/10 border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none text-sm font-medium"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-sage" size={20} />
                    <input 
                      type="email" 
                      placeholder="Email Address"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full pl-16 pr-6 py-5 rounded-full bg-beige/10 border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none text-sm font-medium"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-sage" size={20} />
                    <input 
                      type="tel" 
                      placeholder="Phone Number"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full pl-16 pr-6 py-5 rounded-full bg-beige/10 border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setStep(2)}
                    className="flex-1 py-5 rounded-full border-2 border-primary text-primary font-bold uppercase tracking-widest hover:bg-primary/5 transition-all"
                  >
                    Back
                  </button>
                  <button 
                    disabled={!clientName || !clientEmail || !clientPhone}
                    onClick={() => setStep(4)}
                    className="flex-[2] py-5 rounded-full bg-primary text-white font-bold uppercase tracking-widest hover:bg-sage transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                  >
                    Confirm Booking
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <PaymentSelection 
                  serviceName={service.name}
                  originalPrice={service.rates[selectedDuration]}
                  promo={promo}
                  loading={loading}
                  onConfirm={handleBooking}
                />
              </motion.div>
            )}

            {step === 5 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 space-y-6"
              >
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
                  <CheckCircle2 size={48} />
                </div>
                <h2 className="text-3xl font-serif font-bold text-primary">Booking Successful!</h2>
                <p className="text-earth/60 max-w-sm mx-auto leading-relaxed">
                  Thank you for choosing {shopConfig.name}. We've sent a confirmation email with your appointment details.
                </p>
                <div className="pt-8">
                  <div className="inline-block px-6 py-2 bg-sage/10 rounded-full text-sage text-[10px] font-bold uppercase tracking-widest animate-pulse">
                    Redirecting to your bookings...
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
