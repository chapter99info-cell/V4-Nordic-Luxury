import React from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  DollarSign, 
  Wind, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  ShieldCheck,
  Sparkles,
  UserCheck
} from 'lucide-react';

// โทนสี Nordic Luxury ที่พี่แสนวางไว้
const colors = {
  beige: '#F5F5F0', // Warm Beige - พื้นหลังหลัก
  teal: '#006D77',  // Rich Teal - สีเน้นหลัก, ปุ่มกด
  sage: '#E6F0EE',  // Soft Sage - พื้นหลังการ์ด, สถานะว่าง
  charcoal: '#333333', // สีตัวหนังสือหลัก
};

export const V4CoreFeatureShowcase: React.FC = () => {
  // ข้อมูลสมมติสำหรับหน้าจอตารางคิวทอง 5 นาที
  const staff = ["พี่นก", "พี่วรรณ", "พี่ต้อย"];
  const timeSlots = ["10:00", "10:05", "10:10", "10:15", "10:20"];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] p-4 md:p-8 text-[#333333] font-sans">
      
      {/* 1. ส่วนหัว: ความนิ่งท่ามกลางความวุ่นวาย (Nordic Peace) */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col md:flex-row items-center justify-between mb-12 pb-6 border-b border-[#E6F0EE] gap-6"
      >
        <div className="text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold text-[#006D77] tracking-tight">แอป V4: มือปราบคิวทอง</h1>
          <p className="text-xl mt-2 text-stone-500 font-medium">จัดการร้านนวดให้ลื่นไหล สบายตา สบายใจ</p>
        </div>
        <div className="flex items-center gap-4 bg-white/50 backdrop-blur-md p-3 px-6 rounded-full border border-white shadow-sm">
          <span className="text-lg font-bold text-[#006D77]">สวัสดีค่ะ คุณพี่เจ้าของร้าน</span>
          <div className="w-14 h-14 rounded-2xl bg-[#006D77] flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-[#006D77]/20">
            P
          </div>
        </div>
      </motion.header>

      {/* 2. แสดงผล 3 จุดขายหลัก (The Three Pillars) */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        
        {/* -- การ์ดที่ 1: ความไวคือปีศาจ (5-Minute Hustle) -- */}
        <motion.div 
          variants={itemVariants}
          className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-stone-200/50 border border-[#E6F0EE] flex flex-col"
        >
          <div className="flex items-center gap-5 mb-8">
            <div className="w-16 h-16 bg-[#E6F0EE] rounded-2xl flex items-center justify-center text-[#006D77]">
              <Zap size={32} fill="currentColor" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-stone-800">ความไวคือปีศาจ</h2>
              <p className="text-lg text-[#006D77] font-bold opacity-70 uppercase tracking-wider">5-Minute Hustle</p>
            </div>
          </div>
          
          <p className="text-lg mb-8 leading-relaxed text-stone-600">
            ไม่มี Buffer บังคับ! ซอยคิวถี่ 5 นาที ได้ตามสไตล์หมอนวดไทยที่อยากได้เงิน
            <span className="block mt-2 font-bold text-[#006D77] text-xl">✨ คิวแน่น = เงินเยอะ</span>
          </p>
          
          {/* ตัวอย่าง Grid ตารางคิวทอง (Mini-Timeline) */}
          <div className="bg-[#FAF9F6] rounded-3xl p-4 border border-[#E6F0EE] overflow-hidden">
            <div className="grid grid-cols-6 gap-2 mb-3">
              <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest">หมอ</div>
              {timeSlots.map(time => (
                <div key={time} className="text-[10px] font-black text-stone-400 text-center">{time}</div>
              ))}
            </div>
            
            <div className="space-y-3">
              {staff.map((name, idx) => (
                <div key={name} className="grid grid-cols-6 gap-2 items-center">
                  <div className="text-sm font-bold text-[#006D77] truncate">{name}</div>
                  <div className={`col-span-2 h-10 rounded-xl flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${idx === 0 ? 'bg-[#006D77]' : idx === 1 ? 'bg-[#D4A373]' : 'bg-[#E29578]'}`}>
                    Oil 60
                  </div>
                  <div className="col-span-3 h-10 bg-[#E6F0EE] rounded-xl border border-dashed border-[#006D77]/20"></div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-8">
             <motion.button 
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               className="w-full bg-[#006D77] text-white py-5 px-8 rounded-3xl text-xl font-bold shadow-xl shadow-[#006D77]/20 hover:bg-[#005a63] transition-all flex items-center justify-center gap-3"
             >
              <Clock size={24} />
              ลงคิวด่วน (2 คลิกจบ)
             </motion.button>
          </div>
        </motion.div>

        {/* -- การ์ดที่ 2: ประหยัดเงินเจ้าของร้าน (Zero-Fee Evangelist) -- */}
        <motion.div 
          variants={itemVariants}
          className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-stone-200/50 border border-[#E6F0EE] flex flex-col"
        >
          <div className="flex items-center gap-5 mb-8">
            <div className="w-16 h-16 bg-[#E6F0EE] rounded-2xl flex items-center justify-center text-[#006D77]">
              <DollarSign size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-stone-800">ประหยัดเงินเจ้าของ</h2>
              <p className="text-lg text-[#006D77] font-bold opacity-70 uppercase tracking-wider">Zero-Fee Evangelist</p>
            </div>
          </div>
          
          <p className="text-lg mb-8 leading-relaxed text-stone-600">
            สนับสนุน PayID / Cash แบบ 100% ไม่บังคับจ่ายผ่านแอปเพื่อหัก Merchant Fee
            <span className="block mt-2 font-bold text-[#006D77] text-xl">💰 เจ้าของรับเงินเต็มๆ</span>
          </p>
          
          {/* ตัวอย่างเปรียบเทียบยอดเงิน */}
          <div className="flex-1 p-6 bg-[#E6F0EE] rounded-[2rem] flex flex-col gap-6 border border-white">
            <div className="bg-white p-5 rounded-2xl border-2 border-[#006D77] shadow-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold text-stone-400 uppercase tracking-wider">ยอดรับผ่าน V4</span>
                <CheckCircle2 className="text-[#006D77]" size={18} />
              </div>
              <div className="flex justify-between items-end">
                <span className="text-stone-600 font-medium">PayID / Cash</span>
                <span className="text-4xl font-black text-[#006D77]">$1,200</span>
              </div>
            </div>

            <div className="space-y-3 px-2">
              <div className="flex justify-between items-center text-stone-500 font-medium">
                <span>ค่าธรรมเนียมแอป (0%)</span>
                <span className="font-bold text-emerald-600">-$0.00</span>
              </div>
              <div className="h-px bg-stone-300/50"></div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-bold text-stone-800">เงินเข้ากระเป๋าพี่</span>
                <span className="text-3xl font-black text-[#006D77]">$1,200</span>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-stone-50 rounded-2xl border border-stone-200 flex items-start gap-3">
             <TrendingUp className="text-amber-500 shrink-0 mt-1" size={20} />
             <p className="text-sm text-stone-500 leading-snug">
               <span className="font-bold text-stone-700">ประหยัดกว่า:</span> แอปอื่นหัก 1.75% พี่จะเสียเงินฟรี <span className="text-red-500 font-bold">$21.00</span> ต่อวันเลยนะคะ!
             </p>
          </div>
        </motion.div>

        {/* -- การ์ดที่ 3: ความนิ่งท่ามกลางความวุ่นวาย (The Nordic Peace) -- */}
        <motion.div 
          variants={itemVariants}
          className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-stone-200/50 border border-[#E6F0EE] flex flex-col"
        >
          <div className="flex items-center gap-5 mb-8">
            <div className="w-16 h-16 bg-[#E6F0EE] rounded-2xl flex items-center justify-center text-[#006D77]">
              <Wind size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-stone-800">ความนิ่งในความวุ่นวาย</h2>
              <p className="text-lg text-[#006D77] font-bold opacity-70 uppercase tracking-wider">The Nordic Peace</p>
            </div>
          </div>
          
          <p className="text-lg mb-8 leading-relaxed text-stone-600">
            แอปอื่นปุ่มเยอะ ตัวเลขยุ่งเหยิง แต่ V4 ดีไซน์ Nordic Luxury
            <span className="block mt-2 font-bold text-[#006D77] text-xl">🌊 ทำให้พี่รู้สึก "ใจเย็น"</span>
          </p>
          
          {/* ตัวอย่าง UI สรุปสถานะที่เรียบง่ายที่สุด */}
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div className="bg-[#E6F0EE] p-6 rounded-[2rem] text-center flex flex-col justify-center border border-white">
              <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">กำลังนวด</div>
              <div className="text-6xl font-black text-[#006D77]">4</div>
              <div className="text-xs font-bold text-stone-500 mt-2">คน</div>
            </div>
            <div className="bg-[#FAF9F6] p-6 rounded-[2rem] text-center flex flex-col justify-center border border-[#E6F0EE]">
              <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">หมอว่าง</div>
              <div className="text-6xl font-black text-stone-300">6</div>
              <div className="text-xs font-bold text-stone-500 mt-2">คน</div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-[#006D77]/5 rounded-[2rem] border border-[#006D77]/10 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 text-[#006D77]/10 group-hover:scale-110 transition-transform">
               <Sparkles size={48} />
             </div>
             <div className="relative z-10">
               <div className="flex items-center gap-2 mb-2">
                 <UserCheck className="text-[#006D77]" size={18} />
                 <span className="text-sm font-bold text-[#006D77] uppercase tracking-widest">Gentle Nudge</span>
               </div>
               <p className="text-stone-700 font-medium leading-relaxed">
                 "คุณวรรณคะ อีก 15 นาทีมีนัดนะคะ เตรียมพบลูกค้าได้เลยค่ะ"
               </p>
             </div>
          </div>
        </motion.div>

      </motion.div>

      {/* Footer / CTA */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-16 text-center"
      >
        <p className="text-stone-400 font-bold uppercase tracking-[0.4em] text-xs">
          Mira Royale • V4 Edition 2026
        </p>
      </motion.div>

    </div>
  );
};
