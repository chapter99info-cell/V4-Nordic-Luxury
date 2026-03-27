import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Menu, Search, Bell, User, Calendar, Grid, BarChart2, MessageSquare, LogIn, LogOut, Home, PlusCircle, Info, History, LayoutDashboard, Users, Settings, Tag, Zap, ClipboardList } from 'lucide-react';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
  role?: 'owner' | 'admin' | 'staff' | 'client' | null;
  shopConfig?: any;
  onLogout?: () => void;
  onBookNow?: () => void;
  onHome?: () => void;
  hideSidebar?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, user, role: initialRole, shopConfig, onLogout, onBookNow, onHome, hideSidebar = false }) => {
  const [role, setRole] = useState<'owner' | 'admin' | 'staff' | 'client' | null>(initialRole || null);
  const isAdminView = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (initialRole) {
      setRole(initialRole);
      return;
    }
    const fetchRole = async () => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setRole(userDoc.data().role);
        }
      } else {
        setRole(null);
      }
    };
    fetchRole();
  }, [user]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  const handleSignOut = async () => {
    if (onLogout) {
      onLogout();
      return;
    }
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans">
      {/* Sidebar for Admin */}
      {isAdminView && (
        <aside className="hidden md:flex w-72 bg-section border-r border-beige/20 flex-col p-8 space-y-12 shrink-0 print:hidden">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-primary/10 overflow-hidden bg-white shadow-sm shrink-0">
              <img src={shopConfig?.logo} alt={`${shopConfig?.name} Logo`} className="w-full h-full object-cover" />
            </div>
            <h1 className="text-xl font-serif font-bold text-primary tracking-tight leading-tight">
              {shopConfig?.name} <span className="block text-[10px] font-bold text-sage uppercase tracking-[0.2em]">ADMIN</span>
            </h1>
          </div>

          <nav className="flex-1 space-y-2">
            <div className="px-6 py-2">
              <p className="text-[10px] font-bold text-earth/30 uppercase tracking-[0.2em]">Management</p>
            </div>
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'DASHBOARD' },
              { id: 'v4', icon: Grid, label: 'V4 DASHBOARD' },
              { id: 'v4-mock', icon: LayoutDashboard, label: 'V4 MOCK DEMO' },
              { id: 'v4-showcase', icon: Zap, label: 'V4 SHOWCASE' },
              { id: 'calendar', icon: Calendar, label: 'CALENDAR' },
              { id: 'sessions', icon: History, label: 'SESSIONS' },
              ...(role === 'owner' || role === 'admin' ? [
                { id: 'staff', icon: Users, label: 'STAFF' },
                { id: 'services', icon: Settings, label: 'SERVICES' },
                { id: 'promotions', icon: Tag, label: 'PROMOTIONS' },
                { id: 'reports', icon: ClipboardList, label: 'REPORTS' },
                { id: 'statistics', icon: BarChart2, label: 'STATISTICS' }
              ] : []),
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold text-[10px] tracking-widest ${
                  activeTab === item.id 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'text-earth/60 hover:bg-beige/30 hover:text-primary'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="pt-8 border-t border-beige/20">
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-earth/60 hover:bg-red-50 hover:text-red-500 transition-all font-medium text-sm"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 border-b border-beige/20 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-40 print:hidden">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            {!isAdminView ? (
              <div className="flex items-center gap-4 mr-4">
                <div className="w-10 h-10 rounded-full border border-primary/10 overflow-hidden bg-white shadow-sm shrink-0 cursor-pointer" onClick={onHome}>
                  <img src={shopConfig?.logo} alt={`${shopConfig?.name} Logo`} className="w-full h-full object-cover" />
                </div>
                <h1 className="text-lg font-serif font-bold text-primary tracking-tight leading-tight cursor-pointer" onClick={onHome}>
                  {shopConfig?.name}
                </h1>
              </div>
            ) : (
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-earth/30" size={18} />
                <input 
                  type="text" 
                  placeholder="Search bookings, clients..." 
                  className="w-full bg-section border-none rounded-full py-2.5 pl-12 pr-6 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user && isAdminView ? (
              <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end">
                  <p className="text-sm font-bold text-primary">{user.displayName || 'User'}</p>
                  <p className="text-[10px] text-earth/40 font-medium">{user.email}</p>
                  <p className="text-[8px] text-sage font-bold uppercase tracking-widest">{role || 'Client'}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden border border-beige/20">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    user.displayName?.substring(0, 2).toUpperCase() || 'U'
                  )}
                </div>
              </div>
            ) : !isAdminView && (
              <div className="flex items-center gap-4">
                {user ? (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden border border-beige/20">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                      ) : (
                        user.displayName?.substring(0, 2).toUpperCase() || 'U'
                      )}
                    </div>
                    <button onClick={handleSignOut} className="text-xs font-bold text-earth/40 hover:text-red-500 uppercase tracking-widest">Sign Out</button>
                  </div>
                ) : (
                  <button 
                    onClick={handleSignIn}
                    className="bg-primary text-white px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-sage transition-all shadow-lg shadow-primary/20"
                  >
                    Sign In
                  </button>
                )}
              </div>
            )}
            {isAdminView && (
              <button className="p-2 rounded-full hover:bg-beige/30 text-earth/60 transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
            )}
            {!isAdminView && location.pathname !== '/' && (
              <button 
                onClick={onHome}
                className="hidden md:block text-primary font-bold uppercase tracking-widest text-[10px] hover:underline underline-offset-8"
              >
                Back to Home
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 max-w-7xl mx-auto w-full pb-24 md:pb-6 print:p-0 print:max-w-none">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
};
