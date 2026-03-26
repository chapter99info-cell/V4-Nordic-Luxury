import React, { useState, useEffect } from 'react';
import { Service, Staff } from '../types';
import { apiService } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar as CalendarIcon, Clock, User, CheckCircle2, Mail, Phone, Save, Loader2 } from 'lucide-react';
import { shopConfig } from '../config/shopConfig';
import { format } from 'date-fns';
import { useTranslation } from '../i18n/I18nContext';

interface QuickAddModalProps {
  onClose: () => void;
  onSuccess: () => void;
  shopId?: string;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ onClose, onSuccess, shopId }) => {
  const { t } = useTranslation();
  const [services, setServices] = useState<Service[]>(shopConfig.services);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [selectedService, setSelectedService] = useState<Service>(shopConfig.services[0]);
  const [selectedDuration, setSelectedDuration] = useState<string>('60');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState<string>('10:00');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [isWalkIn, setIsWalkIn] = useState(true);

  useEffect(() => {
    apiService.getStaff().then(setStaff);
    apiService.getServices().then(s => {
      if (s.length > 0) {
        setServices(s);
        setSelectedService(s[0]);
      }
    });
  }, []);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff || !clientName) return;
    
    setLoading(true);
    try {
      const duration = parseInt(selectedDuration);
      const price = selectedService.rates[selectedDuration] || 0;
      
      await apiService.createBooking({
        serviceId: selectedService.id,
        therapistId: selectedStaff.id,
        therapistName: selectedStaff.name,
        date: selectedDate,
        startTime: selectedTime,
        endTime: calculateEndTime(selectedTime, duration),
        clientId: 'admin-manual',
        clientName,
        clientEmail: clientEmail || 'manual@mira.com',
        clientPhone,
        serviceName: selectedService.name,
        duration,
        price,
        status: 'confirmed',
        paymentStatus: 'fully-paid',
        isWalkIn,
        createdAt: new Date().toISOString(),
        depositPaid: true,
        intakeFormCompleted: true,
        source: isWalkIn ? 'Walk-in' : 'Manual',
        shopId: shopId
      });
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error) {
      console.error(error);
      alert("Failed to add booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const calculateEndTime = (start: string, duration: number) => {
    const [h, m] = start.split(':').map(Number);
    const totalMinutes = h * 60 + m + duration;
    const endH = Math.floor(totalMinutes / 60);
    const endM = totalMinutes % 60;
    return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
  };

  const times = Array.from({ length: 24 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9;
    const min = (i % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
  }).filter(t => {
    const h = parseInt(t.split(':')[0]);
    return h < 21;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 flex items-center justify-between border-b border-beige/20 bg-section/30">
          <div>
            <h3 className="font-serif font-bold text-primary text-2xl">{t('admin.quick_add')}</h3>
            <p className="text-earth/40 text-xs uppercase tracking-widest font-bold mt-1">Manual Entry for Walk-ins & Chat</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-beige/30 rounded-full transition-colors text-earth/40 hover:text-primary">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleQuickAdd} className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          {success ? (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 size={56} />
              </div>
              <h4 className="text-3xl font-serif font-bold text-primary mb-2">Booking Added!</h4>
              <p className="text-earth/60">The session has been successfully recorded.</p>
            </motion.div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Client Info */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-bold text-earth/30 uppercase tracking-[0.2em] border-b border-beige/20 pb-2">Client Information</h4>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-2">
                      <User size={14} /> Full Name *
                    </label>
                    <input 
                      required
                      type="text" 
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Customer Name"
                      className="w-full bg-section/50 border border-beige/20 rounded-2xl p-4 text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-2">
                      <Phone size={14} /> Phone Number
                    </label>
                    <input 
                      type="tel" 
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="04xx xxx xxx"
                      className="w-full bg-section/50 border border-beige/20 rounded-2xl p-4 text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-2">
                      <Mail size={14} /> Email (Optional)
                    </label>
                    <input 
                      type="email" 
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full bg-section/50 border border-beige/20 rounded-2xl p-4 text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-section/30 rounded-2xl border border-beige/10">
                    <input 
                      type="checkbox" 
                      id="walkin"
                      checked={isWalkIn}
                      onChange={(e) => setIsWalkIn(e.target.checked)}
                      className="w-5 h-5 rounded border-beige/30 text-primary focus:ring-primary"
                    />
                    <label htmlFor="walkin" className="text-sm font-bold text-primary cursor-pointer">
                      Walk-in Customer
                    </label>
                  </div>
                </div>

                {/* Right Column: Booking Details */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-bold text-earth/30 uppercase tracking-[0.2em] border-b border-beige/20 pb-2">Session Details</h4>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-2">
                      Service
                    </label>
                    <select 
                      value={selectedService.id}
                      onChange={(e) => {
                        const s = services.find(sv => sv.id === e.target.value);
                        if (s) {
                          setSelectedService(s);
                          setSelectedDuration(Object.keys(s.rates)[0]);
                        }
                      }}
                      className="w-full bg-section/50 border border-beige/20 rounded-2xl p-4 text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none"
                    >
                      {services.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-2">
                        Duration
                      </label>
                      <select 
                        value={selectedDuration}
                        onChange={(e) => setSelectedDuration(e.target.value)}
                        className="w-full bg-section/50 border border-beige/20 rounded-2xl p-4 text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      >
                        {Object.keys(selectedService.rates).map(d => (
                          <option key={d} value={d}>{d} mins</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-2">
                        Therapist
                      </label>
                      <select 
                        required
                        value={selectedStaff?.id || ''}
                        onChange={(e) => {
                          const s = staff.find(st => st.id === e.target.value);
                          if (s) setSelectedStaff(s);
                        }}
                        className="w-full bg-section/50 border border-beige/20 rounded-2xl p-4 text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      >
                        <option value="" disabled>Select Staff</option>
                        {staff.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-2">
                        Date
                      </label>
                      <input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-section/50 border border-beige/20 rounded-2xl p-4 text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-2">
                        Time
                      </label>
                      <select 
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full bg-section/50 border border-beige/20 rounded-2xl p-4 text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      >
                        {times.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button 
                  type="submit"
                  disabled={loading || !selectedStaff || !clientName}
                  className="w-full bg-primary text-white py-5 rounded-full font-bold text-lg hover:bg-sage transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Save size={24} />}
                  {loading ? 'Adding Booking...' : t('common.save')}
                </button>
              </div>
            </>
          )}
        </form>
      </motion.div>
    </div>
  );
};
