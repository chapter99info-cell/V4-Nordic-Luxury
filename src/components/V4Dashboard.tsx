import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Calendar, Settings, 
  LogOut, TrendingUp, Clock, CheckCircle2,
  Plus, Edit2, Trash2, X, Check, AlertCircle,
  Camera, User as UserIcon, Shield, DollarSign,
  PieChart, ArrowUpRight, ArrowDownRight, Filter,
  Receipt, Bell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, onSnapshot, addDoc, updateDoc, setDoc,
  deleteDoc, doc, serverTimestamp, query, orderBy, where, limit 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Staff, Booking } from '../types';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { ServicePricing } from './ServicePricing';
import { ReceiptModal } from './ReceiptModal';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

const V4Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [role] = useState<string | null>(localStorage.getItem('userRole'));
  const [staffName] = useState<string | null>(localStorage.getItem('staffName'));
  const [activeTab, setActiveTab] = useState('overview');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(true);
  const [showCheckInAlert, setShowCheckInAlert] = useState(false);
  const [latestCheckIn, setLatestCheckIn] = useState<any>(null);

  useEffect(() => {
    // Fetch Booking Status
    const unsubscribeBooking = onSnapshot(doc(db, 'settings', 'booking'), (docSnap) => {
      if (docSnap.exists()) {
        setIsBookingOpen(docSnap.data().isOpen);
      }
    });

    // Fetch Bookings
    const qBookings = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsubscribeBookings = onSnapshot(qBookings, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(data);
    });

    // Fetch Staff
    const qStaff = query(collection(db, 'staff'), orderBy('name', 'asc'));
    const unsubscribeStaff = onSnapshot(qStaff, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff));
      setStaff(data);
      setLoading(false);
    });

    // Listen for Check-in Notifications
    const qCheckIn = query(
      collection(db, 'notifications'), 
      where('type', '==', 'check-in'),
      where('isRead', '==', false),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const unsubscribeCheckIn = onSnapshot(qCheckIn, (snapshot) => {
      if (!snapshot.empty) {
        const notification = snapshot.docs[0].data();
        const now = Date.now();
        const createdAt = notification.createdAt?.toMillis() || now;
        
        // Only alert for notifications created in the last 30 seconds
        if (now - createdAt < 30000) {
          setLatestCheckIn(notification);
          setShowCheckInAlert(true);
          // Play clear "Ding!" sound
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
          audio.volume = 0.8;
          audio.play().catch(e => console.log('Audio play failed:', e));
          
          // Auto hide after 15 seconds
          setTimeout(() => setShowCheckInAlert(false), 15000);
        }
      }
    });

    return () => {
      unsubscribeBooking();
      unsubscribeBookings();
      unsubscribeStaff();
      unsubscribeCheckIn();
    };
  }, []);

  const toggleBookingStatus = async () => {
    try {
      await setDoc(doc(db, 'settings', 'booking'), {
        isOpen: !isBookingOpen,
        updatedAt: serverTimestamp()
      }, { merge: true });
      toast.success(isBookingOpen ? 'หยุดรับจองแล้วค่ะ / Bookings stopped' : 'เปิดรับจองแล้วค่ะ / Bookings opened');
    } catch (error) {
      console.error('Error toggling booking status:', error);
      toast.error('ทำรายการไม่สำเร็จค่ะ / Operation failed');
    }
  };

  const sendStaffAlert = async () => {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: 'owner', // Assuming owner receives all notifications
        title: '🚨 แจ้งเตือนพนักงานไม่พอค่ะ / Staff Shortage Alert',
        message: `พนักงาน ${staffName} แจ้งว่าพนักงานไม่พอในขณะนี้ค่ะ / Staff ${staffName} reported a shortage.`,
        type: 'system',
        isRead: false,
        createdAt: serverTimestamp()
      });
      toast.success('ส่งแจ้งเตือนให้เจ้าของร้านแล้วค่ะ / Alert sent to owner');
    } catch (error) {
      console.error('Error sending alert:', error);
      toast.error('ส่งแจ้งเตือนไม่สำเร็จค่ะ / Failed to send alert');
    }
  };

  // คำนวณสถิติสำหรับ Header
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const todayRevenue = bookings
    .filter(b => b.date === todayStr && (b.status === 'completed' || b.status === 'confirmed'))
    .reduce((sum, b) => sum + (b.price || b.subtotal || 0), 0);
  
  const activeStaffCount = staff.filter(s => s.status === 'Working' && s.isActive).length;
  const totalBookingsCount = bookings.length;

  // ฟังก์ชัน Logout
  const handleLogout = () => {
    localStorage.clear();
    navigate('/'); // ใช้ navigate แทน window.location.href เพื่อความเสถียรของ SPA
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2D241E] flex font-sans text-[clamp(1rem,1.5vw,1.25rem)]">
      {/* --- Sidebar --- */}
      <aside className="sidebar-responsive bg-[#F5F2ED] border-r-2 border-[#D4AF37]/10 p-8 flex flex-col shadow-2xl">
        <div className="mb-12 text-center">
          <h2 className="text-[#D4AF37] font-serif text-3xl font-bold italic">Mira Royale</h2>
          <p className="text-xs text-[#2D241E]/40 tracking-[0.2em] uppercase mt-2 font-bold">Management V5 - Light Mode</p>
        </div>

        <nav className="flex-1 space-y-4">
          <SidebarItem 
            icon={<LayoutDashboard />} 
            label={<>หน้าแรกค่ะ<br/><span className="text-sm opacity-70">Overview</span></>} 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')} 
          />
          <SidebarItem 
            icon={<Calendar />} 
            label={<>รายการจองค่ะ<br/><span className="text-sm opacity-70">Bookings</span></>} 
            active={activeTab === 'bookings'} 
            onClick={() => setActiveTab('bookings')} 
          />
          
          {/* เมนูเฉพาะ Owner */}
          {role === 'owner' && (
            <>
              <SidebarItem 
                icon={<PieChart />} 
                label={<>รายได้ค่ะ<br/><span className="text-sm opacity-70">Analytics</span></>} 
                active={activeTab === 'analytics'} 
                onClick={() => setActiveTab('analytics')} 
              />
              <SidebarItem 
                icon={<DollarSign />} 
                label={<>รายการราคาค่ะ<br/><span className="text-sm opacity-70">Service Pricing</span></>} 
                active={activeTab === 'pricing'} 
                onClick={() => setActiveTab('pricing')} 
              />
              <SidebarItem 
                icon={<Users />} 
                label={<>จัดการพนักงานค่ะ<br/><span className="text-sm opacity-70">Staff</span></>} 
                active={activeTab === 'staff'} 
                onClick={() => setActiveTab('staff')} 
              />
              <SidebarItem 
                icon={<Settings />} 
                label={<>ตั้งค่าร้านค่ะ<br/><span className="text-sm opacity-70">Settings</span></>} 
                active={activeTab === 'settings'} 
                onClick={() => setActiveTab('settings')} 
              />
            </>
          )}
        </nav>

        <button 
          onClick={handleLogout}
          className="mt-auto flex items-center gap-4 text-rose-600 hover:text-rose-700 transition-all p-6 bg-rose-50 rounded-[2rem] border-2 border-rose-100 shadow-md hover:shadow-lg"
        >
          <LogOut size={32} /> <span className="text-xl font-bold uppercase tracking-wider">ออกระบบ / Logout</span>
        </button>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 p-16 overflow-y-auto">
        <header className="flex justify-between items-center mb-16">
          <div>
            <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-serif font-bold text-[#2D241E] leading-tight">
              สวัสดีค่ะคุณ {role === 'owner' ? 'เจ้าของร้าน' : staffName}
            </h1>
            <p className="text-[#2D241E]/60 text-[clamp(1.25rem,3vw,2rem)] mt-3 font-bold">ยินดีต้อนรับกลับมาค่ะ / Welcome back.</p>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsReceiptModalOpen(true)}
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white px-10 py-6 rounded-[2.5rem] font-black text-2xl shadow-xl shadow-green-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-4 border-b-8 border-[#15803D]"
            >
              <Receipt size={36} />
              <span>ออกใบเสร็จค่ะ / Create Receipt</span>
            </button>
            <div className="flex items-center gap-6 bg-white p-6 rounded-[2.5rem] border-2 border-[#D4AF37]/10 px-10 shadow-xl">
              <div className="w-5 h-5 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
              <span className="text-lg font-bold uppercase tracking-widest text-[#2D241E]/80">ระบบทำงานปกติค่ะ / Online</span>
            </div>
          </div>
        </header>

        {/* ส่วนแสดงสถิติ (Stats Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
          <StatCard 
            title="การจองทั้งหมด / Total Bookings" 
            value={totalBookingsCount.toString()} 
            icon={<Calendar className="text-[#D4AF37]" />} 
          />
          <StatCard 
            title="รายได้วันนี้ / Revenue (Today)" 
            value={todayRevenue.toLocaleString()} 
            icon={<TrendingUp className="text-green-600" />} 
            isCurrency={true}
          />
          <StatCard 
            title="พนักงานที่ทำงาน / Active Staff" 
            value={activeStaffCount.toString()} 
            icon={<Users className="text-blue-600" />} 
          />
        </div>

        {/* เนื้อหาหลักตาม Tab */}
        <section className="rounded-[3rem] p-12 bg-white border-2 border-[#D4AF37]/10 text-[#2D241E] shadow-2xl min-h-[500px]">
          {activeTab === 'overview' && (
            <OverviewContent 
              bookings={bookings} 
              role={role} 
              isBookingOpen={isBookingOpen} 
              onToggle={toggleBookingStatus}
              onAlert={sendStaffAlert}
            />
          )}
          {activeTab === 'staff' && role === 'owner' && <StaffManagementContent staffList={staff} />}
          {activeTab === 'analytics' && role === 'owner' && <RevenueAnalyticsContent bookings={bookings} />}
          {activeTab === 'pricing' && <ServicePricing isAdmin={true} />}
          {activeTab === 'bookings' && (
            <BookingsContent 
              bookings={bookings} 
              isBookingOpen={isBookingOpen} 
              onToggle={toggleBookingStatus} 
              role={role} 
              onAlert={sendStaffAlert}
            />
          )}
          {activeTab === 'settings' && role === 'owner' && <SettingsContent />}
        </section>
      </main>

      {/* --- Check-in Alert Overlay --- */}
      <AnimatePresence>
        {showCheckInAlert && (
          <motion.div 
            initial={{ opacity: 0, y: -200, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -200, scale: 0.5 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[2000] w-[95%] max-w-4xl"
          >
            <div className="bg-[#D4AF37] text-white p-12 rounded-[4rem] shadow-[0_35px_60px_-15px_rgba(212,175,55,0.5)] flex flex-col items-center text-center gap-8 border-8 border-white">
              <div className="w-32 h-32 bg-white text-[#D4AF37] rounded-full flex items-center justify-center animate-bounce shadow-2xl">
                <Users size={64} />
              </div>
              <div className="space-y-4">
                <h3 className="text-5xl font-black uppercase tracking-widest">ลูกค้ามาถึงแล้วค่ะ!</h3>
                <p className="text-3xl font-bold opacity-90">Customer Arrived at Counter</p>
                
                {latestCheckIn?.serviceName && (
                  <div className="mt-8 p-6 bg-white/20 rounded-[2rem] border-4 border-white/30">
                    <p className="text-2xl font-bold opacity-80 mb-2">บริการที่เลือก / Selected Service:</p>
                    <p className="text-5xl font-black text-white drop-shadow-lg">
                      {latestCheckIn.serviceName}
                    </p>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => setShowCheckInAlert(false)}
                className="mt-4 px-12 py-6 bg-white text-[#D4AF37] rounded-[2rem] text-2xl font-black uppercase tracking-widest hover:bg-gray-100 transition-all shadow-xl active:scale-95"
              >
                รับทราบค่ะ / OK, GOT IT
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Help Floating Button (Senior Friendly) --- */}
      <ReceiptModal 
        isOpen={isReceiptModalOpen} 
        onClose={() => setIsReceiptModalOpen(false)} 
        shopName="Mira Royale" 
      />
    </div>
  );
};

// Component ย่อย: รายการเมนู Sidebar
const SidebarItem = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-6 p-6 rounded-[2rem] transition-all ${
      active 
        ? 'bg-[#D4AF37] text-white shadow-xl shadow-[#D4AF37]/30 scale-105' 
        : 'text-[#2D241E]/40 hover:bg-[#D4AF37]/10 hover:text-[#2D241E]'
    }`}
  >
    <div className="icon-size-responsive flex items-center justify-center">
      {React.cloneElement(icon, { size: '100%' })}
    </div>
    <span className="menu-item-text text-xl font-bold uppercase tracking-wider text-left leading-tight">{label}</span>
  </button>
);

// Component ย่อย: บัตรสถิติ
const StatCard = ({ title, value, icon, isCurrency }: any) => (
  <div className="bg-white border-2 border-[#D4AF37]/10 p-[clamp(1.5rem,3vw,2.5rem)] rounded-[clamp(1.5rem,4vw,3rem)] flex items-center justify-between shadow-md hover:shadow-xl transition-all">
    <div>
      <p className="text-[#D4AF37] text-sm uppercase tracking-[0.2em] mb-3 font-black">{title}</p>
      {isCurrency ? (
        <div className="flex items-baseline gap-2">
          <span className="text-[clamp(1.5rem,3vw,2.5rem)] font-black text-[#D4AF37]">$</span>
          <p className="text-[clamp(2.5rem,6vw,4rem)] font-black text-[#2D241E]">{value}</p>
          <span className="text-[clamp(1rem,2vw,1.5rem)] font-black text-[#2D241E]/40 ml-2">AUD</span>
        </div>
      ) : (
        <p className="text-[clamp(2.5rem,6vw,4rem)] font-black text-[#2D241E]">{value}</p>
      )}
    </div>
    <div className="p-6 bg-[#FDFBF7] rounded-[2rem] border-2 border-[#D4AF37]/10 shadow-inner">
      {React.cloneElement(icon, { size: 40 })}
    </div>
  </div>
);

// Component ย่อย: หน้าต่างยืนยันการลบ (Senior Friendly)
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }: any) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full max-w-lg bg-white border-4 border-[#D4AF37]/20 rounded-[4rem] p-12 text-center shadow-2xl"
        >
          <div className="w-28 h-28 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-8 text-rose-500 border-2 border-rose-500/20">
            <AlertCircle size={56} />
          </div>
          <h2 className="text-4xl font-bold text-[#2D241E] mb-6">{title}</h2>
          <p className="text-2xl text-[#2D241E]/60 mb-12 leading-relaxed font-bold">{message}</p>
          <div className="flex gap-6">
            <button 
              onClick={onClose}
              className="flex-1 py-6 bg-gray-100 rounded-[2rem] font-bold text-2xl text-[#2D241E]/40 hover:bg-gray-200 transition-all border-2 border-gray-200"
            >
              ยกเลิกค่ะ / Cancel
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 py-6 bg-rose-600 text-white rounded-[2rem] font-bold text-2xl hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/30"
            >
              ยืนยันค่ะ / Confirm
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// Component ย่อย: เนื้อหาหน้า Overview
const OverviewContent = ({ bookings, role, isBookingOpen, onToggle, onAlert }: any) => (
  <div className="space-y-10">
    {/* Emergency Toggle Section */}
    <div className="bg-white rounded-[3.5rem] p-12 border-2 border-[#D4AF37]/20 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full -mr-32 -mt-32 blur-3xl" />
      
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
            <div className={`w-4 h-4 rounded-full animate-ping ${isBookingOpen ? 'bg-green-500' : 'bg-rose-500'}`} />
            <h3 className="text-3xl font-black uppercase tracking-widest text-[#2D241E]">
              สถานะการรับจอง / Booking Status
            </h3>
          </div>
          <p className={`text-5xl md:text-6xl font-black mb-6 ${isBookingOpen ? 'text-green-500' : 'text-rose-500'}`}>
            {isBookingOpen ? 'เปิดรับจองตามปกติค่ะ' : 'หยุดรับจองชั่วคราวค่ะ'}
            <br/>
            <span className="text-3xl opacity-80">
              {isBookingOpen ? 'Open for Bookings' : 'Stop Bookings'}
            </span>
          </p>
          <div className="bg-[#FDFBF7] p-6 rounded-3xl border border-[#2D241E]/10 inline-block">
            <p className="text-xl text-[#2D241E]/60 font-bold">
              💡 {role === 'owner' 
                ? 'ใช้สำหรับหยุดรับลูกค้าใหม่เมื่อพนักงานไม่พอค่ะ' 
                : 'หากพนักงานไม่พอ กรุณาแจ้งเจ้าของร้านหรือกดปุ่มแจ้งเตือนค่ะ'}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6">
          {role === 'owner' ? (
            <button 
              onClick={onToggle}
              className={`group relative w-64 h-32 rounded-full transition-all duration-500 shadow-2xl ${
                isBookingOpen ? 'bg-green-600 shadow-green-600/20' : 'bg-rose-600 shadow-rose-600/20'
              }`}
            >
              <div className={`absolute top-2 w-28 h-28 bg-white rounded-full transition-all duration-500 shadow-lg flex items-center justify-center ${
                isBookingOpen ? 'left-34' : 'left-2'
              }`}>
                {isBookingOpen ? (
                  <Check size={48} className="text-green-600" />
                ) : (
                  <X size={48} className="text-rose-600" />
                )}
              </div>
              <span className={`absolute inset-0 flex items-center justify-center text-2xl font-black uppercase tracking-widest pointer-events-none ${
                isBookingOpen ? 'pr-32 text-white/40' : 'pl-32 text-white/40'
              }`}>
                {isBookingOpen ? 'OPEN' : 'STOP'}
              </span>
            </button>
          ) : (
            <button 
              onClick={onAlert}
              className="px-12 py-8 bg-rose-600 text-white rounded-[3rem] font-black text-3xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-rose-600/30 flex items-center gap-6 border-b-8 border-rose-800"
            >
              <Bell size={48} className="animate-bounce" />
              <span>แจ้งพนักงานไม่พอค่ะ<br/><span className="text-xl opacity-70">Staff Shortage Alert</span></span>
            </button>
          )}
        </div>
      </div>
    </div>

    <div className="bg-white rounded-[2.5rem] p-12 border border-[#2D241E]/10 shadow-2xl">
      <h3 className="text-3xl font-bold mb-10 flex items-center gap-4 text-[#2D241E]">
        <Clock size={36} className="text-[#D4AF37]" /> กิจกรรมล่าสุดค่ะ / Recent Activities
      </h3>
      <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-[#2D241E]/5 rounded-[2rem]">
        <p className="text-[#2D241E]/40 text-center text-2xl font-bold tracking-wider">
          ไม่มีกิจกรรมล่าสุดค่ะ / No recent activities
        </p>
      </div>
    </div>
  </div>
);

// Component ย่อย: เนื้อหาหน้า Revenue & Analytics
const RevenueAnalyticsContent = ({ bookings }: { bookings: Booking[] }) => {
  const [filter, setFilter] = useState<'today' | '7days' | 'month'>('7days');

  // คำนวณรายได้
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const thisMonthStr = now.toISOString().slice(0, 7);

  const dailyRevenue = bookings
    .filter(b => b.date === todayStr && (b.status === 'completed' || b.status === 'confirmed'))
    .reduce((sum, b) => sum + (b.price || b.subtotal || 0), 0);

  const monthlyRevenue = bookings
    .filter(b => b.date.startsWith(thisMonthStr) && (b.status === 'completed' || b.status === 'confirmed'))
    .reduce((sum, b) => sum + (b.price || b.subtotal || 0), 0);

  const totalPaidBookings = bookings.filter(b => b.status === 'completed' || b.status === 'confirmed').length;

  // เตรียมข้อมูลกราฟ 7 วันล่าสุด
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const revenue = bookings
      .filter(b => b.date === dateStr && (b.status === 'completed' || b.status === 'confirmed'))
      .reduce((sum, b) => sum + (b.price || b.subtotal || 0), 0);
    return { name: dayName, revenue, date: dateStr };
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
    >
      {/* Header & Filter */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-5xl font-serif font-bold text-[#2D241E]">รายได้และสถิติ / Revenue & Analytics</h2>
          <p className="text-[#2D241E]/60 text-2xl font-bold mt-3">ติดตามผลประกอบการของร้านคุณ / Track your business growth.</p>
        </div>
        <div className="flex bg-white p-3 rounded-[2rem] border-2 border-[#D4AF37]/10 shadow-inner">
          {(['today', '7days', 'month'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-8 py-4 rounded-[1.5rem] text-lg font-black uppercase tracking-widest transition-all ${
                filter === f ? 'bg-[#D4AF37] text-white shadow-lg' : 'text-[#2D241E]/40 hover:text-[#2D241E]'
              }`}
            >
              {f === 'today' ? 'วันนี้ / Today' : f === '7days' ? '7 วัน / 7 Days' : 'เดือนนี้ / Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="bg-white border-2 border-[#D4AF37]/10 p-12 rounded-[3.5rem] shadow-xl hover:shadow-[#D4AF37]/5 transition-all">
          <div className="flex justify-between items-start mb-8">
            <div className="p-5 bg-green-500/10 rounded-[2rem] text-green-500 border-2 border-green-500/20">
              <DollarSign size={40} />
            </div>
            <span className="flex items-center gap-2 text-sm font-black text-green-500 bg-green-500/10 px-5 py-2 rounded-full uppercase border-2 border-green-500/20">
              <ArrowUpRight size={20} /> 12%
            </span>
          </div>
          <p className="text-[#2D241E]/40 text-sm uppercase tracking-[0.2em] mb-3 font-black">รายได้วันนี้ / Daily Earnings</p>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-[#D4AF37]">$</span>
            <p className="text-6xl font-black text-[#2D241E]">{dailyRevenue.toLocaleString()}</p>
            <span className="text-2xl font-black text-[#2D241E]/40 ml-2">AUD</span>
          </div>
        </div>

        <div className="bg-white border-2 border-[#D4AF37]/10 p-12 rounded-[3.5rem] shadow-xl hover:shadow-[#D4AF37]/5 transition-all">
          <div className="flex justify-between items-start mb-8">
            <div className="p-5 bg-amber-500/10 rounded-[2rem] text-amber-500 border-2 border-amber-500/20">
              <TrendingUp size={40} />
            </div>
            <span className="flex items-center gap-2 text-sm font-black text-green-500 bg-green-500/10 px-5 py-2 rounded-full uppercase border-2 border-green-500/20">
              <ArrowUpRight size={20} /> 8%
            </span>
          </div>
          <p className="text-[#2D241E]/40 text-sm uppercase tracking-[0.2em] mb-3 font-black">รายได้เดือนนี้ / Monthly Earnings</p>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-[#D4AF37]">$</span>
            <p className="text-6xl font-black text-[#2D241E]">{monthlyRevenue.toLocaleString()}</p>
            <span className="text-2xl font-black text-[#2D241E]/40 ml-2">AUD</span>
          </div>
        </div>

        <div className="bg-white border-2 border-[#D4AF37]/10 p-12 rounded-[3.5rem] shadow-xl hover:shadow-[#D4AF37]/5 transition-all">
          <div className="flex justify-between items-start mb-8">
            <div className="p-5 bg-blue-500/10 rounded-[2rem] text-blue-500 border-2 border-blue-500/20">
              <CheckCircle2 size={40} />
            </div>
          </div>
          <p className="text-[#2D241E]/40 text-sm uppercase tracking-[0.2em] mb-3 font-black">การจองที่สำเร็จ / Total Paid</p>
          <p className="text-6xl font-black text-[#2D241E]">{totalPaidBookings}</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white border-2 border-[#D4AF37]/10 p-10 rounded-[3rem] shadow-xl">
        <h3 className="text-2xl font-bold text-[#2D241E] mb-10 flex items-center gap-3">
          <TrendingUp size={28} className="text-[#D4AF37]" /> แนวโน้มรายได้ (7 วันล่าสุด) / Revenue Trend (Last 7 Days)
        </h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#2D241E', fontSize: 16, fontWeight: 'bold' }} 
                dy={15}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#2D241E', fontSize: 16, fontWeight: 'bold' }} 
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                cursor={{ fill: '#FDFBF7' }}
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '2px solid #D4AF37', 
                  borderRadius: '24px',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  padding: '16px',
                  color: '#2D241E'
                }}
                itemStyle={{ color: '#2D241E' }}
              />
              <Bar dataKey="revenue" radius={[12, 12, 0, 0]} barSize={60}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 6 ? '#10b981' : '#D4AF37'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white border-2 border-[#D4AF37]/10 rounded-[3rem] overflow-hidden shadow-xl">
        <div className="p-10 border-b-2 border-[#2D241E]/5 flex justify-between items-center bg-[#FDFBF7]">
          <h3 className="text-2xl font-bold text-[#2D241E]">รายการธุรกรรมล่าสุด / Recent Transactions</h3>
          <button className="text-[#D4AF37] text-lg font-black uppercase tracking-widest hover:underline">ดูทั้งหมด / View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#FDFBF7]">
                <th className="px-10 py-6 text-sm uppercase tracking-widest text-[#2D241E]/40 font-black">ลูกค้า / Customer</th>
                <th className="px-10 py-6 text-sm uppercase tracking-widest text-[#2D241E]/40 font-black">บริการ / Service</th>
                <th className="px-10 py-6 text-sm uppercase tracking-widest text-[#2D241E]/40 font-black">จำนวนเงิน / Amount</th>
                <th className="px-10 py-6 text-sm uppercase tracking-widest text-[#2D241E]/40 font-black">เวลา / Time</th>
                <th className="px-10 py-6 text-sm uppercase tracking-widest text-[#2D241E]/40 font-black">สถานะ / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#2D241E]/5">
              {bookings.slice(0, 5).map((booking) => (
                <tr key={booking.id} className="hover:bg-[#FDFBF7] transition-colors">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] font-black text-xl border-2 border-[#D4AF37]/20">
                        {booking.clientName?.charAt(0)}
                      </div>
                      <span className="text-xl font-bold text-[#2D241E]">{booking.clientName}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-xl text-[#2D241E]/70 font-medium">{booking.serviceName}</td>
                  <td className="px-10 py-8 text-3xl font-black text-[#2D241E]">${(booking.price || booking.subtotal || 0).toLocaleString()} <span className="text-lg opacity-50">AUD</span></td>
                  <td className="px-10 py-8 text-lg text-[#2D241E]/50 font-bold">{booking.date} {booking.startTime}</td>
                  <td className="px-10 py-8">
                    <span className={`px-5 py-2 rounded-full text-sm font-black uppercase shadow-sm border-2 ${
                      booking.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                      booking.status === 'confirmed' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                      'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}>
                      {booking.status === 'completed' ? 'เสร็จสิ้น / Completed' : 
                       booking.status === 'confirmed' ? 'ยืนยันแล้ว / Confirmed' : 
                       'รอดำเนินการ / Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

// Component ย่อย: เนื้อหาหน้า Staff Management
const StaffManagementContent = ({ staffList }: { staffList: Staff[] }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<string | null>(null);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    avatar: '',
    isActive: true,
    status: 'Off' as 'Working' | 'Off',
    specialties: [] as string[]
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleOpenModal = (item?: Staff) => {
    if (item) {
      setEditingStaff(item);
      setFormData({
        name: item.name,
        role: item.role,
        avatar: item.avatar || '',
        isActive: item.isActive,
        status: item.status,
        specialties: item.specialties || []
      });
    } else {
      setEditingStaff(null);
      setFormData({
        name: '',
        role: '',
        avatar: '',
        isActive: true,
        status: 'Off',
        specialties: []
      });
    }
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('กรุณาเลือกไฟล์รูปภาพ / Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('ขนาดรูปต้องไม่เกิน 2MB / Image size must be less than 2MB');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('กำลังอัปโหลดรูป... / Uploading image...');

    try {
      const storageRef = ref(storage, `staff-avatars/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setFormData(prev => ({ ...prev, avatar: downloadURL }));
      toast.success('อัปโหลดสำเร็จ / Image uploaded successfully', { id: toastId });
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('อัปโหลดไม่สำเร็จ / Failed to upload image', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await updateDoc(doc(db, 'staff', editingStaff.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        toast.success('อัปเดตข้อมูลสำเร็จ / Staff updated successfully');
      } else {
        await addDoc(collection(db, 'staff'), {
          ...formData,
          createdAt: serverTimestamp()
        });
        toast.success('เพิ่มพนักงานใหม่สำเร็จ / New staff added successfully');
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving staff:', error);
      toast.error('บันทึกข้อมูลไม่สำเร็จ / Failed to save staff');
    }
  };

  const handleDeleteClick = (id: string) => {
    setStaffToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!staffToDelete) return;
    try {
      await deleteDoc(doc(db, 'staff', staffToDelete));
      toast.success('ลบพนักงานสำเร็จ / Staff deleted successfully');
      setIsConfirmOpen(false);
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast.error('ลบไม่สำเร็จ / Failed to delete staff');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="text-4xl font-bold flex items-center gap-4 text-[#2D241E]">
            <Users size={40} className="text-[#D4AF37]" /> จัดการพนักงาน / Staff Directory
          </h3>
          <p className="text-[#2D241E]/70 text-xl mt-2 font-medium">ดูแลทีมงานมืออาชีพของคุณ / Manage your professional team</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-[#D4AF37] text-white px-12 py-6 rounded-[2.5rem] font-black text-2xl flex items-center gap-4 hover:scale-105 transition-transform shadow-xl shadow-[#D4AF37]/40 border-b-4 border-[#b8962d]"
        >
          <Plus size={32} /> เพิ่มพนักงาน / Add Staff
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {staffList.map((member) => (
          <motion.div 
            layout
            key={member.id}
            className="bg-white border-2 border-[#2D241E]/5 rounded-[3.5rem] p-10 hover:border-[#D4AF37] transition-all group shadow-2xl"
          >
            <div className="flex items-start justify-between mb-10">
              <div className="flex items-center gap-8">
                <div className="relative">
                  <img 
                    src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`} 
                    alt={member.name} 
                    className="w-28 h-28 rounded-full border-4 border-[#D4AF37]/30 object-cover shadow-xl"
                  />
                  <div className={`absolute -bottom-1 -right-1 w-10 h-10 rounded-full border-4 border-white ${member.isActive ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-rose-500 shadow-lg shadow-rose-500/50'}`} />
                </div>
                <div>
                  <h4 className="font-bold text-3xl text-[#2D241E] mb-2">{member.name}</h4>
                  <p className="text-[#D4AF37] text-lg uppercase tracking-widest font-black">{member.role}</p>
                </div>
              </div>
              <div className="flex flex-col gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleOpenModal(member)}
                  className="p-5 bg-[#FDFBF7] rounded-2xl text-[#2D241E]/40 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors border border-[#2D241E]/10"
                >
                  <Edit2 size={28} />
                </button>
                <button 
                  onClick={() => handleDeleteClick(member.id)}
                  className="p-5 bg-[#FDFBF7] rounded-2xl text-[#2D241E]/40 hover:text-rose-600 hover:bg-rose-500/10 transition-colors border border-[#2D241E]/10"
                >
                  <Trash2 size={28} />
                </button>
              </div>
            </div>

            <div className="space-y-6 bg-[#FDFBF7] p-8 rounded-[2.5rem] border border-[#2D241E]/5">
              <div className="flex items-center justify-between text-xl">
                <span className="text-[#2D241E]/40 font-bold uppercase tracking-wider">สถานะ / Status</span>
                <span className={`font-black ${member.status === 'Working' ? 'text-green-500' : 'text-[#2D241E]/20'}`}>
                  {member.status === 'Working' ? 'กำลังทำงาน / Working' : 'พักงาน / Off'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xl">
                <span className="text-[#2D241E]/40 font-bold uppercase tracking-wider">บัญชี / Account</span>
                <span className={`px-6 py-2 rounded-full text-sm font-black uppercase ${member.isActive ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                  {member.isActive ? 'ใช้งานได้ / Active' : 'ปิดใช้งาน / Inactive'}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Staff Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white border-2 border-[#2D241E]/10 rounded-[4rem] p-12 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50" />
              
              <div className="flex justify-between items-center mb-12">
                <div>
                  <h2 className="text-4xl font-bold text-[#2D241E]">
                    {editingStaff ? 'แก้ไขข้อมูลพนักงาน / Edit Staff' : 'เพิ่มพนักงานใหม่ / Add New Staff'}
                  </h2>
                  <p className="text-[#2D241E]/60 text-xl mt-2 font-medium">กรอกรายละเอียดพนักงานด้านล่าง / Fill in details below</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-6 bg-[#FDFBF7] rounded-3xl text-[#2D241E]/40 hover:text-[#2D241E] transition-colors border border-[#2D241E]/10"
                >
                  <X size={36} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="space-y-8">
                  <div>
                    <label className="block text-lg uppercase tracking-[0.1em] text-[#2D241E]/40 mb-4 ml-6 font-black">ชื่อ-นามสกุล / Full Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-8 top-1/2 -translate-y-1/2 text-[#D4AF37]" size={32} />
                      <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="เช่น สมชาย ใจดี / e.g. Somchai Jaidee"
                        className="w-full bg-[#FDFBF7] border-2 border-[#2D241E]/10 rounded-[2.5rem] py-7 px-10 pl-20 text-2xl font-bold text-[#2D241E] focus:ring-4 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-lg uppercase tracking-[0.1em] text-[#2D241E]/40 mb-4 ml-6 font-black">ตำแหน่ง / Professional Role</label>
                    <div className="relative">
                      <Shield className="absolute left-8 top-1/2 -translate-y-1/2 text-[#D4AF37]" size={32} />
                      <input 
                        required
                        type="text" 
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        placeholder="เช่น ช่างนวดอาวุโส / e.g. Senior Therapist"
                        className="w-full bg-[#FDFBF7] border-2 border-[#2D241E]/10 rounded-[2.5rem] py-7 px-10 pl-20 text-2xl font-bold text-[#2D241E] focus:ring-4 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-lg uppercase tracking-[0.1em] text-[#2D241E]/40 mb-4 ml-6 font-black">รูปถ่ายพนักงาน / Staff Photo</label>
                    <div className="flex items-center gap-10 p-8 bg-[#FDFBF7] rounded-[3rem] border-2 border-[#2D241E]/10">
                      <div className="relative group">
                        <div className="w-40 h-40 rounded-full border-4 border-[#D4AF37]/30 overflow-hidden bg-white flex items-center justify-center shadow-xl">
                          {formData.avatar ? (
                            <img src={formData.avatar} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="text-[#2D241E]/10" size={64} />
                          )}
                        </div>
                        {isUploading && (
                          <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                            <Loader2 className="text-[#D4AF37] animate-spin" size={48} />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 space-y-5">
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          className="hidden" 
                          accept="image/*"
                        />
                        <button 
                          type="button"
                          disabled={isUploading}
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-6 bg-white border-2 border-[#2D241E]/10 rounded-3xl text-xl font-black uppercase tracking-widest text-[#2D241E] hover:bg-gray-50 transition-all flex items-center justify-center gap-4 disabled:opacity-50 shadow-sm"
                        >
                          <Camera size={32} className="text-[#D4AF37]" />
                          {formData.avatar ? 'เปลี่ยนรูป / Change' : 'อัปโหลดรูป / Upload'}
                        </button>
                        <p className="text-sm text-[#2D241E]/40 uppercase tracking-widest text-center font-bold">ขนาดสูงสุด: 2MB (JPG, PNG)</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-8 bg-[#FDFBF7] rounded-[2.5rem] border-2 border-[#2D241E]/10">
                    <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${formData.isActive ? 'bg-green-500/20 text-green-600' : 'bg-rose-500/20 text-rose-600'}`}>
                        {formData.isActive ? <Check size={40} /> : <AlertCircle size={40} />}
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-[#2D241E]">สถานะบัญชี / Account Status</p>
                        <p className="text-sm text-[#2D241E]/50 uppercase tracking-widest font-bold">อนุญาตให้พนักงานเข้าระบบ / Allow login</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                      className={`w-20 h-10 rounded-full transition-colors relative ${formData.isActive ? 'bg-green-500' : 'bg-gray-200'}`}
                    >
                      <div className={`absolute top-1 w-8 h-8 bg-white rounded-full transition-all shadow-md ${formData.isActive ? 'left-11' : 'left-1'}`} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-8 pt-8">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-7 bg-gray-100 rounded-[2.5rem] font-black text-2xl uppercase tracking-widest text-[#2D241E]/60 hover:bg-gray-200 hover:text-[#2D241E] transition-all border-2 border-gray-200"
                  >
                    ยกเลิก / Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-[1.5] py-7 bg-[#D4AF37] text-white rounded-[2.5rem] font-black text-2xl uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-[#D4AF37]/30 border-b-4 border-[#b8962d]"
                  >
                    {editingStaff ? 'อัปเดตข้อมูล / Update' : 'สร้างพนักงาน / Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="คุณแน่ใจใช่ไหม? / Are you sure?"
        message="การลบข้อมูลนี้จะไม่สามารถกู้คืนได้ / This action cannot be undone."
      />
    </div>
  );
};

// Component ย่อย: เนื้อหาหน้า Bookings Management
const BookingsContent = ({ bookings, isBookingOpen, onToggle, role, onAlert }: { bookings: Booking[], isBookingOpen: boolean, onToggle: () => void, role: string | null, onAlert: () => void }) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [bookingToUpdate, setBookingToUpdate] = useState<{id: string, status: string} | null>(null);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setBookingToUpdate({ id, status: newStatus });
    setIsConfirmOpen(true);
  };

  const confirmUpdate = async () => {
    if (!bookingToUpdate) return;
    try {
      await updateDoc(doc(db, 'bookings', bookingToUpdate.id), {
        status: bookingToUpdate.status,
        updatedAt: serverTimestamp()
      });
      toast.success('อัปเดตสถานะสำเร็จ / Status updated successfully');
      setIsConfirmOpen(false);
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('อัปเดตไม่สำเร็จ / Failed to update status');
    }
  };

  return (
    <div className="space-y-12">
      {/* Booking Status Toggle (V5 Modern) */}
      <div className="bg-white rounded-[3.5rem] p-12 border-2 border-[#D4AF37]/20 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
              <div className={`w-4 h-4 rounded-full animate-ping ${isBookingOpen ? 'bg-green-500' : 'bg-rose-500'}`} />
              <h3 className="text-3xl font-black uppercase tracking-widest text-[#D4AF37]">
                สถานะการรับจอง / BOOKING STATUS
              </h3>
            </div>
            <p className={`text-[clamp(2.5rem,8vw,5rem)] font-black mb-6 ${isBookingOpen ? 'text-green-500' : 'text-rose-500'} leading-tight`}>
              {isBookingOpen ? 'เปิดรับจองตามปกติค่ะ' : 'หยุดรับจองชั่วคราวค่ะ'}
              <br/>
              <span className="text-[clamp(1.5rem,4vw,2.5rem)] opacity-80">
                {isBookingOpen ? 'Open for Bookings' : 'Stop Bookings'}
              </span>
            </p>
            <div className="bg-[#FDFBF7] p-6 rounded-3xl border border-[#2D241E]/10 inline-block">
              <p className="text-xl text-[#2D241E]/60 font-bold">
                💡 {role === 'owner' 
                  ? 'ใช้สำหรับหยุดรับลูกค้าใหม่เมื่อพนักงานไม่พอค่ะ' 
                  : 'หากพนักงานไม่พอ กรุณาแจ้งเจ้าของร้านหรือกดปุ่มแจ้งเตือนค่ะ'}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6">
            {role === 'owner' ? (
              <button 
                onClick={onToggle}
                className={`group relative w-64 h-32 rounded-full transition-all duration-500 shadow-2xl ${
                  isBookingOpen ? 'bg-green-600 shadow-green-600/20' : 'bg-rose-600 shadow-rose-600/20'
                }`}
              >
                <div className={`absolute top-2 w-28 h-28 bg-white rounded-full transition-all duration-500 shadow-lg flex items-center justify-center ${
                  isBookingOpen ? 'translate-x-32' : 'translate-x-0'
                }`}>
                  {isBookingOpen ? (
                    <Check size={48} className="text-green-600" />
                  ) : (
                    <X size={48} className="text-rose-600" />
                  )}
                </div>
                <span className={`absolute inset-0 flex items-center justify-center text-2xl font-black uppercase tracking-widest pointer-events-none ${
                  isBookingOpen ? 'pr-32 text-white/40' : 'pl-32 text-white/40'
                }`}>
                  {isBookingOpen ? 'OPEN' : 'STOP'}
                </span>
              </button>
            ) : (
              <button 
                onClick={onAlert}
                className="group relative w-64 h-32 rounded-full bg-rose-500 shadow-2xl shadow-rose-500/20 hover:scale-105 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 border-b-8 border-rose-700"
              >
                <Bell size={48} className="text-white animate-bounce" />
                <span className="text-xl font-black text-white uppercase tracking-tighter">แจ้งพนักงานไม่พอค่ะ</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-4xl font-bold flex items-center gap-4 text-[#2D241E]">
            <Calendar size={40} className="text-[#D4AF37]" /> รายการจองทั้งหมด / All Bookings
          </h3>
          <p className="text-[#2D241E]/70 text-xl mt-2 font-medium">จัดการคิวและสถานะการจอง / Manage queues and statuses</p>
        </div>
      </div>

      <div className="overflow-x-auto bg-white border-2 border-[#2D241E]/5 rounded-[3.5rem] shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-[#2D241E]/5 bg-[#FDFBF7]">
              <th className="px-6 py-4 text-[clamp(0.875rem,1.5vw,1.125rem)] uppercase tracking-widest text-[#2D241E]/60 font-black">ลูกค้า / Customer</th>
              <th className="px-6 py-4 text-[clamp(0.875rem,1.5vw,1.125rem)] uppercase tracking-widest text-[#2D241E]/60 font-black">บริการ / Service</th>
              <th className="px-6 py-4 text-[clamp(0.875rem,1.5vw,1.125rem)] uppercase tracking-widest text-[#2D241E]/60 font-black">วัน-เวลา / Date-Time</th>
              <th className="px-6 py-4 text-[clamp(0.875rem,1.5vw,1.125rem)] uppercase tracking-widest text-[#2D241E]/60 font-black">สถานะ / Status</th>
              <th className="px-6 py-4 text-[clamp(0.875rem,1.5vw,1.125rem)] uppercase tracking-widest text-[#2D241E]/60 font-black text-center">จัดการ / Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2D241E]/5">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-[#FDFBF7] transition-colors">
                <td className="px-6 py-4">
                  <p className="text-[clamp(1.125rem,2vw,1.5rem)] font-bold text-[#2D241E]">{booking.clientName}</p>
                  <p className="text-[clamp(0.875rem,1.5vw,1rem)] text-[#2D241E]/40 font-medium">{booking.clientPhone}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-[clamp(1rem,1.8vw,1.25rem)] font-bold text-[#2D241E]">{booking.serviceName}</p>
                  <p className="text-[clamp(1.5rem,2.5vw,2rem)] text-[#D4AF37] font-black">${(booking.price || booking.subtotal || 0).toLocaleString()} <span className="text-sm opacity-50">AUD</span></p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-[clamp(1rem,1.8vw,1.25rem)] font-bold text-[#2D241E]">{booking.date}</p>
                  <p className="text-[clamp(0.875rem,1.5vw,1rem)] text-[#2D241E]/40 font-medium">{booking.startTime}</p>
                </td>
                <td className="px-10 py-8">
                  <span className={`px-6 py-2 rounded-full text-sm font-black uppercase border-2 ${
                    booking.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                    booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                    booking.status === 'cancelled' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                    'bg-amber-100 text-amber-700 border-amber-200'
                  }`}>
                    {booking.status === 'completed' ? 'เสร็จสิ้น / Completed' : 
                     booking.status === 'confirmed' ? 'ยืนยันแล้ว / Confirmed' : 
                     booking.status === 'cancelled' ? 'ยกเลิกแล้ว / Cancelled' : 
                     'รอดำเนินการ / Pending'}
                  </span>
                </td>
                <td className="px-10 py-8">
                  <div className="flex gap-4 justify-center">
                    {booking.status === 'pending' && (
                      <button 
                        onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                        className="p-5 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/30"
                        title="ยืนยัน / Confirm"
                      >
                        <Check size={32} />
                      </button>
                    )}
                    {(booking.status === 'confirmed' || booking.status === 'pending') && (
                      <button 
                        onClick={() => handleStatusUpdate(booking.id, 'completed')}
                        className="p-5 bg-green-600 text-white rounded-2xl hover:bg-green-500 transition-all shadow-lg shadow-green-600/30"
                        title="เสร็จสิ้น / Complete"
                      >
                        <CheckCircle2 size={32} />
                      </button>
                    )}
                    {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                      <button 
                        onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                        className="p-5 bg-rose-600 text-white rounded-2xl hover:bg-rose-500 transition-all shadow-lg shadow-rose-600/30"
                        title="ยกเลิก / Cancel"
                      >
                        <X size={32} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmUpdate}
        title="เปลี่ยนสถานะ? / Change Status?"
        message="คุณแน่ใจใช่ไหมที่จะเปลี่ยนสถานะการจองนี้? / Are you sure you want to change this booking status?"
      />
    </div>
  );
};

// Component ย่อย: หน้าต่างตั้งค่าร้าน
const SettingsContent = () => {
  const [shopInfo, setShopInfo] = useState({
    name: 'Mira Royale Spa',
    phone: '02-123-4567',
    address: '123 Sukhumvit Road, Bangkok',
    openTime: '10:00',
    closeTime: '22:00'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'shop'), (docSnap) => {
      if (docSnap.exists()) {
        setShopInfo(docSnap.data() as any);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    try {
      await setDoc(doc(db, 'settings', 'shop'), {
        ...shopInfo,
        updatedAt: serverTimestamp()
      }, { merge: true });
      toast.success('บันทึกการตั้งค่าแล้ว / Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('บันทึกไม่สำเร็จ / Failed to save settings');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#D4AF37]" size={40} /></div>;

  return (
    <div className="max-w-4xl">
      <div className="mb-12">
        <h3 className="text-4xl font-bold flex items-center gap-4 text-[#2D241E]">
          <Settings size={40} className="text-[#D4AF37]" /> ตั้งค่าร้าน / Shop Settings
        </h3>
        <p className="text-[#2D241E]/70 text-xl mt-2 font-medium">ปรับแต่งข้อมูลพื้นฐานของร้านคุณ / Customize your shop details</p>
      </div>

      <div className="space-y-10 bg-white border-2 border-[#2D241E]/5 rounded-[4rem] p-12 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <label className="block text-lg uppercase tracking-[0.1em] text-[#2D241E]/40 mb-4 ml-6 font-black">ชื่อร้าน / Shop Name</label>
            <input 
              type="text" 
              value={shopInfo.name}
              onChange={(e) => setShopInfo({...shopInfo, name: e.target.value})}
              className="w-full bg-[#FDFBF7] border-2 border-[#2D241E]/10 rounded-[2.5rem] py-7 px-10 text-2xl font-bold text-[#2D241E] focus:ring-4 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all outline-none"
            />
          </div>
          <div>
            <label className="block text-lg uppercase tracking-[0.1em] text-[#2D241E]/40 mb-4 ml-6 font-black">เบอร์โทรศัพท์ / Phone Number</label>
            <input 
              type="text" 
              value={shopInfo.phone}
              onChange={(e) => setShopInfo({...shopInfo, phone: e.target.value})}
              className="w-full bg-[#FDFBF7] border-2 border-[#2D241E]/10 rounded-[2.5rem] py-7 px-10 text-2xl font-bold text-[#2D241E] focus:ring-4 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-lg uppercase tracking-[0.1em] text-[#2D241E]/40 mb-4 ml-6 font-black">ที่อยู่ / Address</label>
          <textarea 
            rows={3}
            value={shopInfo.address}
            onChange={(e) => setShopInfo({...shopInfo, address: e.target.value})}
            className="w-full bg-[#FDFBF7] border-2 border-[#2D241E]/10 rounded-[2.5rem] py-7 px-10 text-2xl font-bold text-[#2D241E] focus:ring-4 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <label className="block text-lg uppercase tracking-[0.1em] text-[#2D241E]/40 mb-4 ml-6 font-black">เวลาเปิด / Open Time</label>
            <input 
              type="time" 
              value={shopInfo.openTime}
              onChange={(e) => setShopInfo({...shopInfo, openTime: e.target.value})}
              className="w-full bg-[#FDFBF7] border-2 border-[#2D241E]/10 rounded-[2.5rem] py-7 px-10 text-2xl font-bold text-[#2D241E] focus:ring-4 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all outline-none"
            />
          </div>
          <div>
            <label className="block text-lg uppercase tracking-[0.1em] text-[#2D241E]/40 mb-4 ml-6 font-black">เวลาปิด / Close Time</label>
            <input 
              type="time" 
              value={shopInfo.closeTime}
              onChange={(e) => setShopInfo({...shopInfo, closeTime: e.target.value})}
              className="w-full bg-[#FDFBF7] border-2 border-[#2D241E]/10 rounded-[2.5rem] py-7 px-10 text-2xl font-bold text-[#2D241E] focus:ring-4 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all outline-none"
            />
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="w-full py-7 bg-[#D4AF37] text-white rounded-[2.5rem] font-black text-3xl uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-[#D4AF37]/30 mt-6 border-b-4 border-[#b8962d]"
        >
          บันทึกการตั้งค่า / Save Settings
        </button>
      </div>
    </div>
  );
};

export default V4Dashboard;
