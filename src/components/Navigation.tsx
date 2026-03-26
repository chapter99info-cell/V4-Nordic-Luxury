import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, Info, LayoutDashboard } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';

export const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [isAdmin, setIsAdmin] = useState(false);

  // ตรวจสอบสถานะ Login ทุกครั้งที่เปลี่ยนหน้า
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthorized') === 'true';
    setIsAdmin(authStatus);
  }, [location]);

  const navItems = [
    { icon: <Home size={22} />, label: t('common.home') || 'Home', path: '/', isAnchor: false },
    { icon: <Calendar size={22} />, label: t('common.booking') || 'Booking', path: '#services', isAnchor: true },
    { icon: <Info size={22} />, label: t('common.about') || 'About', path: '#about', isAnchor: true },
  ];

  const handleNav = (item: typeof navItems[0]) => {
    if (item.isAnchor) {
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          const el = document.querySelector(item.path);
          el?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        const el = document.querySelector(item.path);
        el?.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(item.path);
    }
  };

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isLoginPage = location.pathname === '/login' || location.pathname === '/admin/login';

  if (isLoginPage) return null;
  if (isAdminRoute) return null;

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl border border-gray-100 px-8 py-4 rounded-[2.5rem] shadow-2xl flex gap-10 z-50 md:hidden">
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => handleNav(item)}
          className={`flex flex-col items-center gap-1 ${location.pathname === item.path ? 'text-primary' : 'text-gray-400'}`}
        >
          {item.icon}
          <span className="text-[9px] font-bold uppercase tracking-widest">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default Navigation;
