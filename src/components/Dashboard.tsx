import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Users, 
  Calendar as CalendarIcon, 
  DollarSign, 
  ArrowUpRight, 
  Clock, 
  Plus,
  ChevronRight,
  MoreVertical,
  AlertCircle,
  BarChart2,
  Search,
  Filter,
  Download,
  Award,
  Zap,
  Check,
  X,
  Printer
} from 'lucide-react';
import { collection, query, onSnapshot, orderBy, limit, where, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Booking, User, Staff } from '../types';
import { format, isToday, isFuture, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie } from 'recharts';
import { HolidayManagement } from './HolidayManagement';
import { ProductManagement } from './ProductManagement';
import { BusinessInsights } from './BusinessInsights';
import { apiService } from '../services/api';

const COLORS = ['#4A5D23', '#C5A059', '#8E9D7A', '#D9C5A0'];

export const Dashboard: React.FC<{ onBook: (service?: any) => void; role?: string | null; config?: any; onQuickAdd?: () => void }> = ({ onBook, role, config, onQuickAdd }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [stats, setStats] = useState({
    revenue: 0,
    bookingsCount: 0,
    activeStaff: 0,
    uniqueClients: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [dailyRevenueData, setDailyRevenueData] = useState<any[]>([]);
  const [hourlyRevenueData, setHourlyRevenueData] = useState<any[]>([]);
  const [serviceDistribution, setServiceDistribution] = useState<any[]>([]);
  const [topServices, setTopServices] = useState<any[]>([]);
  const [therapistPerformance, setTherapistPerformance] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleApprove = async (bookingId: string) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'waiting-for-deposit'
      });
      
      if (booking?.slotId) {
        await updateDoc(doc(db, 'public_slots', booking.slotId), {
          status: 'waiting-for-deposit'
        });
      }

      // Trigger Webhook for Approval
      fetch('/api/webhook/google-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve_booking',
          booking_id: bookingId,
          status: 'waiting-for-deposit'
        })
      }).catch(err => console.error("Webhook update failed:", err));
      
      alert("อนุมัติคิวเรียบร้อย! ระบบจะส่ง Invoice ให้ลูกค้า");
    } catch (error) {
      console.error("Error approving booking:", error);
    }
  };

  const handleConfirmPayment = async (bookingId: string) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'confirmed',
        paymentStatus: 'fully-paid'
      });
      
      if (booking?.slotId) {
        await updateDoc(doc(db, 'public_slots', booking.slotId), {
          status: 'confirmed'
        });
      }

      // Trigger Webhook for Payment Confirmation
      fetch('/api/webhook/google-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm_payment',
          booking_id: bookingId,
          status: 'confirmed',
          payment_status: 'fully-paid'
        })
      }).catch(err => console.error("Webhook update failed:", err));
      
      alert("ยืนยันการชำระเงินเรียบร้อย!");
    } catch (error) {
      console.error("Error confirming payment:", error);
    }
  };

  const handleCancel = async (bookingId: string) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      await updateDoc(doc(db, 'bookings', bookingId), {
        status: 'cancelled'
      });

      if (booking?.slotId) {
        await updateDoc(doc(db, 'public_slots', booking.slotId), {
          status: 'cancelled'
        });
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'bookings'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      
      // Add mock data for demonstration if empty
      const displayDocs = docs.length > 0 ? docs : [
        {
          id: 'mock-1',
          clientName: 'Sarah Johnson',
          clientPhone: '0412 345 678',
          serviceName: 'Remedial Massage',
          date: format(new Date(), 'yyyy-MM-dd'),
          startTime: '10:00',
          price: 120,
          paymentMethod: 'Transfer',
          status: 'confirmed',
          subtotal: 120,
          discount: 0
        },
        {
          id: 'mock-2',
          clientName: 'Michael Chen',
          clientPhone: '0423 456 789',
          serviceName: 'Traditional Thai',
          date: format(new Date(), 'yyyy-MM-dd'),
          startTime: '11:30',
          price: 95,
          paymentMethod: 'Cash',
          status: 'confirmed',
          subtotal: 95,
          discount: 0
        },
        {
          id: 'mock-3',
          clientName: 'Emma Wilson',
          clientPhone: '0434 567 890',
          serviceName: 'Aromatherapy',
          date: format(new Date(), 'yyyy-MM-dd'),
          startTime: '14:00',
          price: 110,
          paymentMethod: 'Card',
          status: 'confirmed',
          subtotal: 110,
          discount: 0
        }
      ] as Booking[];

      setBookings(displayDocs);

      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const thisMonthBookings = displayDocs.filter(b => {
        const d = new Date(b.date);
        return d >= monthStart && d <= monthEnd && b.status !== 'cancelled';
      });

      // Calculate stats
      const totalRevenue = thisMonthBookings.reduce((acc, curr) => acc + curr.price, 0);
      const activeStaffCount = staff.filter(s => s.isActive).length;
      const uniqueClientsCount = new Set(displayDocs.map(b => b.clientId)).size;

      setStats({
        revenue: totalRevenue,
        bookingsCount: thisMonthBookings.length,
        activeStaff: activeStaffCount,
        uniqueClients: uniqueClientsCount
      });

      // Chart Data: Revenue by Therapist
      const therapistRevenue: { [key: string]: number } = {};
      thisMonthBookings.forEach(b => {
        const name = b.therapistName || 'Unknown';
        therapistRevenue[name] = (therapistRevenue[name] || 0) + b.price;
      });

      const chartArr = Object.entries(therapistRevenue).map(([name, value]) => ({
        name,
        value
      }));
      setChartData(chartArr);

      // Daily revenue for current month
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
      const dailyData = days.map(day => {
        const dayBookings = displayDocs.filter(b => isSameDay(new Date(b.date), day) && b.status !== 'cancelled');
        const revenue = dayBookings.reduce((sum, b) => sum + b.price, 0);
        return {
          name: format(day, 'd'),
          revenue
        };
      });
      setDailyRevenueData(dailyData);

      // Hourly revenue for today
      const hours = Array.from({ length: 12 }, (_, i) => i + 9); // 9 AM to 8 PM
      const hourlyData = hours.map(hour => {
        const hourBookings = displayDocs.filter(b => {
          const d = new Date(b.date);
          const [h] = b.startTime.split(':').map(Number);
          return isToday(d) && h === hour && b.status !== 'cancelled';
        });
        const revenue = hourBookings.reduce((sum, b) => sum + b.price, 0);
        return {
          name: `${hour}:00`,
          revenue
        };
      });
      setHourlyRevenueData(hourlyData);

      // Service distribution
      const services: { [key: string]: number } = {};
      displayDocs.forEach(b => {
        services[b.serviceName] = (services[b.serviceName] || 0) + 1;
      });
      const distribution = Object.entries(services).map(([name, value]) => ({ name, value }));
      setServiceDistribution(distribution);

      // Top 3 Services by Revenue
      const serviceRevenue: { [key: string]: number } = {};
      displayDocs.forEach(b => {
        if (b.status !== 'cancelled') {
          serviceRevenue[b.serviceName] = (serviceRevenue[b.serviceName] || 0) + b.price;
        }
      });
      const top3 = Object.entries(serviceRevenue)
        .map(([name, revenue]) => ({ name, revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 3);
      setTopServices(top3);

      // Today's Therapist Performance by Service Count
      const todayTherapistCount: { [key: string]: number } = {};
      displayDocs.forEach(b => {
        if (isToday(new Date(b.date)) && b.status !== 'cancelled') {
          const name = b.therapistName || 'Staff';
          todayTherapistCount[name] = (todayTherapistCount[name] || 0) + 1;
        }
      });
      const performance = Object.entries(todayTherapistCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
      setTherapistPerformance(performance);
    });

    // Fetch Staff
    const staffQ = query(collection(db, 'staff'));
    const unsubscribeStaff = onSnapshot(staffQ, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff));
      setStaff(docs);
    });

    // Fetch 5 Recent Bookings (by creation time)
    const recentQ = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'), limit(5));
    const unsubscribeRecent = onSnapshot(recentQ, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setRecentBookings(docs);
    });

    return () => {
      unsubscribe();
      unsubscribeStaff();
      unsubscribeRecent();
    };
  }, []);

  const handleWalkIn = async () => {
    const now = new Date();
    const activeStaff = staff.find(s => s.isActive);
    if (!activeStaff) {
      alert("Please add at least one active staff member first.");
      return;
    }
    await addDoc(collection(db, 'bookings'), {
      clientId: 'walk-in',
      clientName: 'Walk-in Customer',
      clientPhone: 'N/A',
      serviceId: 'traditional-thai',
      serviceName: 'Traditional Thai Massage',
      therapistId: activeStaff.id,
      therapistName: activeStaff.name,
      date: format(now, 'yyyy-MM-dd'),
      startTime: format(now, 'HH:mm'),
      endTime: format(new Date(now.getTime() + 60 * 60 * 1000), 'HH:mm'),
      duration: 60,
      price: 95,
      status: 'confirmed',
      paymentStatus: 'fully-paid',
      isWalkIn: true,
      createdAt: now.toISOString(),
      depositPaid: true,
      intakeFormCompleted: true
    });
  };

  const filteredTransactions = bookings.filter(b => {
    const matchesSearch = 
      b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      b.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const bookingDate = parseISO(b.date);
    const matchesDate = isWithinInterval(bookingDate, {
      start: startOfDay(parseISO(startDate)),
      end: endOfDay(parseISO(endDate))
    });

    return matchesSearch && matchesDate;
  });

  return (
    <div className="space-y-10">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:mb-2">
        <div>
          <h2 className="text-3xl font-serif font-bold text-primary mb-1">Sawadee, {role === 'admin' ? 'Admin' : 'Staff'}</h2>
          <p className="text-earth/50 text-sm">Here's what's happening at Mira this month.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-earth/10 text-earth hover:bg-earth hover:text-white px-4 py-2 rounded-xl transition-all font-bold text-sm print:hidden"
          >
            <Printer size={18} />
            <span>Print Daily Schedule</span>
          </button>
          <button 
            onClick={onQuickAdd}
            className="flex items-center gap-2 bg-primary text-white px-6 py-4 rounded-[2rem] font-bold text-xs hover:bg-sage transition-all shadow-lg shadow-primary/20 print:hidden"
          >
            <Plus size={18} /> QUICK ADD (Walk-in)
          </button>
          <div className="flex items-center gap-4 bg-primary/5 px-8 py-4 rounded-[2rem] border border-primary/10 shadow-sm print:hidden">
            <div className="text-right">
              <p className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.2em]">Today's Revenue</p>
              <p className="text-2xl font-serif font-bold text-primary">TODAY'S REVENUE: $1,250.00</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <DollarSign size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* AI Business Manager Insights */}
      <div className="print:hidden">
        <BusinessInsights bookings={bookings} staff={staff} />
      </div>

      {/* Daily Revenue Report Section */}
      <div className="bg-white rounded-[3rem] border border-beige/20 p-8 shadow-sm print:hidden">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h4 className="text-xl font-serif font-bold text-primary">Daily Revenue Report</h4>
            <p className="text-xs text-earth/40">Hourly breakdown of today's performance</p>
          </div>
          <div className="flex items-center gap-2 text-sage font-bold text-xs uppercase tracking-widest">
            <TrendingUp size={16} />
            +12% from yesterday
          </div>
        </div>
        
        <div className="h-[250px] w-full mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#4A5D23', fontSize: 10 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#4A5D23', fontSize: 10 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                cursor={{ fill: '#FAFAF5' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}
              />
              <Bar dataKey="revenue" fill="#4A5D23" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats Grid - 4 Column Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 print:hidden">
        {[
          { label: 'Monthly Revenue', value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Monthly Bookings', value: stats.bookingsCount, icon: CalendarIcon, color: 'bg-amber-50 text-amber-600' },
          { label: 'Unique Clients', value: stats.uniqueClients, icon: Users, color: 'bg-blue-50 text-blue-600' },
          { label: 'Active Staff', value: stats.activeStaff, icon: Clock, color: 'bg-rose-50 text-rose-600' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[2.5rem] border border-beige/20 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
            <p className="text-earth/40 text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-serif font-bold text-primary">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Visuals: Charts & List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">
        {/* Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-[3rem] border border-beige/20 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-xl font-serif font-bold text-primary">Daily Revenue Report</h4>
            <button className="text-[10px] font-bold uppercase tracking-widest text-primary/40 hover:text-primary flex items-center gap-1 print:hidden">
              <Download size={14} /> Export CSV
            </button>
          </div>
          <div className="h-[300px] w-full mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyRevenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4A5D23" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4A5D23" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#4A5D23', fontSize: 10 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#4A5D23', fontSize: 10 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  cursor={{ stroke: '#4A5D23', strokeWidth: 1 }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4A5D23" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Statistics Breakdown Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-beige/10">
            <div>
              <h5 className="text-[10px] font-bold uppercase tracking-widest text-earth/40 mb-4 flex items-center gap-2">
                <Award size={14} className="text-secondary" /> Top 3 Services (by Revenue)
              </h5>
              <div className="space-y-3">
                {topServices.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-section rounded-2xl">
                    <span className="text-xs font-bold text-primary">{s.name}</span>
                    <span className="text-xs font-serif font-bold text-secondary">${s.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h5 className="text-[10px] font-bold uppercase tracking-widest text-earth/40 mb-4 flex items-center gap-2">
                <Zap size={14} className="text-sage" /> Today's Therapist Performance
              </h5>
              <div className="space-y-3">
                {therapistPerformance.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-section rounded-2xl">
                    <span className="text-xs font-bold text-primary">{p.name}</span>
                    <span className="text-xs font-bold text-sage">{p.count} sessions</span>
                  </div>
                ))}
                {therapistPerformance.length === 0 && (
                  <p className="text-[10px] text-earth/30 italic py-4 text-center">No performance data for today yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Today's Upcoming Bookings */}
        <div className="bg-white rounded-[3rem] border border-beige/20 p-8 shadow-sm">
          <h4 className="text-xl font-serif font-bold text-primary mb-8">Today's Upcoming</h4>
          <div className="space-y-6">
            {bookings
              .filter(b => isToday(new Date(b.date)) && b.status !== 'cancelled')
              .slice(0, 6)
              .map((booking) => (
                <div key={booking.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-section flex items-center justify-center text-primary font-bold text-xs">
                      {booking.clientName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-primary">{booking.clientName}</h5>
                      <div className="flex items-center gap-1.5">
                        <p className="text-[9px] text-earth/40 uppercase tracking-widest font-bold">{booking.startTime} - {booking.serviceName}</p>
                        {booking.useCoconutOil && (
                          <span className="text-[7px] font-bold text-sage uppercase tracking-widest bg-sage/5 px-1 py-0.5 rounded border border-sage/10">
                            + Coconut
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-earth/20 group-hover:text-primary transition-colors" />
                </div>
              ))}
            {bookings.filter(b => isToday(new Date(b.date))).length === 0 && (
              <div className="py-12 text-center">
                <p className="text-earth/30 text-sm italic">No sessions today.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Visuals: Distribution & Staff Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue by Therapist Chart */}
        <div className="bg-white rounded-[3rem] border border-beige/20 p-8 shadow-sm">
          <h4 className="text-xl font-serif font-bold text-primary mb-8">Revenue by Therapist</h4>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#4A5D23', fontSize: 12, fontWeight: 600 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#4A5D23', fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  cursor={{ fill: '#FAFAF5' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}
                />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Popularity */}
        <div className="bg-white p-8 rounded-[3rem] border border-beige/20 shadow-sm">
          <h4 className="text-xl font-serif font-bold text-primary mb-8">Service Popularity</h4>
          <div className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {serviceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-1/3 space-y-4">
              {serviceDistribution.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <div>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none mb-1">{s.name}</p>
                    <p className="text-xs text-earth/40">{s.value} bookings</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Latest Activity Section (5 Recent Bookings) */}
      <div className="bg-white rounded-[3rem] border border-beige/20 p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h4 className="text-xl font-serif font-bold text-primary">Latest Activity</h4>
            <p className="text-xs text-earth/40">The 5 most recently created bookings</p>
          </div>
          <div className="flex items-center gap-2 text-sage font-bold text-xs uppercase tracking-widest">
            <Clock size={16} />
            Real-time Updates
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {recentBookings.map((booking, i) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-section p-4 rounded-3xl border border-beige/10 hover:border-primary/20 transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
                  {booking.clientName.substring(0, 2).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <h5 className="text-[10px] font-bold text-primary truncate">{booking.clientName}</h5>
                  <p className="text-[8px] text-earth/40 uppercase tracking-tighter">#{booking.id.substring(0, 6)}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-earth/60 truncate">{booking.serviceName}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-bold text-secondary">${booking.price}</span>
                  <span className={`text-[7px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 
                    booking.status === 'cancelled' ? 'bg-rose-50 text-rose-600' : 
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
          {recentBookings.length === 0 && (
            <div className="col-span-5 py-8 text-center text-earth/30 text-sm italic">
              No recent activity.
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Transactions Table */}
      <div className="bg-white rounded-[3rem] border border-beige/20 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <h4 className="text-xl font-serif font-bold text-primary">Recent Transactions</h4>
          
          <div className="flex flex-wrap items-center gap-4 print:hidden">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-earth/30" size={16} />
              <input 
                type="text" 
                placeholder="Search by Name or ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 pr-6 py-2.5 bg-section border border-beige/10 rounded-full text-xs focus:outline-none focus:border-primary/20 w-full md:w-64"
              />
            </div>

            {/* Date Filters */}
            <div className="flex items-center gap-2 bg-section p-1 rounded-full border border-beige/10">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-[10px] font-bold text-primary px-3 py-1.5 focus:outline-none"
              />
              <span className="text-earth/20 text-xs">to</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-[10px] font-bold text-primary px-3 py-1.5 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-beige/10">
                <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-earth/30">Transaction ID</th>
                <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-earth/30">Customer Name</th>
                <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-earth/30">Service Type</th>
                <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-earth/30">Time</th>
                <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-earth/30">Payment</th>
                <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-earth/30">Subtotal</th>
                <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-earth/30">Discount</th>
                <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-earth/30">Total</th>
                <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-earth/30">Status</th>
                <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-earth/30">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-beige/5">
              {filteredTransactions.map((booking) => (
                <tr key={booking.id} className="group hover:bg-section/50 transition-colors">
                  <td className="py-4 text-[10px] font-mono text-earth/40">#{booking.id.substring(0, 8).toUpperCase()}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-section flex items-center justify-center text-xs font-bold text-primary">
                        {booking.clientName.substring(0, 1)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-primary">{booking.clientName}</p>
                          {booking.isReturning && (
                            <span className="text-[8px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                              Returning
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <p className="text-[9px] text-earth/40 font-mono">{booking.clientPhone || 'No Phone'}</p>
                          <p className="text-[9px] text-earth/40 font-mono">{booking.clientEmail || 'No Email'}</p>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-xs text-earth/60">{booking.serviceName}</td>
                  <td className="py-4 text-xs text-earth/60">{format(new Date(booking.date), 'MMM d')} at {booking.startTime}</td>
                  <td className="py-4">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                      booking.paymentMethod === 'Transfer' ? 'bg-blue-50 text-blue-600' : 
                      booking.paymentMethod === 'Card' ? 'bg-purple-50 text-purple-600' : 
                      'bg-emerald-50 text-emerald-600'
                    }`}>
                      {booking.paymentMethod || 'Cash'}
                    </span>
                  </td>
                  <td className="py-4 text-xs text-earth/60">${(booking.subtotal || booking.price).toLocaleString()}</td>
                  <td className="py-4 text-xs text-rose-500">-${(booking.discount || 0).toLocaleString()}</td>
                  <td className="py-4 text-xs font-bold text-primary">${booking.price.toLocaleString()}</td>
                  <td className="py-4">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                      booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 
                      booking.status === 'waiting-for-deposit' ? 'bg-amber-100 text-amber-700' :
                      booking.status === 'cancelled' ? 'bg-rose-50 text-rose-600' : 
                      'bg-yellow-50 text-yellow-600'
                    }`}>
                      {booking.status === 'pending' ? 'Tentative' : 
                       booking.status === 'waiting-for-deposit' ? 'Waiting Deposit' : 
                       booking.status}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                      {booking.status === 'pending' && (
                        <button 
                          onClick={() => handleApprove(booking.id)}
                          className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                          title="Approve & Send Invoice"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      {booking.status === 'waiting-for-deposit' && (
                        <button 
                          onClick={() => handleConfirmPayment(booking.id)}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                          title="Confirm Payment"
                        >
                          <DollarSign size={14} />
                        </button>
                      )}
                      {booking.status === 'confirmed' && (
                        <button 
                          onClick={() => {
                            // In real app, this would trigger the GAS to generate PDF
                            alert("Generating Tax Invoice via Google Apps Script...");
                            // We can call the webhook with an invoice action
                            fetch('/api/webhook/google-script', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                action: 'generate_invoice',
                                booking_id: booking.id,
                                customer_email: booking.clientEmail
                              })
                            }).catch(err => console.error("Invoice trigger failed:", err));
                          }}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          title="Generate Tax Invoice"
                        >
                          <Download size={14} />
                        </button>
                      )}
                      {booking.status !== 'cancelled' && (
                        <button 
                          onClick={() => handleCancel(booking.id)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                          title="Cancel Booking"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-earth/30 text-sm italic">
                    No transactions found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Block Management Section */}
      <div id="manual-block-section" className="print:hidden">
        <ManualBlockManagement />
      </div>

      {/* Holiday Management Section */}
      <div className="print:hidden">
        <HolidayManagement />
      </div>

      {/* Product Management Section */}
      <div className="print:hidden">
        <ProductManagement />
      </div>
    </div>
  );
};

const ManualBlockManagement: React.FC = () => {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);

  const handleBlock = async () => {
    setLoading(true);
    try {
      await apiService.createManualBlock(date, time, duration);
      
      // Trigger Webhook for Manual Block
      fetch('/api/webhook/google-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'manual_block',
          date,
          start_time: time,
          duration_min: duration
        })
      }).catch(err => console.error("Webhook block failed:", err));

      alert('Slot blocked successfully (iPad/Manual First)');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[3rem] border border-beige/20 p-8 shadow-sm mb-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
          <X size={24} />
        </div>
        <div>
          <h4 className="text-xl font-serif font-bold text-primary">iPad Manual Block</h4>
          <p className="text-xs text-earth/40">Single Source of Truth: Block slots for Walk-ins or Cleaning</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-earth/40">Date</label>
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-section border border-beige/10 rounded-2xl p-3 text-xs"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-earth/40">Start Time</label>
          <input 
            type="time" 
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full bg-section border border-beige/10 rounded-2xl p-3 text-xs"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-earth/40">Duration (min)</label>
          <select 
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full bg-section border border-beige/10 rounded-2xl p-3 text-xs"
          >
            <option value={30}>30 min</option>
            <option value={45}>45 min</option>
            <option value={60}>60 min</option>
            <option value={90}>90 min</option>
            <option value={120}>120 min</option>
          </select>
        </div>
        <div className="flex items-end">
          <button 
            onClick={handleBlock}
            disabled={loading}
            className="w-full bg-rose-500 text-white py-3 rounded-2xl font-bold text-xs hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50"
          >
            {loading ? 'Blocking...' : 'BLOCK SLOT NOW'}
          </button>
        </div>
      </div>
    </div>
  );
};
