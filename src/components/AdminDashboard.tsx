import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PlusCircle, Users, Calendar, DollarSign, 
  Search, ChevronRight, Clock, User, 
  Percent, RefreshCw,
  CheckCircle2, AlertTriangle, X as LucideX,
  TrendingUp, UserCheck, Activity, Printer
} from 'lucide-react';
import { 
  collection, query, onSnapshot, where, doc, updateDoc, 
  orderBy, setDoc, Timestamp
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { Booking, Staff, PromoSettings } from '../types';
import { format } from 'date-fns';
import { useTranslation } from '../i18n/I18nContext';
import { formatCurrency } from '../lib/formatters';

interface AdminDashboardProps {
  role?: 'owner' | 'admin' | 'staff' | 'client' | null;
  config?: any;
  onQuickAdd?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ role: initialRole, config, onQuickAdd }) => {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [promoSettings, setPromoSettings] = useState<PromoSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [actionFeedback, setActionFeedback] = useState<{status: 'success'|'error', msg: string} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isOwnerOrAdmin = initialRole === 'owner' || initialRole === 'admin';

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Bookings for Today
  useEffect(() => {
    if (!auth.currentUser) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const path = 'bookings';
    const q = query(
      collection(db, path),
      where('shopId', '==', config?.shopId || 'SHOP01'),
      where('date', '==', today),
      orderBy('startTime', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(docs);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      handleFirestoreError(error, OperationType.LIST, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [config?.shopId]);

  // Fetch Staff from LocalStorage
  useEffect(() => {
    const loadStaff = () => {
      try {
        const savedData = localStorage.getItem('mira_staff_data');
        if (savedData) {
          const staffData = JSON.parse(savedData);
          const mappedStaff = staffData.map((s: any) => ({
            ...s,
            name: s.nameEn || s.name,
            avatar: s.photo || s.avatar,
            role: s.position || s.role,
            isActive: s.isActive !== undefined ? s.isActive : true
          }));
          setStaffList(mappedStaff);
        } else {
          setStaffList([]);
        }
      } catch (error) {
        console.error("Error loading staff in AdminDashboard:", error);
        setStaffList([]);
      }
    };

    loadStaff();
    // Listen for storage changes in case other tabs update it
    window.addEventListener('storage', loadStaff);
    return () => window.removeEventListener('storage', loadStaff);
  }, []);

  // Fetch Promo Settings
  useEffect(() => {
    if (!auth.currentUser) return;
    const promoRef = doc(db, 'shop_settings', 'promo');
    const unsubscribe = onSnapshot(promoRef, (docSnap) => {
      if (docSnap.exists()) {
        setPromoSettings(docSnap.data() as PromoSettings);
      } else {
        // Initialize if not exists
        const initialPromo: PromoSettings = { isEnabled: false, discountPercentage: 10, updatedAt: Timestamp.now() };
        setDoc(promoRef, initialPromo);
        setPromoSettings(initialPromo);
      }
    });
    return () => unsubscribe();
  }, []);

  const togglePromo = async () => {
    if (!promoSettings) return;
    try {
      const promoRef = doc(db, 'shop_settings', 'promo');
      await updateDoc(promoRef, { 
        isEnabled: !promoSettings.isEnabled,
        updatedAt: Timestamp.now()
      });
      setActionFeedback({ 
        status: 'success', 
        msg: `Discount mode ${!promoSettings.isEnabled ? 'enabled' : 'disabled'}` 
      });
    } catch (error) {
      setActionFeedback({ status: 'error', msg: 'Failed to update discount settings' });
    }
  };

  // Stats Calculations
  const stats = useMemo(() => {
    const todayRevenue = bookings
      .filter(b => b.status !== 'cancelled')
      .reduce((sum, b) => sum + (b.price || 0), 0);
    
    const totalBookings = bookings.filter(b => b.status !== 'cancelled').length;
    
    const activeTherapists = staffList.filter(s => s.isActive).length;

    return { todayRevenue, totalBookings, activeTherapists };
  }, [bookings, staffList]);

  // Staff Status Logic
  const staffWithStatus = useMemo(() => {
    const nowStr = format(currentTime, 'HH:mm');
    
    return staffList.map(staff => {
      const currentBooking = bookings.find(b => 
        b.therapistId === staff.id && 
        (b.status === 'confirmed' || b.status === 'pending') &&
        b.startTime <= nowStr && 
        b.endTime > nowStr
      );

      return {
        ...staff,
        isBusy: !!currentBooking,
        currentBooking
      };
    }).sort((a, b) => (a.status === 'Working' ? -1 : 1));
  }, [staffList, bookings, currentTime]);

  const greeting = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, [currentTime]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 max-w-7xl mx-auto px-4 sm:px-6 bg-gray-50/50 min-h-screen pt-8">
      {/* Feedback Toast */}
      <AnimatePresence>
        {actionFeedback && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-24 right-6 z-50 p-4 rounded-2xl flex items-center gap-3 border shadow-2xl print:hidden ${
              actionFeedback.status === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            {actionFeedback.status === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
            <p className="text-sm font-bold">{actionFeedback.msg}</p>
            <button onClick={() => setActionFeedback(null)} className="ml-auto text-current/40 hover:text-current">
              <LucideX size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-beige/10 print:mb-2 print:p-4 print:shadow-none">
        <div>
          <h1 className="text-4xl font-serif font-bold text-primary mb-2">
            {greeting}, {auth.currentUser?.displayName?.split(' ')[0] || 'Owner'}
          </h1>
          <p className="text-earth/50 font-medium flex items-center gap-2">
            <Calendar size={16} /> {format(currentTime, 'EEEE, MMMM do yyyy')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 print:hidden">
          <button 
            onClick={() => window.print()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-earth/10 text-earth hover:bg-earth hover:text-white px-6 py-4 rounded-full font-bold text-sm transition-all"
          >
            <Printer size={20} />
            <span>Print Daily Schedule</span>
          </button>
          <div className="flex items-center gap-4 bg-section/50 px-6 py-3 rounded-full border border-beige/20">
            <div className="flex items-center gap-2">
              <Percent className="text-secondary" size={20} />
              <span className="text-sm font-bold text-primary">Store-wide Discount</span>
            </div>
            <button 
              onClick={togglePromo}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${promoSettings?.isEnabled ? 'bg-secondary' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${promoSettings?.isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          
          <button 
            onClick={onQuickAdd}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-sage transition-all shadow-xl shadow-primary/20 active:scale-95"
          >
            <PlusCircle size={24} /> Walk-in Booking
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className={`grid grid-cols-1 ${isOwnerOrAdmin ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6 print:hidden`}>
        {isOwnerOrAdmin && (
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-8 rounded-[2.5rem] border border-beige/20 shadow-sm relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <DollarSign size={80} />
            </div>
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
              <TrendingUp size={28} />
            </div>
            <p className="text-xs font-bold text-earth/40 uppercase tracking-widest mb-2">Today's Revenue</p>
            <h3 className="text-4xl font-bold text-primary">{formatCurrency(stats.todayRevenue)}</h3>
          </motion.div>
        )}

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-8 rounded-[2.5rem] border border-beige/20 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Calendar size={80} />
          </div>
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
            <Activity size={28} />
          </div>
          <p className="text-xs font-bold text-earth/40 uppercase tracking-widest mb-2">Total Bookings</p>
          <h3 className="text-4xl font-bold text-primary">{stats.totalBookings} <span className="text-lg font-medium text-earth/30">Sessions</span></h3>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-8 rounded-[2.5rem] border border-beige/20 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users size={80} />
          </div>
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
            <UserCheck size={28} />
          </div>
          <p className="text-xs font-bold text-earth/40 uppercase tracking-widest mb-2">Active Therapists</p>
          <h3 className="text-4xl font-bold text-primary">{stats.activeTherapists} <span className="text-lg font-medium text-earth/30">On Duty</span></h3>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Staff Status */}
        <div className="lg:col-span-1 bg-white p-8 rounded-[3rem] border border-beige/20 shadow-sm print:hidden">
          <div className="flex items-center justify-between mb-8">
            <h4 className="font-serif font-bold text-2xl text-primary">Live Staff Status</h4>
            <div className="flex items-center gap-2 text-xs font-bold text-earth/30 uppercase tracking-widest">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Live
            </div>
          </div>
          
          <div className="space-y-6">
            {staffWithStatus.map((staff) => (
              <div key={staff.id} className="flex items-center justify-between p-4 rounded-2xl bg-section/30 border border-beige/5">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img 
                      src={
                        staff.imageUrl || 
                        staff.avatar || 
                        (staff.name.toLowerCase().includes('senior') 
                          ? '/image_d57467.png' 
                          : 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=200&h=200')
                      } 
                      alt={staff.name} 
                      className="w-14 h-14 rounded-2xl object-cover shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${staff.status === 'Working' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  </div>
                  <div>
                    <p className="font-bold text-primary">{staff.name}</p>
                    <p className="text-[10px] text-earth/40 uppercase tracking-widest font-bold">{staff.role}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  {staff.status === 'Working' ? (
                    staff.isBusy ? (
                      <div className="flex flex-col items-end">
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-[10px] font-bold uppercase tracking-widest">
                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span> In Session
                        </span>
                        <span className="text-[10px] text-earth/40 mt-1 font-bold">Ends {staff.currentBooking?.endTime}</span>
                      </div>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        Available
                      </span>
                    )
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      Off Duty
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="lg:col-span-2 bg-white rounded-[3rem] border border-beige/20 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-beige/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-serif font-bold text-2xl text-primary">Upcoming Bookings</h4>
              <p className="text-earth/40 text-sm font-medium">Today's schedule overview</p>
            </div>
            <div className="relative print:hidden">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-earth/30" size={18} />
              <input 
                type="text" 
                placeholder="Search bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-section/50 border-none rounded-full py-3 pl-12 pr-6 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-section/30 text-earth/40 text-[10px] font-bold uppercase tracking-[0.2em]">
                  <th className="px-8 py-4">Time</th>
                  <th className="px-8 py-4">Client</th>
                  <th className="px-8 py-4">Service & Staff</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4 text-right print:hidden">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-beige/10">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-earth/20">
                        <Calendar size={48} />
                        <p className="font-serif text-xl">No bookings scheduled for today</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  bookings
                    .filter(b => 
                      b.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      b.serviceName.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((booking) => (
                      <tr key={booking.id} className="hover:bg-section/10 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-primary font-bold">
                            <Clock size={14} className="text-secondary" />
                            {booking.startTime}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold text-sm">
                              {booking.clientName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-primary text-sm">{booking.clientName}</p>
                              <p className="text-[10px] text-earth/40 font-bold uppercase tracking-wider">{booking.clientPhone || 'No Phone'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm font-bold text-primary">{booking.serviceName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <User size={12} className="text-earth/30" />
                            <span className="text-[10px] font-bold text-earth/40 uppercase tracking-widest">
                              {booking.therapistName || 'Any Staff'}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${
                            booking.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                            booking.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            'bg-rose-100 text-rose-700'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right print:hidden">
                          <button className="p-2 text-earth/30 hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                            <ChevronRight size={20} />
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
