import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  Timestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Booking, Staff } from '../types';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Printer, 
  MessageCircle, 
  Banknote, 
  Smartphone, 
  TrendingUp, 
  Users,
  Calendar as CalendarIcon,
  Loader2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency } from '../lib/formatters';
import { toast } from 'sonner';
import { sendLineNotification } from '../services/notificationService';

interface DailyReportProps {
  config?: any;
  role?: string | null;
}

export const DailyReport: React.FC<DailyReportProps> = ({ config, role }) => {
  const isOwnerOrAdmin = role === 'owner' || role === 'admin';
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingLine, setSendingLine] = useState(false);

  if (!isOwnerOrAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="text-rose-500" size={48} />
        <p className="text-xl font-bold text-rose-500 uppercase tracking-widest">Access Denied</p>
        <p className="text-earth/50">You do not have permission to view financial reports.</p>
      </div>
    );
  }

  useEffect(() => {
    setLoading(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const path = 'bookings';
    
    const q = query(
      collection(db, path),
      where('date', '==', dateStr),
      where('status', '==', 'completed'),
      where('shopId', '==', config?.shopId || 'SHOP01')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedDate, config?.shopId]);

  // Calculations
  const stats = useMemo(() => {
    const cash = bookings
      .filter(b => b.paymentMethod === 'Cash')
      .reduce((sum, b) => sum + (b.price || 0), 0);
    
    const transfer = bookings
      .filter(b => b.paymentMethod === 'Transfer')
      .reduce((sum, b) => sum + (b.price || 0), 0);
    
    const card = bookings
      .filter(b => b.paymentMethod === 'Card')
      .reduce((sum, b) => sum + (b.price || 0), 0);

    const total = cash + transfer + card;

    // Staff breakdown
    const staffMap: Record<string, { name: string, count: number, revenue: number }> = {};
    bookings.forEach(b => {
      if (b.therapistId) {
        if (!staffMap[b.therapistId]) {
          staffMap[b.therapistId] = { name: b.therapistName || 'Unknown', count: 0, revenue: 0 };
        }
        staffMap[b.therapistId].count += 1;
        staffMap[b.therapistId].revenue += (b.price || 0);
      }
    });

    return {
      cash,
      transfer,
      card,
      total,
      staffBreakdown: Object.values(staffMap).sort((a, b) => b.revenue - a.revenue)
    };
  }, [bookings]);

  const handlePrint = () => {
    window.print();
  };

  const handleSendToLine = async () => {
    setSendingLine(true);
    const dateStr = format(selectedDate, 'dd/MM/yyyy');
    const message = `📊 สรุปยอดขายประจำวัน (${dateStr})\n` +
      `--------------------------\n` +
      `💰 ยอดรวม: ${formatCurrency(stats.total)}\n` +
      `💵 เงินสด: ${formatCurrency(stats.cash)}\n` +
      `📱 โอนเงิน: ${formatCurrency(stats.transfer)}\n` +
      `💳 บัตร: ${formatCurrency(stats.card)}\n\n` +
      `👥 พนักงาน:\n` +
      stats.staffBreakdown.map(s => `- ${s.name}: ${s.count} คิว (${formatCurrency(s.revenue)})`).join('\n');
    
    try {
      await sendLineNotification(message);
      toast.success('ส่งสรุปยอดเข้า LINE เรียบร้อยแล้วค่ะ', {
        icon: <MessageCircle className="text-emerald-500" size={18} />
      });
    } catch (error) {
      toast.error('ไม่สามารถส่ง LINE ได้ กรุณาตรวจสอบการตั้งค่า');
    } finally {
      setSendingLine(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 print:p-0 print:pb-0">
      {/* Header & Date Picker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
        <div>
          <h2 className="text-4xl font-serif font-bold text-primary mb-2">สรุปยอดขายประจำวัน</h2>
          <p className="text-earth/50 text-lg font-medium">ตรวจสอบรายได้และผลงานพนักงาน</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-[2.5rem] border-2 border-beige/20 shadow-xl">
          <button 
            onClick={() => setSelectedDate(prev => addDays(prev, -1))}
            className="p-4 rounded-full hover:bg-section transition-all text-primary"
          >
            <ChevronLeft size={32} strokeWidth={3} />
          </button>
          <div className="flex flex-col items-center px-6 min-w-[200px]">
            <span className="text-2xl font-black text-primary uppercase tracking-tighter">
              {format(selectedDate, 'EEEE, d MMM')}
            </span>
            <span className="text-xs font-bold text-sage uppercase tracking-[0.2em]">
              {format(selectedDate, 'yyyy')}
            </span>
          </div>
          <button 
            onClick={() => setSelectedDate(prev => addDays(prev, 1))}
            className="p-4 rounded-full hover:bg-section transition-all text-primary"
          >
            <ChevronRight size={32} strokeWidth={3} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-primary" size={48} />
          <p className="text-xl font-bold text-primary/40 uppercase tracking-widest">กำลังคำนวณยอด...</p>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Summary Cards - Extra Large Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Revenue */}
            <div className="bg-primary text-white p-8 rounded-[3rem] shadow-2xl shadow-primary/20 relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4 opacity-80">
                  <TrendingUp size={24} />
                  <span className="text-sm font-black uppercase tracking-[0.2em]">ยอดขายรวมทั้งหมด</span>
                </div>
                <h3 className="text-5xl md:text-6xl font-black tracking-tighter mb-2">
                  {formatCurrency(stats.total)}
                </h3>
                <p className="text-white/60 font-bold">{bookings.length} รายการที่เสร็จสิ้น</p>
              </div>
              <TrendingUp className="absolute -right-8 -bottom-8 text-white/10 w-48 h-48 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
            </div>

            {/* Cash Summary */}
            <div className="bg-white p-8 rounded-[3rem] border-2 border-amber-100 shadow-xl relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4 text-amber-600">
                  <Banknote size={24} />
                  <span className="text-sm font-black uppercase tracking-[0.2em]">ยอดเงินสด</span>
                </div>
                <h3 className="text-5xl font-black text-primary tracking-tighter mb-2">
                  {formatCurrency(stats.cash)}
                </h3>
                <p className="text-earth/40 font-bold">รับเงินสดหน้าร้าน</p>
              </div>
              <Banknote className="absolute -right-8 -bottom-8 text-amber-50 w-40 h-40 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
            </div>

            {/* Bank Transfer Summary */}
            <div className="bg-white p-8 rounded-[3rem] border-2 border-blue-100 shadow-xl relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4 text-blue-600">
                  <Smartphone size={24} />
                  <span className="text-sm font-black uppercase tracking-[0.2em]">ยอดเงินโอน</span>
                </div>
                <h3 className="text-5xl font-black text-primary tracking-tighter mb-2">
                  {formatCurrency(stats.transfer)}
                </h3>
                <p className="text-earth/40 font-bold">โอนผ่านธนาคาร/QR</p>
              </div>
              <Smartphone className="absolute -right-8 -bottom-8 text-blue-50 w-40 h-40 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
            </div>
          </div>

          {/* Therapist Breakdown */}
          <div className="bg-white rounded-[3rem] border-2 border-beige/20 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-beige/10 bg-section/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="text-primary" size={28} />
                <h4 className="text-2xl font-serif font-bold text-primary">สรุปยอดตามพนักงาน</h4>
              </div>
              <span className="bg-white px-4 py-1.5 rounded-full text-xs font-black text-primary uppercase tracking-widest border border-beige/20 shadow-sm">
                {stats.staffBreakdown.length} คนทำงานวันนี้
              </span>
            </div>
            
            <div className="divide-y divide-beige/10">
              {stats.staffBreakdown.length === 0 ? (
                <div className="p-20 text-center text-earth/30 font-bold text-xl uppercase tracking-widest">
                  ไม่มีข้อมูลพนักงานในวันนี้
                </div>
              ) : (
                stats.staffBreakdown.map((staff, idx) => (
                  <div key={staff.name} className="p-8 flex items-center justify-between hover:bg-section/10 transition-colors">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl">
                        {idx + 1}
                      </div>
                      <div>
                        <h5 className="text-2xl font-black text-primary">{staff.name}</h5>
                        <p className="text-earth/40 font-bold uppercase tracking-widest text-sm">
                          รับไป {staff.count} คิว
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-primary tracking-tighter">
                        {formatCurrency(staff.revenue)}
                      </p>
                      <p className="text-[10px] font-black text-sage uppercase tracking-[0.2em]">
                        ยอดทำเงินให้ร้าน
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
            <button 
              onClick={handlePrint}
              className="flex items-center justify-center gap-4 bg-white border-4 border-primary text-primary py-8 rounded-[2.5rem] text-2xl font-black hover:bg-primary hover:text-white transition-all shadow-xl active:scale-95"
            >
              <Printer size={32} />
              พิมพ์สรุปยอด
            </button>
            <button 
              onClick={handleSendToLine}
              disabled={sendingLine}
              className="flex items-center justify-center gap-4 bg-[#06C755] text-white py-8 rounded-[2.5rem] text-2xl font-black hover:opacity-90 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
            >
              {sendingLine ? <Loader2 className="animate-spin" size={32} /> : <MessageCircle size={32} />}
              ส่งเข้า LINE เจ้านาย
            </button>
          </div>

          {/* Print-only Footer */}
          <div className="hidden print:block text-center pt-12 border-t-2 border-dashed border-earth/20">
            <p className="text-sm font-bold text-earth/40 uppercase tracking-widest">
              รายงานฉบับนี้พิมพ์เมื่อ {format(new Date(), 'dd/MM/yyyy HH:mm')}
            </p>
            <p className="text-lg font-serif font-bold text-primary mt-2">ขอบคุณที่ร่วมงานกับเราวันนี้ค่ะ</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};
