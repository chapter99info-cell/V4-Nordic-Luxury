import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare, Copy, Check, Receipt, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopName: string;
}

const services = [
  'Remedial Massage',
  'Thai Traditional Massage',
  'Aromatherapy Oil Massage',
  'Foot Reflexology',
  'Deep Tissue - Neck, Shoulders, Back'
];

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, shopName }) => {
  const [customerName, setCustomerName] = useState('');
  const [selectedService, setSelectedService] = useState(services[0]);
  const [amount, setAmount] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const generateMessage = () => {
    return `Thank you for choosing ${shopName}. Your payment of $${amount} for ${selectedService} is confirmed. We hope you feel completely rejuvenated and relaxed. It was an honor to be part of your wellness journey today. We look forward to welcoming you back to our sanctuary soon.`;
  };

  const handleSendSMS = () => {
    if (!customerName || !amount) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วนก่อนนะคะ / Please fill in all fields.');
      return;
    }
    const message = generateMessage();
    const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    window.location.href = smsUrl;
  };

  const handleCopy = async () => {
    if (!customerName || !amount) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วนก่อนนะคะ / Please fill in all fields.');
      return;
    }
    const message = generateMessage();
    try {
      await navigator.clipboard.writeText(message);
      setIsCopied(true);
      toast.success('คัดลอกข้อความเรียบร้อยแล้วค่ะ / Message copied!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error('ไม่สามารถคัดลอกได้ค่ะ / Failed to copy.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#1a3a3a]/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border-4 border-[#D4AF37]/20"
          >
            {/* Header */}
            <div className="bg-[#FDFBF7] p-8 border-b-2 border-[#D4AF37]/10 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-[#D4AF37] p-3 rounded-2xl text-white shadow-lg">
                  <Receipt size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-[#1a3a3a]">ออกใบเสร็จ / Create Receipt</h2>
                  <p className="text-[#1a3a3a]/50 font-bold">กรอกข้อมูลเพื่อส่งให้ลูกค้าค่ะ / Fill details to send.</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-4 hover:bg-rose-50 text-rose-500 rounded-full transition-colors border-2 border-transparent hover:border-rose-100"
              >
                <X size={32} />
              </button>
            </div>

            {/* Form Content */}
            <div className="p-10 space-y-8">
              {/* Customer Name */}
              <div className="space-y-3">
                <label className="block text-xl font-black text-[#1a3a3a] ml-4">
                  ชื่อลูกค้า / Customer Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="เช่น คุณสมชาย / e.g. Mr. Smith"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-[#FDFBF7] border-3 border-[#D4AF37]/10 rounded-[2rem] p-6 text-2xl font-bold text-[#1a3a3a] focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 outline-none transition-all"
                />
              </div>

              {/* Service Selection */}
              <div className="space-y-3">
                <label className="block text-xl font-black text-[#1a3a3a] ml-4">
                  บริการที่เลือก / Service <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full bg-[#FDFBF7] border-3 border-[#D4AF37]/10 rounded-[2rem] p-6 text-2xl font-bold text-[#1a3a3a] focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 outline-none transition-all appearance-none cursor-pointer"
                  >
                    {services.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-8 top-1/2 -translate-y-1/2 text-[#D4AF37] pointer-events-none" size={32} />
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-3">
                <label className="block text-xl font-black text-[#1a3a3a] ml-4">
                  ราคาที่จ่ายจริง / Amount Paid ($ AUD) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-8 top-1/2 -translate-y-1/2 text-3xl font-black text-[#D4AF37]">$</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-[#FDFBF7] border-3 border-[#D4AF37]/10 rounded-[2rem] p-6 pl-16 text-4xl font-black text-[#1a3a3a] focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Preview Box */}
              <div className="bg-[#1a3a3a]/5 p-6 rounded-[2rem] border-2 border-dashed border-[#1a3a3a]/10">
                <p className="text-xs font-black text-[#1a3a3a]/40 uppercase tracking-widest mb-3 ml-2">
                  ตัวอย่างข้อความ / Message Preview
                </p>
                <div className="bg-white p-6 rounded-2xl text-lg font-bold text-[#1a3a3a]/80 leading-relaxed shadow-inner">
                  {generateMessage()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <button
                  onClick={handleSendSMS}
                  className="flex items-center justify-center gap-4 bg-[#22C55E] hover:bg-[#16A34A] text-white p-8 rounded-[2.5rem] font-black text-2xl shadow-xl shadow-green-500/20 transition-all hover:scale-[1.02] active:scale-95 border-b-8 border-[#15803D]"
                >
                  <MessageSquare size={32} />
                  <span>ส่งใบเสร็จให้ลูกค้า / Send to Customer</span>
                </button>

                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-4 bg-[#1a3a3a] hover:bg-black text-white p-8 rounded-[2.5rem] font-black text-2xl shadow-xl shadow-black/20 transition-all hover:scale-[1.02] active:scale-95 border-b-8 border-black"
                >
                  {isCopied ? <Check size={32} /> : <Copy size={32} />}
                  <span>คัดลอก / Copy</span>
                </button>
              </div>

              <div className="text-center">
                <p className="text-[#1a3a3a]/40 font-bold text-lg">
                  กดปุ่มสีเขียวเพื่อส่งใบเสร็จให้ลูกค้าทันทีค่ะ<br/>
                  <span className="text-sm opacity-60">Tap the green button to send the receipt now.</span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
