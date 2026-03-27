import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LandingPage } from './components/LandingPage';
import { MyBookings } from './components/MyBookings';
import ChatWidget from './components/ChatWidget';
import { BookingModal } from './components/BookingModal';
import { QuickAddModal } from './components/QuickAddModal';

// ✅ แก้ไขตรงนี้: ลบปีกกาออกเพราะเรา export default มาจากไฟล์ V4Dashboard
import V4Dashboard from './components/V4Dashboard'; 
import { CheckInPage } from './components/CheckInPage';

import { shopConfig } from './config/shopConfig';
import { Service } from './types';
import { AnimatePresence } from 'motion/react';
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
  
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'owner' | 'admin' | 'staff' | 'client' | null>(null);
  const [shopConfigState, setShopConfigState] = useState(shopConfig);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

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

  const handleLogout = () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('isAuthorized');
    localStorage.removeItem('userRole');
    localStorage.removeItem('staffName');
    auth.signOut();
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
              apiService.fixStaffData();
            } else {
              localStorage.removeItem('isAuthorized');
            }
          } else {
            setRole('client');
            localStorage.removeItem('isAuthorized');
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
          <Layout activeTab="my-bookings" setActiveTab={() => {}} user={user} shopConfig={shopConfigState} hideSidebar={true} onLogout={handleLogout} onBookNow={handleBook} onHome={() => navigate('/')}>
            <MyBookings />
          </Layout>
        } />

        <Route path="/admin" element={
          role === 'owner' || role === 'admin' || role === 'staff' || localStorage.getItem('isAdmin') === 'true' ? (
            <V4Dashboard />
          ) : (
            <LoginPage />
          )
        } />

        <Route path="/check-in" element={<CheckInPage />} />

        <Route path="/" element={
          <LandingPage onBookNow={handleBook} onStaffLogin={() => navigate('/login')} config={shopConfigState} />
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