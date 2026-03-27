import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { StaffManagement } from './components/StaffManagement';
import { ServiceManagement } from './components/ServiceManagement';
import { PromoManagement } from './components/PromoManagement';
import { Sessions } from './components/Sessions';
import { Statics } from './components/Statics';
import { DailyReport } from './components/DailyReport';
import AdminCalendar from './components/AdminCalendar';
import { MyBookings } from './components/MyBookings';
import { AboutUs } from './components/AboutUs';
import ChatWidget from './components/ChatWidget';
import { BookingModal } from './components/BookingModal';
import { QuickAddModal } from './components/QuickAddModal';
import { ServiceGallery } from './components/ServiceGallery';

// ✅ แก้ไขตรงนี้: ลบปีกกาออกเพราะเรา export default มาจากไฟล์ V4Dashboard
import V4Dashboard from './components/V4Dashboard'; 

import { V4MockDashboard } from './components/V4MockDashboard';
import { V4CoreFeatureShowcase } from './components/V4CoreFeatureShowcase';
import { shopConfig } from './config/shopConfig';
import { Service } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, LayoutDashboard, Home as HomeIcon, ShieldCheck, Users } from 'lucide-react';
import { db, auth } from './firebase';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginPage } from './pages/admin/LoginPage';
import { Navigation } from './components/Navigation';
import { Toaster } from 'sonner';
import { apiService } from './services/api';
import { syncService } from './services/syncService';

