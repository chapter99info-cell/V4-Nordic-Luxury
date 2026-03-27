import React, { useState, useEffect } from 'react';
import { 
  collection, query, onSnapshot, orderBy, 
  deleteDoc, doc, addDoc, Timestamp 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { apiService } from '../services/api';
import { Booking, Staff, Service } from '../types';
import { shopConfig } from '../config/shopConfig';
import { format, addMinutes, parse } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Check, X, User, Clock, Calendar as CalendarIcon, AlertCircle, Edit3 } from 'lucide-react';

interface PendingBookingOverlayProps {
  staffList: Staff[];
  services: Service[];
}

export const PendingBookingOverlay: React.FC<PendingBookingOverlayProps> = ({ staffList, services }) => {
  const [queue, setQueue] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<any | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, 'web_bookings'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookings = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setQueue(bookings);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'web_bookings');
    });

    return () => unsubscribe();
  }, []);

  const handleAccept = async (webBooking: any) => {
    setIsProcessing(webBooking.id);
    try {
      const therapistId = selectedStaffId || webBooking.therapistId || 'any';
      const therapist = staffList.find(s => s.id === therapistId);
      
      const startDT = parse(webBooking.startTime || webBooking.start, 'HH:mm', new Date());
      const duration = webBooking.duration || webBooking.durationMinutes || 60;
      const endDT = addMinutes(startDT, duration);

      const bookingData: Omit<Booking, 'id'> = {
        clientName: webBooking.name || webBooking.clientName,
        clientPhone: webBooking.clientPhone || '',
        clientEmail: webBooking.clientEmail || webBooking.email || '',
        serviceName: webBooking.service || webBooking.serviceName,
        serviceId: webBooking.serviceId || '',
        therapistId: therapistId,
        therapistName: therapist?.name || webBooking.therapistName || 'Any Staff',
        date: webBooking.date,
        startTime: webBooking.startTime || webBooking.start,
        endTime: format(endDT, 'HH:mm'),
        duration: duration,
        price: webBooking.price || 0,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        isWalkIn: false,
        clientId: webBooking.clientId || 'web-customer',
        depositPaid: false,
        intakeFormCompleted: false,
        source: 'Website',
        createdAt: new Date().toISOString()
      };

      // 1. Create real booking
      const created = await apiService.createBooking(bookingData);

      // 2. Create cleaning slot
      await addDoc(collection(db, 'bookings'), {
        ...bookingData,
        clientName: 'ทำความสะอาด',
        serviceName: 'Cleaning',
        duration: 15,
        startTime: format(endDT, 'HH:mm'),
        endTime: format(addMinutes(endDT, 15), 'HH:mm'),
        type: 'cleaning',
        source: 'System'
      });

      // 3. Sync to Google Sheets
      await apiService.appendToGoogleSheets({
        date: bookingData.date,
        client: bookingData.clientName,
        phone: bookingData.clientPhone,
        email: bookingData.clientEmail,
        service: bookingData.serviceName,
        price: bookingData.price,
        note: bookingData.note || '',
        status: 'Confirmed',
        source: 'Website',
        timeSlot: `${bookingData.startTime} - ${bookingData.endTime}`,
        therapist: bookingData.therapistName
      });

      // 4. Notify Customer
      await apiService.notifyBookingApproved({
        event: 'booking_approved',
        clientName: bookingData.clientName,
        clientPhone: bookingData.clientPhone,
        clientEmail: bookingData.clientEmail,
        service: bookingData.serviceName,
        date: bookingData.date,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        therapistId: bookingData.therapistId,
        therapistName: bookingData.therapistName,
        shopName: shopConfig.name,
        shopAddress: shopConfig.address,
        shopPhone: shopConfig.phone,
        websiteLink: shopConfig.websiteUrl,
        instagramLink: shopConfig.instagramUrl,
        facebookLink: shopConfig.facebookUrl,
        source: 'Website'
      });

      // 5. Delete from web_bookings
      await deleteDoc(doc(db, 'web_bookings', webBooking.id));
      
      setSelectedStaffId('');
    } catch (error) {
      console.error("Accept Error:", error);
      alert("เกิดข้อผิดพลาดในการอนุมัติคิว");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDecline = async (webBooking: any) => {
    if (!confirm('คุณต้องการปฏิเสธคิวนี้ใช่หรือไม่?')) return;
    
    setIsProcessing(webBooking.id);
    try {
      await apiService.notifyBookingDeclined(webBooking);
      await deleteDoc(doc(db, 'web_bookings', webBooking.id));
    } catch (error) {
      console.error("Decline Error:", error);
      alert("เกิดข้อผิดพลาดในการปฏิเสธคิว");
    } finally {
      setIsProcessing(null);
    }
  };

  if (queue.length === 0) return null;

  const active = queue[0];

  return (
    <div className="fixed bottom-8 right-8 z-[100] w-full max-w-md pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
          className="pointer-events-auto bg-white rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.25)] border border-stone-100 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-[#2D5A27] p-5 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full animate-pulse">
                <Bell size={18} className="text-white" />
              </div>
              <div>
                <span className="font-black uppercase tracking-widest text-[10px] block opacity-60">New Request</span>
                <span className="font-black uppercase tracking-tighter text-sm">Website Booking Inbox</span>
              </div>
            </div>
            <div className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-black">
              {queue.length} PENDING
            </div>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-3xl font-black text-stone-800 uppercase tracking-tighter leading-none">
                  {active.name || active.clientName}
                </h3>
                <p className="text-[#D4A373] font-black text-sm mt-2 uppercase tracking-tight">
                  {active.service || active.serviceName}
                </p>
              </div>
              <div className="bg-stone-50 px-4 py-2 rounded-2xl border border-stone-100 flex flex-col items-center">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Duration</span>
                <span className="text-sm font-black text-stone-700">{active.duration || active.durationMinutes || 60} MIN</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-stone-50/50 p-4 rounded-3xl border border-stone-100">
              <div className="flex items-center gap-3 text-stone-600">
                <div className="bg-white p-2 rounded-xl shadow-sm">
                  <CalendarIcon size={16} className="text-[#D4A373]" />
                </div>
                <span className="text-xs font-black uppercase tracking-tight">{active.date}</span>
              </div>
              <div className="flex items-center gap-3 text-stone-600">
                <div className="bg-white p-2 rounded-xl shadow-sm">
                  <Clock size={16} className="text-[#D4A373]" />
                </div>
                <span className="text-xs font-black uppercase tracking-tight">{active.startTime || active.start}</span>
              </div>
            </div>

            {/* Staff Selection */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2 px-1">
                <User size={12} /> Assign Therapist
              </label>
              <div className="relative">
                <select
                  value={selectedStaffId || active.therapistId || ''}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full bg-white border-2 border-stone-100 rounded-2xl px-5 py-4 text-sm font-black text-stone-700 focus:outline-none focus:border-[#2D5A27] appearance-none transition-all shadow-sm"
                >
                  <option value="">Select Therapist...</option>
                  <option value="any">Any Available Staff</option>
                  {staffList.map(staff => (
                    <option key={staff.id} value={staff.id}>{staff.name}</option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-300">
                  ▼
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-2">
              <button
                disabled={!!isProcessing}
                onClick={() => handleDecline(active)}
                className="flex-1 bg-stone-100 hover:bg-rose-50 hover:text-rose-600 text-stone-400 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <X size={16} /> Decline
              </button>
              <button
                disabled={!!isProcessing}
                onClick={() => handleAccept(active)}
                className="flex-[2] bg-[#2D5A27] hover:bg-[#1f3f1b] text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-[0_15px_30px_-10px_rgba(45,90,39,0.4)] transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                {isProcessing === active.id ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check size={16} /> Confirm & Sync
                  </>
                )}
              </button>
            </div>

            {/* Quick Edit Hint */}
            <p className="text-center text-[9px] font-bold text-stone-300 uppercase tracking-[0.2em]">
              Customer Phone: {active.clientPhone || 'N/A'}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
