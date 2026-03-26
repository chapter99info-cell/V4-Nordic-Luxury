import React from 'react';
import { motion } from 'motion/react';
import { 
  Banknote, 
  Smartphone, 
  Users, 
  Clock, 
  CheckCircle2, 
  Plus,
  User,
  Activity,
  ChevronRight,
  Coffee
} from 'lucide-react';

// 1. สร้างท่อปลอม (Mock Data) ไว้ตรงนี้
const MOCK_DATA = {
  stats: { totalCash: 450, totalTransfer: 820, customers: 12 },
  bookings: [
    { id: 1, name: "Customer A", service: "Oil 60", staff: "พี่นก", status: "In Progress", time: "10:00" },
    { id: 2, name: "Customer B", service: "Thai 90", staff: "พี่วรรณ", status: "Pending", time: "10:30" },
    { id: 3, name: "Customer C", service: "Foot 30", staff: "พี่ต้อย", status: "Completed", time: "09:30" },
    { id: 4, name: "Customer D", service: "Oil 90", staff: "พี่แหม่ม", status: "In Progress", time: "10:15" },
  ],
  staff: [
    { name: "พี่นก", status: "Busy", avatar: "N" }, 
    { name: "พี่วรรณ", status: "Busy", avatar: "W" },
    { name: "พี่ต้อย", status: "Available", avatar: "T" }, 
    { name: "พี่แหม่ม", status: "Busy", avatar: "M" },
    { name: "พี่เล็ก", status: "Available", avatar: "L" },
    { name: "พี่จอย", status: "Available", avatar: "J" },
    { name: "พี่ปลา", status: "Busy", avatar: "P" },
    { name: "พี่ฝน", status: "Available", avatar: "F" },
    { name: "พี่นุ่น", status: "Available", avatar: "N" },
    { name: "พี่แก้ว", status: "Available", avatar: "K" },
  ]
};

export const V4MockDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F5F5F0] p-4 md:p-8 font-sans text-[#333333] max-w-4xl mx-auto">
      
      {/* HEADER: Greeting & Date */}
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-[#006D77] mb-1">สวัสดีค่ะ คุณป้า 🙏</h1>
          <p className="text-stone-500 font-medium">วันนี้มีลูกค้า {MOCK_DATA.stats.customers} ท่านค่ะ</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs font-black text-stone-400 uppercase tracking-widest">พฤหัสบดีที่ 26 มีนาคม</p>
        </div>
      </header>

      {/* 1. ส่วนสรุปยอด (Stats Cards) - ตัวเลขใหญ่ อ่านง่าย */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-6 rounded-[2rem] shadow-xl shadow-[#006D77]/5 border-l-8 border-[#006D77] flex items-center justify-between"
        >
          <div>
            <p className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-1">ยอดโอน (PayID)</p>
            <p className="text-4xl font-black text-[#006D77]">${MOCK_DATA.stats.totalTransfer}</p>
          </div>
          <div className="w-12 h-12 bg-[#E6F0EE] rounded-2xl flex items-center justify-center text-[#006D77]">
            <Smartphone size={24} />
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white p-6 rounded-[2rem] shadow-xl shadow-orange-500/5 border-l-8 border-orange-400 flex items-center justify-between"
        >
          <div>
            <p className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-1">ยอดเงินสด</p>
            <p className="text-4xl font-black text-orange-600">${MOCK_DATA.stats.totalCash}</p>
          </div>
          <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
            <Banknote size={24} />
          </div>
        </motion.div>
      </div>

      {/* 2. ตารางคิวทอง (Booking List) - เน้นดูสถานะไวๆ */}
      <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-xl shadow-stone-200/50 mb-8 border border-stone-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
            <Clock className="text-[#006D77]" size={24} />
            คิววันนี้ (จำลอง)
          </h2>
          <span className="text-xs font-bold text-[#006D77] bg-[#E6F0EE] px-4 py-1.5 rounded-full uppercase tracking-widest">
            Real-time
          </span>
        </div>

        <div className="space-y-4">
          {MOCK_DATA.bookings.map(book => (
            <motion.div 
              key={book.id} 
              whileTap={{ scale: 0.98 }}
              className="flex justify-between items-center p-5 bg-[#FAF9F6] rounded-2xl border border-stone-100 hover:border-[#006D77]/20 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#006D77] font-bold shadow-sm border border-stone-100">
                  {book.time}
                </div>
                <div>
                  <p className="text-lg font-bold text-stone-800">{book.name} <span className="text-stone-400 font-medium ml-2">• {book.service}</span></p>
                  <p className="text-sm font-bold text-[#006D77] flex items-center gap-1">
                    <User size={14} />
                    พนักงาน: {book.staff}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest ${
                  book.status === 'In Progress' 
                    ? 'bg-blue-100 text-blue-600' 
                    : book.status === 'Completed'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-amber-100 text-amber-600'
                }`}>
                  {book.status === 'In Progress' ? 'กำลังนวด' : book.status === 'Completed' ? 'เสร็จแล้ว' : 'รอคิว'}
                </span>
                <ChevronRight className="text-stone-300 group-hover:text-[#006D77] transition-colors" size={20} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 3. สถานะพนักงาน (Staff Status) - 10 คน */}
      <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-xl shadow-stone-200/50 mb-8 border border-stone-100">
        <h2 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-2">
          <Users className="text-[#006D77]" size={24} />
          สถานะพนักงาน (10 คน)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {MOCK_DATA.staff.map((s, idx) => (
            <div key={idx} className="flex flex-col items-center p-4 bg-[#FAF9F6] rounded-2xl border border-stone-100">
              <div className="relative mb-2">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#006D77] font-black text-xl shadow-sm border border-stone-100">
                  {s.avatar}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                  s.status === 'Available' ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />
              </div>
              <p className="font-bold text-sm text-stone-800">{s.name}</p>
              <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${
                s.status === 'Available' ? 'text-emerald-600' : 'text-amber-600'
              }`}>
                {s.status === 'Available' ? 'ว่าง' : 'ติดงาน'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. ปุ่มกดสำหรับแอดมิน - ใหญ่พิเศษสำหรับหน้าจอมือถือ */}
      <div className="sticky bottom-6 left-0 right-0 px-4 md:px-0">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          className="w-full bg-[#006D77] text-white py-6 rounded-[2rem] text-2xl font-black shadow-2xl shadow-[#006D77]/30 hover:bg-[#005a63] transition-all flex items-center justify-center gap-4"
        >
          <Plus size={32} strokeWidth={3} />
          ลงคิวด่วน (Walk-in)
        </motion.button>
      </div>

      {/* FOOTER: Quick Links */}
      <div className="mt-12 grid grid-cols-3 gap-4 pb-12">
        <button className="flex flex-col items-center gap-2 text-stone-400 hover:text-[#006D77] transition-colors">
          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center">
            <Activity size={20} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">สถิติ</span>
        </button>
        <button className="flex flex-col items-center gap-2 text-stone-400 hover:text-[#006D77] transition-colors">
          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center">
            <Coffee size={20} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">พักเบรก</span>
        </button>
        <button className="flex flex-col items-center gap-2 text-stone-400 hover:text-[#006D77] transition-colors">
          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center">
            <User size={20} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">ตั้งค่า</span>
        </button>
      </div>
    </div>
  );
};
