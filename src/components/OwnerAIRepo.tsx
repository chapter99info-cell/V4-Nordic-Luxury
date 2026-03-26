import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, AlertCircle, TrendingUp, DollarSign, 
  Users, ShoppingBag, ArrowRight, CheckCircle2,
  Clock, Wallet, MousePointerClick, BarChart3
} from 'lucide-react';
import { 
  collection, query, onSnapshot, where, 
  orderBy, limit, Timestamp, getDocs 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Booking, Service } from '../types';
import { format, startOfDay, endOfDay, isToday } from 'date-fns';

interface OwnerAIRepoProps {
  shopId: string;
}

interface HesitationLog {
  id: string;
  serviceId: string;
  serviceName: string;
  price: number;
  category: string;
  timestamp: any;
  action: string;
}

export const OwnerAIRepo: React.FC<OwnerAIRepoProps> = ({ shopId }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hesitationLogs, setHesitationLogs] = useState<HesitationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);

    // Fetch today's bookings
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('shopId', '==', shopId),
      where('date', '==', format(today, 'yyyy-MM-dd'))
    );

    const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(docs);
      setLoading(false);
    });

    // Fetch hesitation logs (last 7 days for better drop-off analysis)
    const logsQuery = query(
      collection(db, 'hesitation_logs'),
      orderBy('timestamp', 'desc'),
      limit(200)
    );

    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HesitationLog));
      setHesitationLogs(docs);
    });

    return () => {
      unsubscribeBookings();
      unsubscribeLogs();
    };
  }, [shopId]);

  // Logic คำนวณรายได้สำหรับ Owner (React + Firestore Logic)
  const calculateOwnerReport = (bookings: Booking[]) => {
    return bookings.reduce((acc, booking) => {
      const price = booking.price || 0;
      const deposit = booking.depositAmountPaid || 0; // เงินมัดจำที่จ่ายออนไลน์แล้ว
      const balance = price - deposit; // ยอดคงเหลือที่ต้องเก็บหน้างาน

      // 1. รวมยอดมัดจำทั้งหมด (เงินเข้าบัญชีเจ้าของแน่นอน)
      acc.totalDeposits += deposit;

      // 2. ถ้าจ่ายส่วนที่เหลือด้วย Card (เงินเข้าบัญชีเจ้าของ)
      if (booking.paymentMethod?.toLowerCase() === 'card') {
        acc.onlineRevenue += balance;
      } 
      
      // 3. ถ้าจ่ายส่วนที่เหลือด้วย Cash (เงินอยู่ที่พนักงาน)
      if (booking.paymentMethod?.toLowerCase() === 'cash' && booking.status === 'completed') {
        // Only count if owner hasn't collected it yet
        if (!booking.isCashCollectedByOwner) {
          acc.cashInHandStaff += balance;
          
          // เก็บข้อมูลแยกตามชื่อพนักงานเพื่อตามเงินถูกคน
          const staffName = booking.therapistName || 'Unassigned';
          acc.staffCashBreakdown[staffName] = (acc.staffCashBreakdown[staffName] || 0) + balance;
          acc.staffLastTime[staffName] = booking.startTime;
        }
      }

      // 4. เคสลูกค้า No-show (ริบเงินมัดจำ)
      if (booking.status === 'no-show') {
        acc.noShowRevenue += deposit;
      }

      return acc;
    }, {
      totalDeposits: 0,
      onlineRevenue: 0,
      cashInHandStaff: 0,
      noShowRevenue: 0,
      staffCashBreakdown: {} as Record<string, number>,
      staffLastTime: {} as Record<string, string>
    });
  };

  const report = calculateOwnerReport(bookings);
  const totalExpectedRevenue = bookings.reduce((sum, b) => sum + (b.price || 0), 0);
  const totalCashExpected = bookings.filter(b => b.paymentMethod === 'Cash').reduce((sum, b) => sum + (b.price || 0), 0);

  // Most Booked Service (All time or recent)
  const serviceFrequency: { [key: string]: number } = {};
  bookings.forEach(b => {
    serviceFrequency[b.serviceName] = (serviceFrequency[b.serviceName] || 0) + 1;
  });
  const mostBookedService = Object.entries(serviceFrequency).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Drop-off Analysis
  const dropOffFrequency: { [key: string]: number } = {};
  hesitationLogs.forEach(log => {
    dropOffFrequency[log.serviceName] = (dropOffFrequency[log.serviceName] || 0) + 1;
  });
  const topDropOff = Object.entries(dropOffFrequency).sort((a, b) => b[1] - a[1])[0];

  if (loading) return null;

  return (
    <div className="space-y-6">
      {/* 1. Daily AI Insight */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-sage/10 to-earth/5 p-8 rounded-[3rem] border border-sage/20 shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Sparkles size={120} className="text-primary" />
        </div>
        
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles size={20} />
            <h3 className="font-serif font-bold text-xl">Daily AI Insight</h3>
          </div>
          
          <p className="text-earth/80 leading-relaxed text-lg max-w-2xl">
            "วันนี้มีคิวจองทั้งหมด <span className="font-bold text-primary">{bookings.length} งาน</span> คาดการณ์รายได้รวม <span className="font-bold text-primary">${totalExpectedRevenue.toLocaleString()}</span> (เป็นเงินสดที่ต้องเรียกเก็บจากพนักงาน <span className="font-bold text-primary">${report.cashInHandStaff.toLocaleString()}</span>) มีลูกค้าใหม่ {bookings.filter(b => !b.isReturning).length} ท่าน และมี {bookings.filter(b => !b.therapistId).length} คิวที่ยังไม่ได้มอบหมายพนักงานครับ"
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 2. Risk & Leakage Alert */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-8 rounded-[3rem] border border-rose-100 shadow-sm space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertCircle size={20} />
              <h3 className="font-serif font-bold text-xl">Risk & Leakage Alert</h3>
            </div>
            <span className="bg-rose-50 text-rose-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              Cash Control
            </span>
          </div>

          <div className="space-y-4">
            {/* Uncollected Cash */}
            <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100/50">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-100 rounded-xl text-rose-600">
                  <Wallet size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-rose-900 mb-1">Uncollected Cash</p>
                  {Object.keys(report.staffCashBreakdown).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(report.staffCashBreakdown).map(([name, amount], idx) => (
                        <p key={idx} className="text-xs text-rose-700/80">
                          🚩 พนักงาน <span className="font-bold">'{name}'</span> มีเงินสดค้างส่ง <span className="font-bold">${amount}</span> จากงานเมื่อเวลา {report.staffLastTime[name]}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-rose-700/60 italic">ไม่มีเงินสดค้างส่งในขณะนี้</p>
                  )}
                </div>
              </div>
            </div>

            {/* No-show Revenue */}
            <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/50">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-900 mb-1">No-show Revenue</p>
                  <p className="text-xs text-emerald-700/80">
                    ⚠️ วันนี้ริบมัดจำได้ <span className="font-bold">${report.noShowRevenue}</span> จากลูกค้า {bookings.filter(b => b.status === 'no-show').length} ท่านที่ไม่มาตามนัด (เพิ่มกำไรโดยไม่มีต้นทุนแรงงาน)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 3. Smart Analytics */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-8 rounded-[3rem] border border-beige/20 shadow-sm space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <BarChart3 size={20} />
              <h3 className="font-serif font-bold text-xl">Smart Analytics</h3>
            </div>
            <span className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              Behavior
            </span>
          </div>

          <div className="space-y-4">
            {/* Hot Service */}
            <div className="flex items-center justify-between p-5 bg-section/50 rounded-2xl border border-beige/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-earth/40 uppercase tracking-widest mb-0.5">Hot Service</p>
                  <p className="text-sm font-bold text-primary">{mostBookedService}</p>
                </div>
              </div>
              <span className="bg-amber-500 text-white text-[8px] font-bold px-2 py-1 rounded-md uppercase">Best Seller</span>
            </div>

            {/* Booking Drop-off */}
            <div className="flex items-center justify-between p-5 bg-section/50 rounded-2xl border border-beige/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                  <MousePointerClick size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-earth/40 uppercase tracking-widest mb-0.5">Booking Drop-off</p>
                  <p className="text-sm font-bold text-primary">
                    {topDropOff ? `${topDropOff[0]} (${topDropOff[1]} views)` : 'No drop-off data'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-earth/40 font-bold uppercase">Drop-off Alert</p>
                <p className="text-[9px] text-rose-500 font-bold italic">Check price/images</p>
              </div>
            </div>
          </div>

          <button className="w-full py-4 text-xs font-bold text-earth/40 uppercase tracking-widest hover:text-primary transition-all flex items-center justify-center gap-2 group">
            View Full Report <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    </div>
  );
};
