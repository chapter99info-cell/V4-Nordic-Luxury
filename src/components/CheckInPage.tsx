import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, MapPin, Phone, Clock, ChevronRight, Sparkles, Heart, Award, ShieldCheck, Users, Info } from 'lucide-react';
import { shopConfig } from '../config/shopConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';

export const CheckInPage: React.FC = () => {
  const [step, setStep] = useState<'welcome' | 'service' | 'success'>('welcome');
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<string>('');

  const handleCheckIn = async (serviceName?: string) => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'notifications'), {
        type: 'check-in',
        title: 'ลูกค้ามาถึงแล้วค่ะ / Customer Arrived',
        message: serviceName 
          ? `ลูกค้ามาถึงแล้วค่ะ และเลือกบริการ: ${serviceName}` 
          : 'มีลูกค้าเช็กอินที่หน้าเคาน์เตอร์ค่ะ / A customer has checked in at the counter.',
        serviceName: serviceName || 'ยังไม่ได้เลือก',
        createdAt: serverTimestamp(),
        isRead: false
      });
      
      if (serviceName) {
        setStep('success');
        toast.success('แจ้งพนักงานเรียบร้อยแล้วค่ะ / Notification sent');
      } else {
        setStep('service');
      }
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error('เช็กอินไม่สำเร็จค่ะ กรุณาแจ้งพนักงาน / Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#1A1A1B] font-sans pb-20">
      {/* Header / Hero */}
      <header className="relative h-[35vh] flex flex-col items-center justify-center overflow-hidden bg-[#1A1A1B]">
        <img 
          src={shopConfig.heroImage} 
          alt="Mira Royale" 
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#F5F5F0]" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center px-6"
        >
          <div className="w-20 h-20 mx-auto rounded-full border-4 border-[#D4AF37] shadow-2xl overflow-hidden mb-4 bg-white">
            <img src={shopConfig.logo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-black text-[#D4AF37] tracking-tight leading-tight mb-2">
            ยินดีต้อนรับสู่ Mira Royale ค่ะ
          </h1>
          <p className="text-2xl font-bold text-[#1A1A1B] opacity-80">
            Welcome to Mira Royale
          </p>
        </motion.div>
      </header>

      <main className="max-w-4xl mx-auto px-6 -mt-8 relative z-20">
        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <motion.div 
              key="welcome-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[3rem] p-12 shadow-2xl shadow-[#D4AF37]/20 border-4 border-[#D4AF37]/20 text-center mb-12"
            >
              <div className="space-y-10">
                <div className="space-y-4">
                  <h2 className="text-4xl font-black text-[#1A1A1B]">มาถึงร้านแล้วใช่ไหมคะ?</h2>
                  <p className="text-2xl font-bold text-[#1A1A1B]/60 italic">Are you here for your appointment?</p>
                </div>
                
                <button 
                  onClick={() => handleCheckIn()}
                  disabled={loading}
                  className="w-full py-10 bg-[#D4AF37] text-white rounded-[3rem] font-black text-4xl uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-[#D4AF37]/40 border-b-[12px] border-[#b8962d] flex items-center justify-center gap-6"
                >
                  {loading ? (
                    <span className="animate-pulse">กำลังส่งข้อมูล...</span>
                  ) : (
                    <>
                      <Users size={48} />
                      ฉันมาถึงแล้วค่ะ / I am here
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'service' && (
            <motion.div 
              key="service-step"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-10"
            >
              <div className="bg-white rounded-[3rem] p-10 shadow-2xl border-4 border-[#D4AF37] text-center">
                <h2 className="text-4xl font-black text-[#D4AF37] mb-4">วันนี้คุณต้องการรับบริการอะไรคะ?</h2>
                <p className="text-2xl font-bold text-[#1A1A1B]/60">What service would you like today?</p>
              </div>

              <div className="grid grid-cols-1 gap-8">
                {shopConfig.services.map((service) => (
                  <motion.button
                    key={service.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCheckIn(service.name)}
                    className="bg-white rounded-[3rem] overflow-hidden shadow-xl border-4 border-transparent hover:border-[#D4AF37] transition-all flex flex-col md:flex-row text-left group"
                  >
                    <div className="md:w-1/3 h-56 md:h-auto overflow-hidden relative">
                      <img 
                        src={service.image} 
                        alt={service.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-2xl shadow-lg">
                        <span className="text-2xl font-black text-[#D4AF37]">${service.fullPrice}</span>
                      </div>
                    </div>
                    <div className="p-8 flex-1 flex flex-col justify-center space-y-4">
                      <h3 className="text-3xl font-black text-[#1A1A1B]">{service.name}</h3>
                      <p className="text-xl font-bold text-[#1A1A1B]/60 leading-relaxed">{service.description}</p>
                      <div className="flex items-center gap-4 text-[#D4AF37]">
                        <Clock size={24} />
                        <span className="text-xl font-black uppercase tracking-widest">{service.duration} MIN</span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div 
              key="success-step"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[4rem] p-16 shadow-2xl border-8 border-green-500 text-center space-y-10"
            >
              <div className="w-32 h-32 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={80} />
              </div>
              <div className="space-y-6">
                <h2 className="text-5xl font-black text-green-600">ขอบคุณค่ะ!</h2>
                <p className="text-3xl font-bold text-[#1A1A1B]/80 leading-tight">
                  กรุณานั่งรอสักครู่ พนักงานกำลังจะออกไปต้อนรับนะคะ <br/>
                  <span className="text-2xl text-[#1A1A1B]/50 mt-4 block italic">
                    Thank you. Please take a seat, we will be with you shortly.
                  </span>
                </p>
              </div>
              <button 
                onClick={() => setStep('welcome')}
                className="px-12 py-5 bg-gray-100 text-gray-500 rounded-full font-bold text-xl hover:bg-gray-200 transition-colors"
              >
                กลับหน้าแรก / Back to Home
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Digital Menu / Price List */}
        <div className="space-y-10">
          <div className="text-center space-y-2">
            <span className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.4em] block">Digital Menu</span>
            <h2 className="text-4xl font-serif font-bold text-[#1A1A1B]">รายการนวดและราคา / Price List</h2>
            <div className="w-20 h-1 bg-[#D4AF37] mx-auto mt-4 rounded-full" />
          </div>

          <div className="grid grid-cols-1 gap-6">
            {shopConfig.services.map((service) => (
              <motion.div 
                key={service.id}
                whileHover={{ y: -5 }}
                className="bg-white rounded-[2.5rem] overflow-hidden shadow-lg border border-[#D4AF37]/5 flex flex-col md:flex-row"
              >
                <div className="md:w-1/3 h-48 md:h-auto overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-8 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-2xl font-serif font-bold text-[#1A1A1B]">{service.name}</h3>
                        <p className="text-[#D4AF37] text-sm font-bold uppercase tracking-widest mt-1">{service.type}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-black text-[#D4AF37]">${service.fullPrice}</span>
                        <p className="text-xs text-[#1A1A1B]/40 font-bold uppercase">AUD / {service.duration} MIN</p>
                      </div>
                    </div>
                    <p className="text-[#1A1A1B]/60 text-sm leading-relaxed">{service.description}</p>
                    
                    <div className="flex flex-wrap gap-2 pt-2">
                      {service.keyBenefits?.map((benefit, idx) => (
                        <span key={idx} className="px-3 py-1 bg-[#F5F5F0] text-[#1A1A1B]/60 text-[10px] font-bold uppercase tracking-wider rounded-full border border-[#D4AF37]/10">
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-[#F5F5F0] flex items-center justify-between text-[#1A1A1B]/40">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                      <Clock size={14} />
                      {service.duration} Minutes
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                      <Heart size={14} className="text-[#D4AF37]" />
                      Best for: {service.bestFor}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-20 text-center space-y-8 pb-10">
          <div className="flex justify-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-[#D4AF37]">
                <Phone size={20} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Call Us</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-[#D4AF37]">
                <MapPin size={20} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Location</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-[#D4AF37]">
                <Clock size={20} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Hours</span>
            </div>
          </div>
          <p className="text-[10px] font-bold text-[#1A1A1B]/20 uppercase tracking-[0.3em]">
            © 2026 Mira Royale • Premium Thai Massage
          </p>
        </div>
      </main>
    </div>
  );
};

export default CheckInPage;
