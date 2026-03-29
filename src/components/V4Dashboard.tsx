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
import StaffManagement from './StaffManagement';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

    // Fetch Staff from Firestore
    const unsubscribeStaff = onSnapshot(collection(db, 'staff'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff));
      setStaff(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching staff in V4Dashboard:", error);
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
  
  const activeStaffCount = staff.filter(s => s.isActive).length;
  const totalBookingsCount = bookings.length;

  // ฟังก์ชัน Logout
  const handleLogout = () => {
    localStorage.clear();
    navigate('/'); // ใช้ navigate แทน window.location.href เพื่อความเสถียรของ SPA
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2D241E] flex flex-col lg:flex-row font-sans text-[clamp(0.875rem,1.2vw,1.125rem)]">
      {/* --- Mobile Header --- */}
      <div className="lg:hidden bg-[#F5F2ED] border-b-2 border-[#D4AF37]/10 p-4 flex justify-between items-center sticky top-0 z-[100] shadow-md">
        <div className="flex items-center gap-3">
          <h2 className="text-[#D4AF37] font-serif text-xl font-bold italic">Mira Royale</h2>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-[#2D241E] hover:bg-[#D4AF37]/10 rounded-xl transition-colors"
        >
          {isSidebarOpen ? <X size={28} /> : <LayoutDashboard size={28} />}
        </button>
      </div>

      {/* --- Sidebar --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-[150] lg:relative lg:z-0
        w-72 lg:w-80 bg-[#F5F2ED] border-r-2 border-[#D4AF37]/10 p-6 lg:p-8 
        flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="mb-6 lg:mb-10 text-center">
          <h2 className="text-[#D4AF37] font-serif text-xl lg:text-2xl font-bold italic">Mira Royale</h2>
          <p className="text-[8px] lg:text-[10px] text-[#2D241E]/40 tracking-[0.2em] uppercase mt-1 font-bold">Management V5 - Light Mode</p>
        </div>

        <nav className="flex-1 space-y-2 lg:space-y-4 overflow-y-auto no-scrollbar">
          <SidebarItem 
            icon={<LayoutDashboard />} 
            label={<>หน้าแรกค่ะ<br/><span className="text-xs lg:text-sm opacity-70">Overview</span></>} 
            active={activeTab === 'overview'} 
            onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }} 
          />
          <SidebarItem 
            icon={<Calendar />} 
            label={<>รายการจองค่ะ<br/><span className="text-xs lg:text-sm opacity-70">Bookings</span></>} 
            active={activeTab === 'bookings'} 
            onClick={() => { setActiveTab('bookings'); setIsSidebarOpen(false); }} 
          />
          
          {/* เมนูเฉพาะ Owner */}
          {role === 'owner' && (
            <>
              <SidebarItem 
                icon={<PieChart />} 
                label={<>รายได้ค่ะ<br/><span className="text-xs lg:text-sm opacity-70">Analytics</span></>} 
                active={activeTab === 'analytics'} 
                onClick={() => { setActiveTab('analytics'); setIsSidebarOpen(false); }} 
              />
              <SidebarItem 
                icon={<DollarSign />} 
                label={<>รายการราคาค่ะ<br/><span className="text-xs lg:text-sm opacity-70">Service Pricing</span></>} 
                active={activeTab === 'pricing'} 
                onClick={() => { setActiveTab('pricing'); setIsSidebarOpen(false); }} 
              />
              <SidebarItem 
                icon={<Users />} 
                label={<>จัดการพนักงานค่ะ<br/><span className="text-xs lg:text-sm opacity-70">Staff</span></>} 
                active={activeTab === 'staff'} 
                onClick={() => { setActiveTab('staff'); setIsSidebarOpen(false); }} 
              />
              <SidebarItem 
                icon={<Settings />} 
                label={<>ตั้งค่าร้านค่ะ<br/><span className="text-xs lg:text-sm opacity-70">Settings</span></>} 
                active={activeTab === 'settings'} 
                onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }} 
              />
            </>
          )}
        </nav>

        <button 
          onClick={handleLogout}
          className="mt-6 flex items-center gap-3 lg:gap-4 text-rose-600 hover:text-rose-700 transition-all p-4 lg:p-6 bg-rose-50 rounded-[1.5rem] lg:rounded-[2rem] border-2 border-rose-100 shadow-md hover:shadow-lg"
        >
          <LogOut size={24} className="lg:w-8 lg:h-8" /> <span className="text-base lg:text-xl font-bold uppercase tracking-wider">ออกระบบ / Logout</span>
        </button>
      </aside>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[140] lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* --- Main Content --- */}
      <main className="flex-1 p-4 md:p-8 lg:p-16 overflow-y-auto">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 lg:mb-12">
          <div>
            <h1 className="text-[clamp(1.25rem,4vw,3rem)] font-serif font-bold text-[#2D241E] leading-tight">
              สวัสดีค่ะคุณ {role === 'owner' ? 'เจ้าของร้าน' : staffName}
            </h1>
            <p className="text-[#2D241E]/60 text-[clamp(0.875rem,2vw,1.25rem)] mt-1 lg:mt-2 font-bold">ยินดีต้อนรับกลับมาค่ะ / Welcome back.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 lg:gap-4 w-full lg:w-auto">
            <button 
              onClick={() => setIsReceiptModalOpen(true)}
              className="flex-1 lg:flex-none bg-[#22C55E] hover:bg-[#16A34A] text-white px-4 lg:px-8 py-3 lg:py-4 rounded-xl lg:rounded-2xl font-black text-sm lg:text-lg shadow-xl shadow-green-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 lg:gap-3 border-b-2 lg:border-b-4 border-[#15803D]"
            >
              <Receipt size={20} className="lg:w-6 lg:h-6" />
              <span>ออกใบเสร็จค่ะ / Create Receipt</span>
            </button>
            <div className="flex-1 lg:flex-none flex items-center justify-center gap-3 lg:gap-4 bg-white p-3 lg:p-4 rounded-xl lg:rounded-2xl border-2 border-[#D4AF37]/10 px-4 lg:px-6 shadow-xl">
              <div className="w-2 h-2 lg:w-3 lg:h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
              <span className="text-xs lg:text-sm font-bold uppercase tracking-widest text-[#2D241E]/80">ระบบทำงานปกติค่ะ / Online</span>
            </div>
          </div>
        </header>

        {/* ส่วนแสดงสถิติ (Stats Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-10 mb-8 lg:mb-16">
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
        <section className="rounded-[1.5rem] lg:rounded-[3rem] p-6 lg:p-12 bg-white border-2 border-[#D4AF37]/10 text-[#2D241E] shadow-2xl min-h-[400px] lg:min-h-[500px]">
          {activeTab === 'overview' && (
            <OverviewContent 
              bookings={bookings} 
              role={role} 
              isBookingOpen={isBookingOpen} 
              onToggle={toggleBookingStatus}
              onAlert={sendStaffAlert}
            />
          )}
          {activeTab === 'staff' && role === 'owner' && <StaffManagement />}
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
            className="fixed top-10 lg:top-20 left-1/2 -translate-x-1/2 z-[2000] w-[90%] max-w-2xl"
          >
            <div className="bg-[#D4AF37] text-white p-6 lg:p-10 rounded-[2rem] lg:rounded-[3rem] shadow-[0_20px_40px_-10px_rgba(212,175,55,0.4)] flex flex-col items-center text-center gap-4 lg:gap-6 border-4 lg:border-8 border-white">
              <div className="w-16 h-16 lg:w-24 lg:h-24 bg-white text-[#D4AF37] rounded-full flex items-center justify-center animate-bounce shadow-2xl">
                <Users size={32} className="lg:w-12 lg:h-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl lg:text-4xl font-black uppercase tracking-widest">ลูกค้ามาถึงแล้วค่ะ!</h3>
                <p className="text-lg lg:text-2xl font-bold opacity-90">Customer Arrived at Counter</p>
                
                {latestCheckIn?.serviceName && (
                  <div className="mt-4 p-4 lg:p-6 bg-white/20 rounded-xl lg:rounded-[2rem] border-2 lg:border-4 border-white/30">
                    <p className="text-sm lg:text-lg font-bold opacity-80 mb-1">บริการที่เลือก / Selected Service:</p>
                    <p className="text-2xl lg:text-4xl font-black text-white drop-shadow-lg">
                      {latestCheckIn.serviceName}
                    </p>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => setShowCheckInAlert(false)}
                className="mt-2 px-8 py-3 lg:py-4 bg-white text-[#D4AF37] rounded-xl lg:rounded-2xl text-lg lg:text-xl font-black uppercase tracking-widest hover:bg-gray-100 transition-all shadow-xl active:scale-95"
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
    className={`w-full flex items-center gap-3 lg:gap-4 p-3 lg:p-4 rounded-xl lg:rounded-2xl transition-all ${
      active 
        ? 'bg-[#D4AF37] text-white shadow-xl shadow-[#D4AF37]/30 scale-105' 
        : 'text-[#2D241E]/40 hover:bg-[#D4AF37]/10 hover:text-[#2D241E]'
    }`}
  >
    <div className="w-5 h-5 lg:w-6 lg:h-6 flex items-center justify-center">
      {React.cloneElement(icon, { size: '100%' })}
    </div>
    <span className="text-sm lg:text-base font-bold uppercase tracking-wider text-left leading-tight">{label}</span>
  </button>
);

// Component ย่อย: บัตรสถิติ
const StatCard = ({ title, value, icon, isCurrency }: any) => (
  <div className="bg-white border-2 border-[#D4AF37]/10 p-3 lg:p-5 rounded-xl lg:rounded-[1.5rem] flex items-center justify-between shadow-md hover:shadow-xl transition-all">
    <div className="flex-1">
      <p className="text-[#D4AF37] text-[7px] lg:text-[9px] uppercase tracking-[0.2em] mb-0.5 lg:mb-1 font-black">{title}</p>
      {isCurrency ? (
        <div className="flex items-baseline gap-1">
          <span className="text-sm lg:text-lg font-black text-[#D4AF37]">$</span>
          <p className="text-xl lg:text-3xl font-black text-[#2D241E]">{value}</p>
          <span className="text-[8px] lg:text-xs font-black text-[#2D241E]/40 ml-1">AUD</span>
        </div>
      ) : (
        <p className="text-xl lg:text-3xl font-black text-[#2D241E]">{value}</p>
      )}
    </div>
    <div className="p-2 lg:p-3 bg-[#FDFBF7] rounded-lg lg:rounded-xl border border-[#D4AF37]/10 shadow-inner ml-2">
      {React.cloneElement(icon, { size: 18, className: "lg:w-6 lg:h-6" })}
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
          className="relative w-full max-w-md bg-white border-2 border-[#D4AF37]/20 rounded-[2rem] lg:rounded-[3rem] p-6 lg:p-10 text-center shadow-2xl"
        >
          <div className="w-16 h-16 lg:w-20 lg:h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6 text-rose-500 border-2 border-rose-500/20">
            <AlertCircle size={32} className="lg:w-10 lg:h-10" />
          </div>
          <h2 className="text-xl lg:text-2xl font-bold text-[#2D241E] mb-3 lg:mb-4">{title}</h2>
          <p className="text-base lg:text-lg text-[#2D241E]/60 mb-6 lg:mb-8 leading-relaxed font-bold">{message}</p>
          <div className="flex gap-4 lg:gap-6">
            <button 
              onClick={onClose}
              className="flex-1 py-3 lg:py-4 bg-gray-100 rounded-xl lg:rounded-2xl font-bold text-sm lg:text-lg text-[#2D241E]/40 hover:bg-gray-200 transition-all border-2 border-gray-200"
            >
              ยกเลิกค่ะ / Cancel
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 py-3 lg:py-4 bg-rose-600 text-white rounded-xl lg:rounded-2xl font-bold text-sm lg:text-lg hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/30"
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
  <div className="space-y-6 lg:space-y-10">
    {/* Emergency Toggle Section */}
    <div className="bg-white rounded-xl lg:rounded-[2rem] p-3 lg:p-6 border-2 border-[#D4AF37]/20 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full -mr-16 -mt-16 blur-3xl" />
      
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-8">
        <div className="flex-1 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-1.5 lg:gap-3 mb-1 lg:mb-2">
            <div className={`w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full animate-ping ${isBookingOpen ? 'bg-green-500' : 'bg-rose-500'}`} />
            <h3 className="text-sm lg:text-lg font-black uppercase tracking-widest text-[#2D241E]">
              สถานะการรับจอง / Booking Status
            </h3>
          </div>
          <p className={`text-xl lg:text-3xl font-black mb-2 lg:mb-4 ${isBookingOpen ? 'text-green-500' : 'text-rose-500'}`}>
            {isBookingOpen ? 'เปิดรับจองตามปกติค่ะ' : 'หยุดรับจองชั่วคราวค่ะ'}
            <br/>
            <span className="text-xs lg:text-lg opacity-80">
              {isBookingOpen ? 'Open for Bookings' : 'Stop Bookings'}
            </span>
          </p>
          <div className="bg-[#FDFBF7] p-2 lg:p-3 rounded-lg lg:rounded-xl border border-[#2D241E]/10 inline-block">
            <p className="text-[10px] lg:text-sm text-[#2D241E]/60 font-bold">
              💡 {role === 'owner' 
                ? 'ใช้สำหรับหยุดรับลูกค้าใหม่เมื่อพนักงานไม่พอค่ะ' 
                : 'หากพนักงานไม่พอ กรุณาแจ้งเจ้าของร้านหรือกดปุ่มแจ้งเตือนค่ะ'}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 lg:gap-4 w-full lg:w-auto">
          {role === 'owner' ? (
            <button 
              onClick={onToggle}
              className={`group relative w-32 lg:w-44 h-16 lg:h-22 rounded-full transition-all duration-500 shadow-2xl ${
                isBookingOpen ? 'bg-green-600 shadow-green-600/20' : 'bg-rose-600 shadow-rose-600/20'
              }`}
            >
              <div className={`absolute top-1 w-14 lg:w-20 h-14 lg:h-20 bg-white rounded-full transition-all duration-500 shadow-lg flex items-center justify-center ${
                isBookingOpen ? 'left-17 lg:left-23' : 'left-1'
              }`}>
                {isBookingOpen ? (
                  <Check size={20} className="text-green-600 lg:w-7 lg:h-7" />
                ) : (
                  <X size={20} className="text-rose-600 lg:w-7 lg:h-7" />
                )}
              </div>
              <span className={`absolute inset-0 flex items-center justify-center text-[10px] lg:text-base font-black uppercase tracking-widest pointer-events-none ${
                isBookingOpen ? 'pr-16 lg:pr-22 text-white/40' : 'pl-16 lg:pl-22 text-white/40'
              }`}>
                {isBookingOpen ? 'OPEN' : 'STOP'}
              </span>
            </button>
          ) : (
            <button 
              onClick={onAlert}
              className="w-full lg:w-auto px-4 lg:px-6 py-3 lg:py-4 bg-rose-600 text-white rounded-lg lg:rounded-xl font-black text-sm lg:text-lg uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-rose-600/30 flex items-center justify-center gap-2 lg:gap-3 border-b-2 lg:border-b-4 border-rose-800"
            >
              <Bell size={20} className="animate-bounce lg:w-6 lg:h-6" />
              <span className="text-left">แจ้งพนักงานไม่พอค่ะ<br/><span className="text-[10px] lg:text-xs opacity-70">Staff Shortage Alert</span></span>
            </button>
          )}
        </div>
      </div>
    </div>

    <div className="bg-white rounded-xl p-4 lg:p-6 border border-[#2D241E]/10 shadow-2xl">
      <h3 className="text-lg lg:text-xl font-bold mb-4 lg:mb-6 flex items-center gap-2 text-[#2D241E]">
        <Clock size={20} className="text-[#D4AF37] lg:w-6 lg:h-6" /> กิจกรรมล่าสุดค่ะ / Recent Activities
      </h3>
      <div className="space-y-4">
        {bookings.slice(0, 5).map((booking: Booking) => (
          <div key={booking.id} className="flex items-center justify-between p-3 lg:p-4 bg-[#FDFBF7] rounded-xl border border-[#D4AF37]/10 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 lg:gap-4">
              <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center shadow-inner ${
                booking.status === 'confirmed' ? 'bg-green-100 text-green-600' : 
                booking.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'
              }`}>
                <UserIcon size={20} className="lg:w-6 lg:h-6" />
              </div>
              <div>
                <p className="text-sm lg:text-base font-black text-[#2D241E] leading-tight">{booking.clientName}</p>
                <p className="text-[10px] lg:text-xs text-[#2D241E]/60 font-bold uppercase tracking-widest">{booking.serviceName}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs lg:text-sm font-black text-[#D4AF37]">${booking.price || 0}</p>
              <p className="text-[8px] lg:text-[10px] text-[#2D241E]/40 font-bold uppercase">{booking.startTime}</p>
            </div>
          </div>
        ))}
        {bookings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 lg:py-10 border-2 border-dashed border-[#2D241E]/5 rounded-lg lg:rounded-xl">
            <p className="text-[#2D241E]/40 text-center text-sm lg:text-lg font-bold tracking-wider">
              ไม่มีกิจกรรมล่าสุดค่ะ / No recent activities
            </p>
          </div>
        )}
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
      className="space-y-8 lg:space-y-12"
    >
      {/* Header & Filter */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
        <div>
          <h2 className="text-xl lg:text-3xl font-serif font-bold text-[#2D241E]">รายได้และสถิติ / Revenue & Analytics</h2>
          <p className="text-[#2D241E]/60 text-sm lg:text-base font-bold mt-0.5 lg:mt-1">ติดตามผลประกอบการของร้านคุณ / Track your business growth.</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-lg lg:rounded-xl border-2 border-[#D4AF37]/10 shadow-inner w-full lg:w-auto overflow-x-auto no-scrollbar">
          {(['today', '7days', 'month'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 lg:flex-none px-3 lg:px-5 py-1.5 lg:py-2.5 rounded-md lg:rounded-lg text-[10px] lg:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filter === f ? 'bg-[#D4AF37] text-white shadow-lg' : 'text-[#2D241E]/40 hover:text-[#2D241E]'
              }`}
            >
              {f === 'today' ? 'วันนี้ / Today' : f === '7days' ? '7 วัน / 7 Days' : 'เดือนนี้ / Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8">
        <div className="bg-white border-2 border-[#D4AF37]/10 p-4 lg:p-6 rounded-xl lg:rounded-[2rem] shadow-xl hover:shadow-[#D4AF37]/5 transition-all">
          <div className="flex justify-between items-start mb-3 lg:mb-4">
            <div className="p-2 lg:p-3 bg-green-500/10 rounded-lg lg:rounded-xl text-green-500 border border-green-500/20">
              <DollarSign size={20} className="lg:w-6 lg:h-6" />
            </div>
            <span className="flex items-center gap-1 text-[8px] lg:text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full uppercase border border-green-500/20">
              <ArrowUpRight size={12} /> 12%
            </span>
          </div>
          <p className="text-[#2D241E]/40 text-[8px] lg:text-[10px] uppercase tracking-[0.2em] mb-1 font-black">รายได้วันนี้ / Daily Earnings</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base lg:text-xl font-black text-[#D4AF37]">$</span>
            <p className="text-2xl lg:text-4xl font-black text-[#2D241E]">{dailyRevenue.toLocaleString()}</p>
            <span className="text-xs lg:text-base font-black text-[#2D241E]/40 ml-1">AUD</span>
          </div>
        </div>

        <div className="bg-white border-2 border-[#D4AF37]/10 p-4 lg:p-6 rounded-xl lg:rounded-[2rem] shadow-xl hover:shadow-[#D4AF37]/5 transition-all">
          <div className="flex justify-between items-start mb-3 lg:mb-4">
            <div className="p-2 lg:p-3 bg-amber-500/10 rounded-lg lg:rounded-xl text-amber-500 border border-amber-500/20">
              <TrendingUp size={20} className="lg:w-6 lg:h-6" />
            </div>
            <span className="flex items-center gap-1 text-[8px] lg:text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full uppercase border border-green-500/20">
              <ArrowUpRight size={12} /> 8%
            </span>
          </div>
          <p className="text-[#2D241E]/40 text-[8px] lg:text-[10px] uppercase tracking-[0.2em] mb-1 font-black">รายได้เดือนนี้ / Monthly Earnings</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base lg:text-xl font-black text-[#D4AF37]">$</span>
            <p className="text-2xl lg:text-4xl font-black text-[#2D241E]">{monthlyRevenue.toLocaleString()}</p>
            <span className="text-xs lg:text-base font-black text-[#2D241E]/40 ml-1">AUD</span>
          </div>
        </div>

        <div className="bg-white border-2 border-[#D4AF37]/10 p-4 lg:p-6 rounded-xl lg:rounded-[2rem] shadow-xl hover:shadow-[#D4AF37]/5 transition-all">
          <div className="flex justify-between items-start mb-3 lg:mb-4">
            <div className="p-2 lg:p-3 bg-blue-500/10 rounded-lg lg:rounded-xl text-blue-500 border border-blue-500/20">
              <CheckCircle2 size={20} className="lg:w-6 lg:h-6" />
            </div>
          </div>
          <p className="text-[#2D241E]/40 text-[8px] lg:text-[10px] uppercase tracking-[0.2em] mb-1 font-black">การจองที่สำเร็จ / Total Paid</p>
          <p className="text-2xl lg:text-4xl font-black text-[#2D241E]">{totalPaidBookings}</p>
        </div>
      </div>

      <div className="bg-white border-2 border-[#D4AF37]/10 p-4 lg:p-6 rounded-xl lg:rounded-[2rem] shadow-xl">
        <h3 className="text-base lg:text-lg font-bold text-[#2D241E] mb-4 lg:mb-6 flex items-center gap-2">
          <TrendingUp size={18} className="text-[#D4AF37] lg:w-5 lg:h-5" /> แนวโน้มรายได้ (7 วันล่าสุด) / Revenue Trend (Last 7 Days)
        </h3>
        <div className="h-[200px] lg:h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#2D241E', fontSize: 10, fontWeight: 'bold' }} 
                dy={5}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#2D241E', fontSize: 10, fontWeight: 'bold' }} 
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                cursor={{ fill: '#FDFBF7' }}
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #D4AF37', 
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  padding: '8px',
                  fontSize: '10px',
                  color: '#2D241E'
                }}
                itemStyle={{ color: '#2D241E' }}
              />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]} barSize={30}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 6 ? '#10b981' : '#D4AF37'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border-2 border-[#D4AF37]/10 rounded-xl lg:rounded-[2rem] overflow-hidden shadow-xl">
        <div className="p-4 lg:p-6 border-b-2 border-[#2D241E]/5 flex justify-between items-center bg-[#FDFBF7]">
          <h3 className="text-base lg:text-lg font-bold text-[#2D241E]">รายการธุรกรรมล่าสุด / Recent Transactions</h3>
          <button className="text-[#D4AF37] text-[10px] lg:text-xs font-black uppercase tracking-widest hover:underline">ดูทั้งหมด / View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#FDFBF7]">
                <th className="px-4 lg:px-6 py-3 text-[8px] lg:text-[10px] uppercase tracking-widest text-[#2D241E]/40 font-black">ลูกค้า / Customer</th>
                <th className="px-4 lg:px-6 py-3 text-[8px] lg:text-[10px] uppercase tracking-widest text-[#2D241E]/40 font-black">บริการ / Service</th>
                <th className="px-4 lg:px-6 py-3 text-[8px] lg:text-[10px] uppercase tracking-widest text-[#2D241E]/40 font-black">จำนวนเงิน / Amount</th>
                <th className="px-4 lg:px-6 py-3 text-[8px] lg:text-[10px] uppercase tracking-widest text-[#2D241E]/40 font-black">เวลา / Time</th>
                <th className="px-4 lg:px-6 py-3 text-[8px] lg:text-[10px] uppercase tracking-widest text-[#2D241E]/40 font-black">สถานะ / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#2D241E]/5">
              {bookings.slice(0, 5).map((booking) => (
                <tr key={booking.id} className="hover:bg-[#FDFBF7] transition-colors">
                  <td className="px-4 lg:px-6 py-3 lg:py-4">
                    <div className="flex items-center gap-2 lg:gap-3">
                      <div className="w-7 h-7 lg:w-9 lg:h-9 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] font-black text-xs lg:text-sm border border-[#D4AF37]/20">
                        {booking.clientName?.charAt(0)}
                      </div>
                      <span className="text-xs lg:text-sm font-bold text-[#2D241E]">{booking.clientName}</span>
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-[#2D241E]/70 font-medium">{booking.serviceName}</td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4 text-sm lg:text-xl font-black text-[#2D241E]">${(booking.price || booking.subtotal || 0).toLocaleString()} <span className="text-[10px] lg:text-xs opacity-50">AUD</span></td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4 text-[10px] lg:text-xs text-[#2D241E]/50 font-bold">{booking.date} {booking.startTime}</td>
                  <td className="px-4 lg:px-6 py-3 lg:py-4">
                    <span className={`px-2 lg:px-3 py-0.5 rounded-full text-[8px] lg:text-[10px] font-black uppercase shadow-sm border ${
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

// Component ย่อย: เนื้อหาหน้า Bookings Management
const BookingsContent = ({ bookings, isBookingOpen, onToggle, role, onAlert }: { bookings: Booking[], isBookingOpen: boolean, onToggle: () => void, role: string | null, onAlert: () => void }) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [bookingToUpdate, setBookingToUpdate] = useState<{id: string, status: string} | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredBookings = statusFilter === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === statusFilter);

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
      <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 border-2 border-[#D4AF37]/20 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full -mr-16 -mt-16 blur-2xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1 md:mb-2">
              <div className={`w-2 h-2 rounded-full animate-ping ${isBookingOpen ? 'bg-green-500' : 'bg-rose-500'}`} />
              <h3 className="text-sm md:text-base font-black uppercase tracking-widest text-[#D4AF37]">
                สถานะการรับจอง / BOOKING STATUS
              </h3>
            </div>
            <p className={`text-xl md:text-3xl font-black mb-2 md:mb-4 ${isBookingOpen ? 'text-green-500' : 'text-rose-500'} leading-tight`}>
              {isBookingOpen ? 'เปิดรับจองตามปกติค่ะ' : 'หยุดรับจองชั่วคราวค่ะ'}
              <br/>
              <span className="text-sm md:text-lg opacity-80">
                {isBookingOpen ? 'Open for Bookings' : 'Stop Bookings'}
              </span>
            </p>
            <div className="bg-[#FDFBF7] p-2 md:p-3 rounded-lg md:rounded-xl border border-[#2D241E]/10 inline-block">
              <p className="text-[10px] md:text-xs text-[#2D241E]/60 font-bold">
                💡 {role === 'owner' 
                  ? 'ใช้สำหรับหยุดรับลูกค้าใหม่เมื่อพนักงานไม่พอค่ะ' 
                  : 'หากพนักงานไม่พอ กรุณาแจ้งเจ้าของร้านหรือกดปุ่มแจ้งเตือนค่ะ'}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 md:gap-4">
            {role === 'owner' ? (
              <button 
                onClick={onToggle}
                className={`group relative w-36 md:w-44 h-16 md:h-20 rounded-full transition-all duration-500 shadow-2xl ${
                  isBookingOpen ? 'bg-green-600 shadow-green-600/20' : 'bg-rose-600 shadow-rose-600/20'
                }`}
              >
                <div className={`absolute top-1 w-14 md:w-18 h-14 md:h-18 bg-white rounded-full transition-all duration-500 shadow-lg flex items-center justify-center ${
                  isBookingOpen ? 'translate-x-19 md:translate-x-25' : 'translate-x-1'
                }`}>
                  {isBookingOpen ? (
                    <Check size={24} className="text-green-600 md:w-8 md:h-8" />
                  ) : (
                    <X size={24} className="text-rose-600 md:w-8 md:h-8" />
                  )}
                </div>
                <span className={`absolute inset-0 flex items-center justify-center text-xs md:text-sm font-black uppercase tracking-widest pointer-events-none ${
                  isBookingOpen ? 'pr-16 md:pr-20 text-white/40' : 'pl-16 md:pl-20 text-white/40'
                }`}>
                  {isBookingOpen ? 'OPEN' : 'STOP'}
                </span>
              </button>
            ) : (
              <button 
                onClick={onAlert}
                className="group relative w-36 md:w-44 h-16 md:h-20 rounded-full bg-rose-500 shadow-2xl shadow-rose-500/20 hover:scale-105 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 border-b-2 md:border-b-4 border-rose-700"
              >
                <Bell size={24} className="text-white animate-bounce md:w-8 md:h-8" />
                <span className="text-[10px] md:text-xs font-black text-white uppercase tracking-tighter">แจ้งพนักงานไม่พอค่ะ</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg md:text-xl font-bold flex items-center gap-2 text-[#2D241E]">
            <Calendar size={20} className="text-[#D4AF37] md:w-6 md:h-6" /> รายการจองทั้งหมด / All Bookings
          </h3>
          <p className="text-[#2D241E]/70 text-xs md:text-sm mt-0.5 font-medium">จัดการคิวและสถานะการจอง / Manage queues and statuses</p>
        </div>
        <div className="flex gap-2 bg-white p-1 rounded-xl border border-[#D4AF37]/20 shadow-sm w-full md:w-auto overflow-x-auto no-scrollbar">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                statusFilter === s ? 'bg-[#D4AF37] text-white shadow-md' : 'text-[#2D241E]/40 hover:text-[#2D241E]'
              }`}
            >
              {s === 'all' ? 'ทั้งหมด / All' : s === 'pending' ? 'รอ / Pending' : s === 'confirmed' ? 'ยืนยัน / Confirmed' : s === 'completed' ? 'เสร็จ / Done' : 'ยกเลิก / Cancel'}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto bg-white border-2 border-[#2D241E]/5 rounded-xl md:rounded-2xl shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-[#2D241E]/5 bg-[#FDFBF7]">
              <th className="px-3 md:px-4 py-2 md:py-3 text-[10px] md:text-xs uppercase tracking-widest text-[#2D241E]/60 font-black">ลูกค้า / Customer</th>
              <th className="px-3 md:px-4 py-2 md:py-3 text-[10px] md:text-xs uppercase tracking-widest text-[#2D241E]/60 font-black">บริการ / Service</th>
              <th className="px-3 md:px-4 py-2 md:py-3 text-[10px] md:text-xs uppercase tracking-widest text-[#2D241E]/60 font-black">วัน-เวลา / Date-Time</th>
              <th className="px-3 md:px-4 py-2 md:py-3 text-[10px] md:text-xs uppercase tracking-widest text-[#2D241E]/60 font-black">สถานะ / Status</th>
              <th className="px-3 md:px-4 py-2 md:py-3 text-[10px] md:text-xs uppercase tracking-widest text-[#2D241E]/60 font-black text-center">จัดการ / Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2D241E]/5">
            {filteredBookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-[#FDFBF7] transition-colors">
                <td className="px-3 md:px-4 py-2 md:py-3">
                  <p className="text-xs md:text-sm font-bold text-[#2D241E]">{booking.clientName}</p>
                  <p className="text-[10px] md:text-xs text-[#2D241E]/40 font-medium">{booking.clientPhone}</p>
                </td>
                <td className="px-3 md:px-4 py-2 md:py-3">
                  <p className="text-xs md:text-sm font-bold text-[#2D241E]">{booking.serviceName}</p>
                  <p className="text-sm md:text-base text-[#D4AF37] font-black">${(booking.price || booking.subtotal || 0).toLocaleString()} <span className="text-[8px] md:text-[10px] opacity-50">AUD</span></p>
                </td>
                <td className="px-3 md:px-4 py-2 md:py-3">
                  <p className="text-xs md:text-sm font-bold text-[#2D241E]">{booking.date}</p>
                  <p className="text-[10px] md:text-xs text-[#2D241E]/40 font-medium">{booking.startTime}</p>
                </td>
                <td className="px-3 md:px-4 py-2 md:py-3">
                  <span className={`px-2 md:px-3 py-0.5 rounded-full text-[8px] md:text-[10px] font-black uppercase border-2 ${
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
                <td className="px-3 md:px-4 py-2 md:py-3">
                  <div className="flex gap-1 md:gap-2 justify-center">
                    {booking.status === 'pending' && (
                      <button 
                        onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                        className="p-1.5 md:p-2 bg-blue-600 text-white rounded-md md:rounded-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/30"
                        title="ยืนยัน / Confirm"
                      >
                        <Check size={14} className="md:w-4 md:h-4" />
                      </button>
                    )}
                    {(booking.status === 'confirmed' || booking.status === 'pending') && (
                      <button 
                        onClick={() => handleStatusUpdate(booking.id, 'completed')}
                        className="p-1.5 md:p-2 bg-green-600 text-white rounded-md md:rounded-lg hover:bg-green-500 transition-all shadow-lg shadow-green-600/30"
                        title="เสร็จสิ้น / Complete"
                      >
                        <CheckCircle2 size={14} className="md:w-4 md:h-4" />
                      </button>
                    )}
                    {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                      <button 
                        onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                        className="p-1.5 md:p-2 bg-rose-600 text-white rounded-md md:rounded-lg hover:bg-rose-500 transition-all shadow-lg shadow-rose-600/30"
                        title="ยกเลิก / Cancel"
                      >
                        <X size={14} className="md:w-4 md:h-4" />
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
    <div className="max-w-2xl">
      <div className="mb-4 md:mb-6">
        <h3 className="text-lg md:text-xl font-bold flex items-center gap-2 text-[#2D241E]">
          <Settings size={20} className="text-[#D4AF37] md:w-6 md:h-6" /> ตั้งค่าร้าน / Shop Settings
        </h3>
        <p className="text-[#2D241E]/70 text-xs md:text-sm mt-0.5 font-medium">ปรับแต่งข้อมูลพื้นฐานของร้านคุณ / Customize your shop details</p>
      </div>

      <div className="space-y-4 md:space-y-6 bg-white border-2 border-[#2D241E]/5 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label className="block text-[10px] md:text-xs uppercase tracking-[0.1em] text-[#2D241E]/40 mb-1 ml-3 md:ml-4 font-black">ชื่อร้าน / Shop Name</label>
            <input 
              type="text" 
              value={shopInfo.name}
              onChange={(e) => setShopInfo({...shopInfo, name: e.target.value})}
              className="w-full bg-[#FDFBF7] border-2 border-[#2D241E]/10 rounded-lg md:rounded-xl py-2 md:py-3 px-3 md:px-4 text-sm md:text-base font-bold text-[#2D241E] focus:ring-4 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] md:text-xs uppercase tracking-[0.1em] text-[#2D241E]/40 mb-1 ml-3 md:ml-4 font-black">เบอร์โทรศัพท์ / Phone Number</label>
            <input 
              type="text" 
              value={shopInfo.phone}
              onChange={(e) => setShopInfo({...shopInfo, phone: e.target.value})}
              className="w-full bg-[#FDFBF7] border-2 border-[#2D241E]/10 rounded-lg md:rounded-xl py-2 md:py-3 px-3 md:px-4 text-sm md:text-base font-bold text-[#2D241E] focus:ring-4 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] md:text-xs uppercase tracking-[0.1em] text-[#2D241E]/40 mb-1 ml-3 md:ml-4 font-black">ที่อยู่ / Address</label>
          <textarea 
            rows={2}
            value={shopInfo.address}
            onChange={(e) => setShopInfo({...shopInfo, address: e.target.value})}
            className="w-full bg-[#FDFBF7] border-2 border-[#2D241E]/10 rounded-lg md:rounded-xl py-2 md:py-3 px-3 md:px-4 text-sm md:text-base font-bold text-[#2D241E] focus:ring-4 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label className="block text-[10px] md:text-xs uppercase tracking-[0.1em] text-[#2D241E]/40 mb-1 ml-3 md:ml-4 font-black">เวลาเปิด / Open Time</label>
            <input 
              type="time" 
              value={shopInfo.openTime}
              onChange={(e) => setShopInfo({...shopInfo, openTime: e.target.value})}
              className="w-full bg-[#FDFBF7] border-2 border-[#2D241E]/10 rounded-lg md:rounded-xl py-2 md:py-3 px-3 md:px-4 text-sm md:text-base font-bold text-[#2D241E] focus:ring-4 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] md:text-xs uppercase tracking-[0.1em] text-[#2D241E]/40 mb-1 ml-3 md:ml-4 font-black">เวลาปิด / Close Time</label>
            <input 
              type="time" 
              value={shopInfo.closeTime}
              onChange={(e) => setShopInfo({...shopInfo, closeTime: e.target.value})}
              className="w-full bg-[#FDFBF7] border-2 border-[#2D241E]/10 rounded-lg md:rounded-xl py-2 md:py-3 px-3 md:px-4 text-sm md:text-base font-bold text-[#2D241E] focus:ring-4 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] transition-all outline-none"
            />
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="w-full py-3 md:py-4 bg-[#D4AF37] text-white rounded-lg md:rounded-xl font-black text-sm md:text-base uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-[#D4AF37]/30 mt-2 border-b-2 border-[#b8962d]"
        >
          บันทึกการตั้งค่า / Save Settings
        </button>
      </div>
    </div>
  );
};

export default V4Dashboard;