import { useTranslation } from './i18n/I18nContext';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage, t } = useTranslation();
  const [view, setView] = useState<'landing' | 'app'>('landing');
  
  // 🚀 ตั้งค่าให้เปิดมาเจอหน้า V4 ทันทีเพื่อเช็คความหรูหรา (เปลี่ยนกลับเป็น 'dashboard' ได้ภายหลังค่ะ)
  const [activeTab, setActiveTab] = useState('v4'); 
  
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'owner' | 'admin' | 'staff' | 'client' | null>(null);
  const [shopConfigState, setShopConfigState] = useState(shopConfig);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [adminPass, setAdminPass] = useState('');

  // 🚀 Initialize Sync Listeners
  useEffect(() => {
    syncService.initSyncListeners();
  }, []);

  // 🚀 Seed Initial Data (Only for Admin/Owner)
  useEffect(() => {
    const seedData = async () => {
      if (isAuthReady && (role === 'admin' || role === 'owner' || localStorage.getItem('isAdmin') === 'true')) {
        try {
          console.log('🌱 Seeding initial data...');
          await apiService.seedServices();
          await apiService.seedStaff();
          console.log('✅ Seeding complete.');
        } catch (err) {
          console.error('❌ Seeding failed:', err);
        }
      }
    };
    seedData();
  }, [isAuthReady, role]);

  // 🎨 Update CSS Variables when theme changes
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(shopConfigState.themeColors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
  }, [shopConfigState.themeColors]);

  // 🔒 Check for admin session on load
  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (isAdmin) {
      setRole('admin');
      apiService.fixStaffData();
      if (location.pathname === '/login' || location.pathname === '/admin/login') {
        navigate('/admin');
      }
    }
  }, []);

  const handleAdminLogin = () => {
    if (adminPass === 'mira2026') {
      setRole('admin');
      localStorage.setItem('isAdmin', 'true');
      localStorage.setItem('isAuthorized', 'true');
      setView('app');
      setActiveTab('v4'); // ให้เด้งไปหน้า V4 ทันทีที่ Login
      setIsAdminLoginOpen(false);
      setAdminPass('');
    } else {
      alert('รหัสผ่านไม่ถูกต้องค่ะ พี่แสนลองใหม่อีกครั้งนะคะ');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('isAuthorized');
    auth.signOut();
    setView('landing');
    navigate('/');
  };

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setRole(userData.role); 
            if (userData.shopConfig) {
              setShopConfigState(prev => ({ ...prev, ...userData.shopConfig }));
            }
            if (userData.role === 'owner' || userData.role === 'admin' || userData.role === 'staff') {
              localStorage.setItem('isAuthorized', 'true');
              setActiveTab('v4'); // เปลี่ยนมาใช้ V4 เป็นหลัก
              apiService.fixStaffData();
            } else {
              localStorage.removeItem('isAuthorized');
              setActiveTab('my-bookings');
            }
          } else {
            setRole('client');
            localStorage.removeItem('isAuthorized');
            setActiveTab('my-bookings');
          }
        } catch (error) {
          console.error("Error syncing user profile:", error);
        }
      } else {
        setUser(null);
        setRole(null);
        localStorage.removeItem('isAuthorized');
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleBook = (service?: Service) => {
    if (service) {
      setSelectedService(service);
      setIsBookingModalOpen(true);
    } else {
      navigate('/booking');
    }
  };

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="relative min-h-screen">
      {/* Language Switcher */}
      <div className="fixed top-6 right-6 z-[60] flex gap-2 print:hidden">
        <button
          onClick={() => setLanguage('en')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            language === 'en' ? 'bg-earth text-white shadow-lg' : 'bg-white/50 backdrop-blur-md text-earth hover:bg-white'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage('th')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            language === 'th' ? 'bg-earth text-white shadow-lg' : 'bg-white/50 backdrop-blur-md text-earth hover:bg-white'
          }`}
        >
          TH
        </button>
      </div>

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        
        <Route path="/my-bookings" element={
          <Layout activeTab="my-bookings" setActiveTab={setActiveTab} user={user} shopConfig={shopConfigState} hideSidebar={true} onLogout={handleLogout} onBookNow={handleBook} onHome={() => { setView('landing'); navigate('/'); }}>
            <MyBookings />
          </Layout>
        } />

        <Route path="/admin" element={
          role === 'owner' || role === 'admin' || role === 'staff' || localStorage.getItem('isAdmin') === 'true' ? (
            <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={user} role={role} shopConfig={shopConfigState} onLogout={handleLogout} onBookNow={handleBook} onHome={() => { setView('landing'); navigate('/'); }}>
              <AnimatePresence mode="wait">
                {activeTab === 'dashboard' && <AdminDashboard key="dashboard" role={role} config={shopConfigState} onQuickAdd={() => setIsQuickAddOpen(true)} />}
                
                {/* 🌟 หน้า V4 Dashboard สุดหรูของเรา */}
                {activeTab === 'v4' && <V4Dashboard key="v4" user={user} role={role} />}
                
                {activeTab === 'v4-mock' && <V4MockDashboard key="v4-mock" />}
                {activeTab === 'v4-showcase' && <V4CoreFeatureShowcase key="v4-showcase" />}
                {activeTab === 'staff' && (role === 'owner' || role === 'admin') && <StaffManagement key="staff" config={shopConfigState} />}
                {activeTab === 'services' && (role === 'owner' || role === 'admin') && <ServiceManagement key="services" />}
                {activeTab === 'promotions' && (role === 'owner' || role === 'admin') && <PromoManagement key="promotions" />}
                {activeTab === 'sessions' && <Sessions key="sessions" config={shopConfigState} role={role} />}
                {activeTab === 'calendar' && <AdminCalendar key="calendar" config={shopConfigState} onQuickAdd={() => setIsQuickAddOpen(true)} />}
                {activeTab === 'statistics' && (role === 'owner' || role === 'admin') && <Statics key="statistics" />}
                {activeTab === 'reports' && (role === 'owner' || role === 'admin') && <DailyReport key="reports" config={shopConfigState} role={role} />}
              </AnimatePresence>
            </Layout>
          ) : (
            <LoginPage />
          )
        } />

        <Route path="/" element={
          <LandingPage onBookNow={handleBook} setActiveTab={setActiveTab} setView={setView} onStaffLogin={() => navigate('/login')} config={shopConfigState} />
        } />
      </Routes>

      {!isAdminRoute && <div className="print:hidden"><Navigation /></div>}
      <ChatWidget />

      <AnimatePresence>
        {isBookingModalOpen && (
          <BookingModal service={selectedService} user={user} onClose={() => setIsBookingModalOpen(false)} onSuccess={() => { if (location.pathname === '/booking') navigate('/my-bookings'); }} />
        )}
        {isQuickAddOpen && (
          <QuickAddModal shopId={shopConfigState.shopId} onClose={() => setIsQuickAddOpen(false)} onSuccess={() => console.log("Quick add successful")} />
        )}
      </AnimatePresence>
      <Toaster position="top-center" expand={true} richColors />
    </div>
  );
}

import { I18nProvider } from './i18n/I18nContext';

export default function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <AppContent />
      </I18nProvider>
    </ErrorBoundary>
  );
}