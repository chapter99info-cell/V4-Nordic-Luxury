import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';

export const QuickBookingForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: 'Thai',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    // ตารางราคา
    const servicePrices: Record<string, number> = {
      'Remedial': 100,
      'Thai': 95,
      'Deep Tissue': 110,
      'Aroma Oil': 90
    };

    // รวม Email เข้าไปใน Note เพื่อให้ลง Sheet เดิมได้โดยไม่ต้องแก้โครงสร้างตารางค่ะ
    const fullNote = `Email: ${formData.email || 'N/A'} | Note: ${formData.message || '-'}`;

    const now = new Date();
    const duration = 60;
    const startTime = now.toTimeString().slice(0, 5);
    const endTime = new Date(now.getTime() + duration * 60000).toTimeString().slice(0, 5);

    try {
      // 🚀 เชื่อมท่อตรงเข้า Google Apps Script และ Firestore ของพี่แสน
      await apiService.createBooking({
        clientId: 'guest',
        clientName: formData.name,
        clientEmail: formData.email || `${formData.phone.replace(/\s/g, '')}@mira.com`,
        clientPhone: formData.phone,
        serviceName: formData.service,
        serviceId: formData.service.toLowerCase().replace(' ', '-'),
        therapistId: 'any',
        therapistName: 'Any Staff',
        date: now.toISOString().split('T')[0],
        startTime,
        endTime,
        duration,
        price: servicePrices[formData.service] || 85,
        status: 'pending',
        paymentStatus: 'unpaid',
        isWalkIn: false,
        source: 'Web',
        createdAt: now.toISOString(),
        depositPaid: false,
        intakeFormCompleted: false,
        note: fullNote
      });

      setStatus('success');
      setFormData({ name: '', email: '', phone: '', service: 'Thai', message: '' });
      
    } catch (error) {
      console.error('Connection Error!', error);
      setStatus('error');
    }
  };

  return (
    <section className="py-24 bg-[#4A5D23] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <span className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.4em] block">Premium Care</span>
            <h2 className="text-4xl md:text-6xl font-serif font-bold text-white leading-tight">
              Mira <br />
              <span className="italic text-[#D4AF37]">Booking</span>
            </h2>
            <p className="text-white/60 text-lg leading-relaxed font-light max-w-md">
              Experience the art of healing. Fill this quick form and our manager will secure your preferred time within minutes.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="w-full max-w-md mx-auto"
          >
            <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-2xl shadow-black/20">
              <h3 className="text-2xl font-serif font-bold text-[#4A5D23] text-center mb-8">Quick Reservation</h3>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-[#4A5D23] text-[10px] font-bold uppercase tracking-widest">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="Your name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:border-[#4A5D23] transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[#4A5D23] text-[10px] font-bold uppercase tracking-widest">Email (Optional)</label>
                  <input 
                    type="email" 
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:border-[#4A5D23] transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[#4A5D23] text-[10px] font-bold uppercase tracking-widest">Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="04XX XXX XXX"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:border-[#4A5D23] transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[#4A5D23] text-[10px] font-bold uppercase tracking-widest">Select Service</label>
                  <select 
                    value={formData.service}
                    onChange={(e) => setFormData({...formData, service: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:outline-none"
                  >
                    <option value="Remedial">Remedial Massage ($100)</option>
                    <option value="Thai">Traditional Thai ($95)</option>
                    <option value="Deep Tissue">Deep Tissue ($110)</option>
                    <option value="Aroma Oil">Aroma Oil ($90)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-[#4A5D23] text-[10px] font-bold uppercase tracking-widest">Special Requests</label>
                  <textarea 
                    rows={2}
                    placeholder="Tell us about your pain or preferences..."
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:outline-none resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full bg-[#4A5D23] text-white py-5 rounded-xl font-bold text-sm uppercase tracking-[0.2em] hover:bg-[#3a4a1c] active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-[#4A5D23]/20"
                >
                  {status === 'loading' ? 'Sending Data...' : 'CONFIRM BOOKING'}
                </button>

                {status === 'success' && (
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex items-center justify-center gap-2 text-green-600 font-bold mt-4">
                    <CheckCircle2 size={18} /> Booking Success!
                  </motion.div>
                )}

                {status === 'error' && (
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex items-center justify-center gap-2 text-red-600 font-bold mt-4">
                    <AlertCircle size={18} /> Connection error. Try again.
                  </motion.div>
                )}
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default QuickBookingForm;
