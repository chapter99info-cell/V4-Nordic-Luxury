import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Clock, 
  User, 
  Check, 
  Calendar as CalendarIcon,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Stethoscope,
  Info
} from 'lucide-react';
import { format, addDays, startOfDay, eachHourOfInterval, isSameDay, parseISO, addMinutes, isAfter } from 'date-fns';
import { collection, query, where, onSnapshot, addDoc, getDocs } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { shopConfig } from '../config/shopConfig';
import { Service, Staff, Booking, Holiday } from '../types';

const TIME_SLOTS = [
  '09:00', '09:15', '09:30', '10:00', '10:15', '10:30', '11:00', '11:15', '11:30', 
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

export default function BookingFlow({ 
  onComplete, 
  initialService,
  initialWithCoconut = false,
  initialDuration = null
}: { 
  onComplete?: () => void;
  initialService?: Service | null;
  initialWithCoconut?: boolean;
  initialDuration?: number | null;
}) {
  const [step, setStep] = useState(initialService ? 2 : 1);
  const [selectedService, setSelectedService] = useState<Service | null>(initialService || null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(initialDuration || initialService?.duration || null);
  const [selectedTherapist, setSelectedTherapist] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [medicalAlerts, setMedicalAlerts] = useState('');
  const [painPoints, setPainPoints] = useState<string[]>([]);
  const [painLevel, setPainLevel] = useState(5);
  const [needsHealthFund, setNeedsHealthFund] = useState(false);
  const [useCoconutOil, setUseCoconutOil] = useState(initialWithCoconut);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState(auth.currentUser?.email || '');
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastBookingId, setLastBookingId] = useState<string | null>(null);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const qStaff = query(collection(db, 'staff'), where('isActive', '==', true));
    const unsubscribeStaff = onSnapshot(qStaff, (snapshot) => {
      setStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff)));
    });

    const qServices = query(collection(db, 'services'));
    const unsubscribeServices = onSnapshot(qServices, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
      setServices(docs.length > 0 ? docs : shopConfig.services);
    });

    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        setEmail(user.email || '');
        const { doc, getDoc } = await import('firebase/firestore');
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.phoneNumber) setPhoneNumber(userData.phoneNumber);
          if (userData.medicalAlerts) setMedicalAlerts(userData.medicalAlerts);
          if (userData.painPoints) setPainPoints(userData.painPoints);
          if (userData.painLevel) setPainLevel(userData.painLevel);
        }
      }
    });

    return () => {
      unsubscribeStaff();
      unsubscribeServices();
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    const path = 'holidays';
    const q = query(collection(db, path));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Holiday));
      setHolidays(docs.length > 0 ? docs : shopConfig.holidays);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  // Update selected service if initialService changes
  useEffect(() => {
    if (initialService) {
      setSelectedService(initialService);
      setSelectedDuration(initialService.duration);
      setUseCoconutOil(initialWithCoconut);
      setStep(2);
    }
  }, [initialService, initialWithCoconut]);

  // Fetch bookings for selected date and therapist to show availability
  useEffect(() => {
    if (!selectedTherapist || !auth.currentUser) return;
    
    const path = 'bookings';
    const q = query(
      collection(db, path),
      where('date', '==', format(selectedDate, 'yyyy-MM-dd')),
      where('therapistId', '==', selectedTherapist.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setExistingBookings(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [selectedDate, selectedTherapist]);

  const isSlotBooked = (time: string) => {
    return existingBookings.some(b => b.startTime === time && b.status !== 'cancelled');
  };

  const isDateClosed = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return holidays.some(h => h.isActive && dateStr >= h.startDate && dateStr <= h.endDate);
  };

  const getHolidayMessage = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const holiday = holidays.find(h => h.isActive && dateStr >= h.startDate && dateStr <= h.endDate);
    return holiday?.message || "Shop is closed on this date.";
  };

  const getDynamicPrice = (time: string) => {
    if (!selectedService || !selectedDuration) return 0;
    let basePrice = selectedService.rates[selectedDuration.toString()] || selectedService.fullPrice;
    
    // Add $5 extra for coconut oil
    if (useCoconutOil) {
      basePrice += 5;
    }
    
    // Off-peak discount (e.g., 10 AM - 12 PM)
    const hour = parseInt(time.split(':')[0]);
    if (hour >= 10 && hour <= 12) {
      return basePrice * 0.85; // 15% discount
    }
    
    // Last minute deal (if booking for today and time is within 3 hours)
    const now = new Date();
    if (isSameDay(selectedDate, now)) {
      const slotTime = parseISO(`${format(now, 'yyyy-MM-dd')}T${time}`);
      const diffHours = (slotTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (diffHours > 0 && diffHours < 3) {
        return basePrice * 0.8; // 20% discount
      }
    }

    return basePrice;
  };

  const handleBooking = async () => {
    if (!selectedService || !selectedTherapist || !selectedTime || !policyAccepted || !selectedDuration) return;
    
    setIsSubmitting(true);
    try {
      const duration = selectedDuration;
      const endTime = format(addMinutes(parseISO(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}`), duration), 'HH:mm');
      const finalPrice = getDynamicPrice(selectedTime);

      // Update user profile with medical info
      if (auth.currentUser) {
        const { updateDoc, doc, setDoc, getDoc } = await import('firebase/firestore');
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        const medicalData = {
          medicalAlerts,
          painPoints,
          painLevel,
          phoneNumber,
          updatedAt: new Date().toISOString()
        };

        if (userSnap.exists()) {
          await updateDoc(userRef, {
            ...medicalData,
            phoneNumber // Ensure it's explicitly set
          });
        } else {
          await setDoc(userRef, {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            displayName: auth.currentUser.displayName,
            phoneNumber,
            role: 'client',
            ...medicalData
          });
        }
      }

      const docRef = await addDoc(collection(db, 'bookings'), {
        clientId: auth.currentUser?.uid || 'anonymous',
        clientName: auth.currentUser?.displayName || 'Guest User',
        clientEmail: email,
        clientPhone: phoneNumber,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        therapistId: selectedTherapist.id,
        therapistName: selectedTherapist.name,
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: selectedTime,
        endTime,
        duration,
        price: finalPrice,
        status: 'pending', // Initial status is pending, waiting for owner confirmation
        paymentStatus: 'deposit-paid',
        isWalkIn: false,
        createdAt: new Date().toISOString(),
        needsHealthFundRebate: needsHealthFund,
        useCoconutOil: useCoconutOil,
        depositPaid: true, // Simulated for demo
        intakeFormCompleted: false
      });
      
      setLastBookingId(docRef.id);
      
      setStep(5); // Success step
      if (onComplete) setTimeout(onComplete, 4000);
    } catch (error) {
      console.error("Booking error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteIntake = async () => {
    if (!lastBookingId) return;
    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'bookings', lastBookingId), {
        intakeFormCompleted: true
      });
      setStep(6); // Final step after intake
    } catch (error) {
      console.error("Error completing intake:", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-12 px-4">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
              step >= s ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-beige/30 text-earth/40'
            }`}>
              {step > s ? <Check size={18} /> : s}
            </div>
            {s < 5 && (
              <div className={`flex-1 h-1 mx-4 rounded-full transition-all ${
                step > s ? 'bg-primary' : 'bg-beige/30'
              }`} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center">
              <h2 className="text-3xl font-serif font-bold text-primary mb-2">Select a Service</h2>
              <p className="text-earth/60">Choose the treatment that best suits your needs.</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className={`flex flex-col p-6 rounded-[2.5rem] border-2 transition-all text-left group ${
                    selectedService?.id === service.id 
                      ? 'border-primary bg-primary/5 shadow-xl shadow-primary/5' 
                      : 'border-beige/20 bg-white hover:border-sage/40 hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-center gap-6 mb-4">
                    <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden flex-shrink-0">
                      <img src={service.image} alt={service.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-serif font-bold text-primary mb-1">{service.name}</h4>
                      <div className="mb-3">
                        <span className="text-[9px] font-bold text-sage uppercase tracking-wider bg-sage/5 px-2 py-0.5 rounded-md">
                          Best for: {service.bestFor}
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <h5 className="text-[8px] font-bold uppercase tracking-widest text-earth/30 mb-1">Service Details</h5>
                          <p className="text-xs text-earth/60 line-clamp-2">{service.description}</p>
                        </div>
                        
                        <div>
                          <h5 className="text-[8px] font-bold uppercase tracking-widest text-earth/30 mb-1.5">Key Benefits</h5>
                          <div className="flex flex-wrap gap-1">
                            {service.keyBenefits.map((benefit, i) => (
                              <span key={i} className="text-[8px] text-earth/50 bg-section px-1.5 py-0.5 rounded-full border border-beige/10">
                                {benefit}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(service.rates).map(([dur, price]) => (
                      <button
                        key={dur}
                        onClick={() => {
                          setSelectedService(service);
                          setSelectedDuration(parseInt(dur));
                          setStep(2);
                        }}
                        className={`py-2 px-3 rounded-xl border font-bold text-[10px] uppercase tracking-widest transition-all ${
                          selectedService?.id === service.id && selectedDuration === parseInt(dur)
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-primary border-beige/40 hover:border-primary'
                        }`}
                      >
                        {dur}m - ${price}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center">
              <button onClick={() => setStep(1)} className="text-sage text-xs font-bold uppercase tracking-widest flex items-center gap-1 mb-4 mx-auto hover:text-primary transition-colors">
                <ChevronLeft size={14} /> Back to Services
              </button>
              <h2 className="text-3xl font-serif font-bold text-primary mb-2">Choose a Therapist</h2>
              <p className="text-earth/60">Our master therapists are here to help you heal.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {staff.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedTherapist(s);
                    setStep(3);
                  }}
                  className={`flex flex-col items-center p-8 rounded-[3rem] border-2 transition-all text-center group ${
                    selectedTherapist?.id === s.id 
                      ? 'border-primary bg-primary/5 shadow-xl shadow-primary/5' 
                      : 'border-beige/20 bg-white hover:border-sage/40 hover:shadow-lg'
                  }`}
                >
                  <div className="w-24 h-24 rounded-full overflow-hidden mb-4 ring-4 ring-sage/10 group-hover:ring-sage/30 transition-all bg-beige/20 flex items-center justify-center">
                    {s.imageUrl || s.avatar ? (
                      <img src={s.imageUrl || s.avatar} alt={s.name} className="w-full h-full object-cover" />
                    ) : (
                      <User size={40} className="text-primary/20" />
                    )}
                  </div>
                  <h4 className="text-lg font-serif font-bold text-primary mb-1">{s.name}</h4>
                  <p className="text-[10px] text-sage uppercase font-bold tracking-widest mb-4">{s.label || s.role}</p>
                  <div className="flex items-center gap-1 text-xs font-bold text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                    Select <ArrowRight size={14} />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center">
              <button onClick={() => setStep(2)} className="text-sage text-xs font-bold uppercase tracking-widest flex items-center gap-1 mb-4 mx-auto hover:text-primary transition-colors">
                <ChevronLeft size={14} /> Back to Therapists
              </button>
              <h2 className="text-3xl font-serif font-bold text-primary mb-2">Select Time</h2>
              <p className="text-earth/60">Choose a convenient slot for your session.</p>
            </div>

            {!user && (
              <div className="bg-amber-50 border border-amber-200 p-6 rounded-[2rem] text-center space-y-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
                  <User size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900">Sign in to check availability</h4>
                  <p className="text-xs text-amber-700 mt-1">You need to be signed in to see which slots are available and to complete your booking.</p>
                </div>
                <button 
                  onClick={handleSignIn}
                  className="bg-primary text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-sage transition-all shadow-lg shadow-primary/10"
                >
                  Sign In with Google
                </button>
              </div>
            )}

            {/* Date Selection */}
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                const date = addDays(new Date(), offset);
                const isSelected = isSameDay(date, selectedDate);
                const isClosed = isDateClosed(date);
                return (
                  <button
                    key={offset}
                    onClick={() => setSelectedDate(date)}
                    className={`flex-shrink-0 w-20 py-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-1 ${
                      isSelected 
                        ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20' 
                        : isClosed
                          ? 'border-rose-100 bg-rose-50/30 text-rose-300'
                          : 'border-beige/20 bg-white text-primary hover:border-sage/40'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                      {format(date, 'EEE')}
                    </span>
                    <span className="text-xl font-serif font-bold">
                      {format(date, 'd')}
                    </span>
                    {isClosed && (
                      <span className="text-[8px] font-bold uppercase text-rose-500">Closed</span>
                    )}
                  </button>
                );
              })}
            </div>

            {isDateClosed(selectedDate) ? (
              <div className="bg-rose-50 border border-rose-100 p-8 rounded-[3rem] text-center space-y-4">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
                  <CalendarIcon size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold text-rose-900">Shop Closed</h3>
                  <p className="text-sm text-rose-700 mt-2 max-w-xs mx-auto">
                    {getHolidayMessage(selectedDate)}
                  </p>
                </div>
                <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest">
                  Please select another date
                </p>
              </div>
            ) : (
              <>
                {/* Time Slots - Bubbles Style */}
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {TIME_SLOTS.map((time) => {
                    const isBooked = isSlotBooked(time);
                    const isSelected = selectedTime === time;
                    const isDisabled = isBooked || !user;
                    return (
                      <button
                        key={time}
                        disabled={isDisabled}
                        onClick={() => setSelectedTime(time)}
                        className={`py-4 rounded-full border-2 font-bold text-sm transition-all relative ${
                          isBooked 
                            ? 'bg-beige/10 border-beige/10 text-earth/20 cursor-not-allowed line-through' 
                            : !user
                              ? 'bg-beige/5 border-beige/10 text-earth/20 cursor-not-allowed'
                              : isSelected
                                ? 'bg-sage border-sage text-white shadow-lg shadow-sage/20'
                                : 'bg-white border-beige/20 text-primary hover:border-sage/40'
                        }`}
                      >
                        {time}
                        {!isBooked && getDynamicPrice(time) < (selectedService?.rates["60"] || 0) && (
                          <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[8px] px-1.5 py-0.5 rounded-full animate-pulse">
                            Deal
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Add-on Options */}
                <div className="space-y-3">
                  {selectedService?.id !== 'thai-massage-no-oil' && (
                    <div 
                      onClick={() => setUseCoconutOil(!useCoconutOil)}
                      className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer flex items-center gap-4 ${
                        useCoconutOil ? 'border-sage bg-sage/5' : 'border-beige/20 bg-white'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        useCoconutOil ? 'bg-sage border-sage text-white' : 'border-beige/40'
                      }`}>
                        {useCoconutOil && <Check size={14} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles size={16} className="text-sage" />
                          <h4 className="text-sm font-bold text-primary">Upgrade to Coconut Oil</h4>
                        </div>
                        <p className="text-[10px] text-earth/60 uppercase tracking-widest font-bold">Nourishing organic virgin coconut oil (+$5.00)</p>
                      </div>
                    </div>
                  )}

                  <div 
                    onClick={() => setNeedsHealthFund(!needsHealthFund)}
                    className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer flex items-center gap-4 ${
                      needsHealthFund ? 'border-sage bg-sage/5' : 'border-beige/20 bg-white'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      needsHealthFund ? 'bg-sage border-sage text-white' : 'border-beige/40'
                    }`}>
                      {needsHealthFund && <Check size={14} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Stethoscope size={16} className="text-sage" />
                        <h4 className="text-sm font-bold text-primary">Health Fund Rebate</h4>
                      </div>
                      <p className="text-[10px] text-earth/60 uppercase tracking-widest font-bold">I need a receipt for insurance claim</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setStep(4)}
                  disabled={!selectedTime || !user}
                  className="w-full bg-primary text-white py-6 rounded-full font-bold uppercase tracking-widest hover:bg-sage transition-all shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  Medical History <ArrowRight size={20} />
                </button>
              </>
            )}
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center">
              <button onClick={() => setStep(3)} className="text-sage text-xs font-bold uppercase tracking-widest flex items-center gap-1 mb-4 mx-auto hover:text-primary transition-colors">
                <ChevronLeft size={14} /> Back to Time
              </button>
              <h2 className="text-3xl font-serif font-bold text-primary mb-2">Medical History</h2>
              <p className="text-earth/60">Help us tailor the session to your needs.</p>
            </div>

            <div className="space-y-6">
              {/* Pain Points Tags */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-primary uppercase tracking-widest">Where is the pain? (Select all that apply)</label>
                <div className="flex flex-wrap gap-2">
                  {['Neck', 'Shoulders', 'Upper Back', 'Lower Back', 'Hips', 'Glutes', 'Thighs', 'Calves', 'Feet', 'Arms', 'Hands', 'Head/Migraine'].map(point => (
                    <button
                      key={point}
                      onClick={() => {
                        if (painPoints.includes(point)) {
                          setPainPoints(painPoints.filter(p => p !== point));
                        } else {
                          setPainPoints([...painPoints, point]);
                        }
                      }}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all border-2 ${
                        painPoints.includes(point)
                          ? 'bg-sage border-sage text-white'
                          : 'bg-white border-beige/20 text-primary hover:border-sage/40'
                      }`}
                    >
                      {point}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pain Level Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-primary uppercase tracking-widest">Pain Level (1-10)</label>
                  <span className="text-lg font-serif font-bold text-primary">{painLevel}</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={painLevel}
                  onChange={(e) => setPainLevel(parseInt(e.target.value))}
                  className="w-full h-2 bg-beige/30 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] text-earth/40 font-bold uppercase tracking-widest">
                  <span>Mild</span>
                  <span>Moderate</span>
                  <span>Severe</span>
                </div>
              </div>

              {/* Medical Alerts */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-primary uppercase tracking-widest">Medical Alerts / Allergies</label>
                <textarea
                  value={medicalAlerts}
                  onChange={(e) => setMedicalAlerts(e.target.value)}
                  placeholder="e.g. Pregnancy, High Blood Pressure, Nut Allergies, Recent Surgery..."
                  className="w-full p-4 rounded-2xl border-2 border-beige/20 focus:border-sage outline-none transition-all text-sm min-h-[100px] bg-white"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-primary uppercase tracking-widest">Phone Number (Required)</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="08X-XXX-XXXX"
                  className="w-full p-4 rounded-2xl border-2 border-beige/20 focus:border-sage outline-none transition-all text-sm bg-white"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-primary uppercase tracking-widest">Email (For Booking Confirmation)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full p-4 rounded-2xl border-2 border-beige/20 focus:border-sage outline-none transition-all text-sm bg-white"
                  required
                />
              </div>
            </div>

            <button
              onClick={() => setStep(5)}
              disabled={!phoneNumber || !email}
              className="w-full bg-primary text-white py-6 rounded-full font-bold uppercase tracking-widest hover:bg-sage transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Review & Pay <ArrowRight size={20} />
            </button>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center">
              <button onClick={() => setStep(4)} className="text-sage text-xs font-bold uppercase tracking-widest flex items-center gap-1 mb-4 mx-auto hover:text-primary transition-colors">
                <ChevronLeft size={14} /> Back to Medical
              </button>
              <h2 className="text-3xl font-serif font-bold text-primary mb-2">Revenue Shield</h2>
              <p className="text-earth/60">Secure your session with a deposit.</p>
            </div>

            <div className="bg-white rounded-[3rem] p-8 border border-beige/20 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-6 border-bottom border-beige/10">
                <div>
                  <h4 className="text-lg font-serif font-bold text-primary">{selectedService?.name}</h4>
                  <p className="text-xs text-earth/60">{format(selectedDate, 'EEEE, MMMM d')} at {selectedTime}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-serif font-bold text-primary">${selectedTime ? getDynamicPrice(selectedTime).toFixed(2) : '0.00'}</p>
                  <p className="text-[10px] text-sage font-bold uppercase tracking-widest">{selectedDuration} Min Session</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-sage/5 rounded-2xl border border-sage/10">
                  <ShieldCheck size={20} className="text-sage" />
                  <p className="text-xs font-medium text-primary">
                    A non-refundable deposit of ${selectedService?.depositAmount.toFixed(2)} is required to lock your slot.
                  </p>
                </div>

                <div className="p-6 bg-beige/10 rounded-3xl space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <Info size={16} />
                    <h5 className="text-xs font-bold uppercase tracking-widest">Cancellation Policy</h5>
                  </div>
                  <p className="text-xs text-earth/60 leading-relaxed">
                    Cancellations made less than 24 hours before the appointment will result in a forfeiture of the deposit. By proceeding, you agree to our terms.
                  </p>
                </div>

                <label className="flex items-center gap-4 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={policyAccepted}
                    onChange={e => setPolicyAccepted(e.target.checked)}
                    className="hidden"
                  />
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    policyAccepted ? 'bg-primary border-primary text-white' : 'border-beige/40 group-hover:border-primary'
                  }`}>
                    {policyAccepted && <Check size={14} />}
                  </div>
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">I agree to the policy</span>
                </label>
              </div>
            </div>

            <button
              onClick={handleBooking}
              disabled={!policyAccepted || isSubmitting}
              className="w-full bg-primary text-white py-6 rounded-full font-bold uppercase tracking-widest hover:bg-sage transition-all shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              <CreditCard size={20} />
              {isSubmitting ? 'Processing Payment...' : `Pay Deposit & Confirm`}
            </button>
          </motion.div>
        )}

        {step === 6 && (
          <motion.div
            key="step6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 space-y-6"
          >
            <div className="w-24 h-24 bg-sage/10 rounded-full flex items-center justify-center mx-auto text-sage">
              <Sparkles size={48} />
            </div>
            <h2 className="text-4xl font-serif font-bold text-primary">Booking Received!</h2>
            <p className="text-earth/60 max-w-md mx-auto">
              Thank you for choosing Mira. Your booking is currently <strong>pending confirmation</strong> from our team. We will notify you once it is confirmed.
            </p>
            <p className="text-xs text-earth/40">
              Session: {format(selectedDate, 'MMMM d')} at {selectedTime}
            </p>
            <div className="bg-beige/10 p-6 rounded-[2.5rem] max-w-sm mx-auto border border-beige/20">
              <h5 className="text-xs font-bold text-sage uppercase tracking-widest mb-2">Next Step</h5>
              <p className="text-xs text-primary font-medium mb-4">Please complete your digital intake form before your visit.</p>
              <button 
                onClick={handleCompleteIntake}
                className="w-full bg-white text-primary py-3 rounded-full text-xs font-bold uppercase tracking-widest border border-beige/30 hover:bg-beige/10 transition-all"
              >
                Complete Intake Form
              </button>
            </div>
            <div className="pt-8">
              <button 
                onClick={() => setStep(1)}
                className="bg-primary text-white px-12 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-sage transition-all"
              >
                Return Home
              </button>
            </div>
          </motion.div>
        )}
        {step === 7 && (
          <motion.div
            key="step7"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 space-y-6"
          >
            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500">
              <Check size={48} />
            </div>
            <h2 className="text-4xl font-serif font-bold text-primary">All Set!</h2>
            <p className="text-earth/60 max-w-md mx-auto">
              Your intake form is complete. We have everything we need for your session. See you soon!
            </p>
            <div className="pt-8">
              <button 
                onClick={() => setStep(1)}
                className="bg-primary text-white px-12 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-sage transition-all"
              >
                Return Home
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
