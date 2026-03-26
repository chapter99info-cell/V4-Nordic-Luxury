import React, { useState, useEffect } from 'react';
import { 
  collection, query, onSnapshot, where, 
  addDoc, deleteDoc, doc 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { apiService } from '../services/api';
import { format, addMinutes, parse } from 'date-fns';
import { Booking, Staff, Service } from '../types';
import { shopConfig } from '../config/shopConfig';
import { PendingBookingOverlay } from './PendingBookingOverlay';

// ---------------------------------------------------------
// 1. Configuration & Styling Palette (Nordic Luxury)
// ---------------------------------------------------------
const operatingHours = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

const palette = {
  bg: 'bg-[#FAF9F6]',          // Warm Beige
  headerText: 'text-[#2D5A27]', // Deep Forest/Teal
  text: 'text-stone-800',      // Charcoal
  emptySlot: 'bg-white/50 border-stone-200',
  booked: {
    teal: 'bg-[#A8D1D1] text-[#1D3535] border-[#86B3B3]',
    rose: 'bg-[#E29578] text-white border-[#C87E62]',
    sage: 'bg-[#B4C2A8] text-[#2F3E26] border-[#97A689]',
    ochre: 'bg-[#D4A373] text-white border-[#B5895D]',
  },
  cleaning: 'bg-[#E9C46A] text-[#5E4E29] border-[#D4B358]'
};

import { StaffNotificationTrigger } from './StaffNotificationTrigger';
import { StaffMobileAlert } from './StaffMobileAlert';

// ---------------------------------------------------------
// 2. Component หลัก: V4 Dashboard (Nordic Edition)
// ---------------------------------------------------------
interface V4DashboardProps {
  user: any;
  role: string | null;
}

export const V4Dashboard: React.FC<V4DashboardProps> = ({ user, role }) => {
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  // Modals State
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSignalCenter, setShowSignalCenter] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState({ staffId: '', staffName: '', time: '' }); 
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Real-time Data Sync จาก Firebase
  useEffect(() => {
    if (!user) return;

    const today = format(new Date(), 'yyyy-MM-dd');

    // ดึงข้อมูลพนักงาน
    const unsubStaff = onSnapshot(query(collection(db, 'staff'), where('isActive', '==', true)), (snap) => {
      setStaffList(snap.docs.map(d => ({ id: d.id, ...d.data() } as Staff)));
    });

    // ดึงข้อมูลบริการ
    const unsubServices = onSnapshot(collection(db, 'services'), (snap) => {
      setServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Service)));
    });

    // ดึงข้อมูลการจองของวันนี้
    const unsubBookings = onSnapshot(
      query(collection(db, 'bookings'), where('date', '==', today), where('status', '!=', 'cancelled')),
      (snap) => {
        setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking)));
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'bookings');
      }
    );

    return () => { unsubStaff(); unsubServices(); unsubBookings(); };
  }, [user, role]);

  // 2. Handlers สำหรับ Walk-in และ Cancel
  const handleOpenWalkIn = (staffId: string, staffName: string, time: string) => {
    setSelectedSlot({ staffId, staffName, time });
    setShowWalkInModal(true);
  };

  const handleOpenCancel = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  const confirmWalkIn = async () => {
    if (!selectedService) return alert('กรุณาเลือกบริการก่อนค่ะ');
    setIsSubmitting(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const startDT = parse(selectedSlot.time, 'HH:mm', new Date());
      const endDT = addMinutes(startDT, selectedService.duration);
      
      const newBookingData: Omit<Booking, 'id'> = {
        shopId: shopConfig.shopId,
        clientName: `Walk-in (${format(new Date(), 'HH:mm')})`,
        serviceName: selectedService.name,
        serviceId: selectedService.id,
        therapistId: selectedSlot.staffId,
        therapistName: selectedSlot.staffName,
        date: today,
        startTime: selectedSlot.time,
        endTime: format(endDT, 'HH:mm'),
        duration: selectedService.duration,
        price: selectedService.fullPrice,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        isWalkIn: true,
        clientId: 'walk-in',
        depositPaid: false,
        intakeFormCompleted: false,
        source: 'Walk-in',
        createdAt: new Date().toISOString()
      };

      // บันทึกคิวลูกค้า
      await apiService.createBooking(newBookingData);
      
      // บันทึกคิวทำความสะอาดอัตโนมัติ (15 นาที)
      await addDoc(collection(db, 'bookings'), {
        ...newBookingData,
        clientName: 'ทำความสะอาด',
        serviceName: 'Cleaning',
        duration: 15,
        startTime: format(endDT, 'HH:mm'),
        endTime: format(addMinutes(endDT, 15), 'HH:mm'),
        type: 'cleaning',
        source: 'System'
      });

      setShowWalkInModal(false);
      setSelectedService(null);
      alert('บันทึกคิวสำเร็จ!');
    } catch (e) { 
      console.error("Booking Error:", e);
      alert("เกิดข้อผิดพลาดในการบันทึกคิว");
    }
    setIsSubmitting(false);
  };

  const deleteBooking = async () => {
    if (!selectedBooking) return;
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, 'bookings', selectedBooking.id));
      setShowCancelModal(false);
      alert('ลบคิวสำเร็จ!');
    } catch (e) { 
      console.error("Delete Error:", e);
      alert("ไม่สามารถลบคิวได้");
    }
    setIsSubmitting(false);
  };

  // ---------------------------------------------------------
  // LOADING STATE
  // ---------------------------------------------------------
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D5A27]"></div>
          <p className="text-[#2D5A27] font-black tracking-widest uppercase text-sm">Loading Mira Royale...</p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // MAIN RENDER
  // ---------------------------------------------------------
  return (
    <div className={`min-h-screen ${palette.bg} p-6 font-sans ${palette.text}`}>
      
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div className="text-center md:text-left">
          <h1 className={`text-5xl font-black tracking-tighter ${palette.headerText} uppercase`}>
            Mira Royale
          </h1>
          <p className="text-stone-400 font-bold tracking-[0.2em] uppercase text-xs mt-1">
            {format(new Date(), 'EEEE, d MMMM yyyy')}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={() => setShowSignalCenter(true)}
            className="bg-[#006D77] hover:bg-[#005a63] text-white px-8 py-4 rounded-full font-black text-sm shadow-lg shadow-[#006D77]/20 transition-all active:scale-95"
          >
            SIGNAL CENTER
          </button>
          <button 
            onClick={() => setShowMobilePreview(true)}
            className="bg-stone-100 hover:bg-stone-200 text-stone-600 px-8 py-4 rounded-full font-black text-sm transition-all active:scale-95"
          >
            MOBILE PREVIEW
          </button>
          <button 
            onClick={() => handleOpenWalkIn('', 'Unassigned', format(new Date(), 'HH:mm'))}
            className="bg-[#D4A373] hover:bg-[#B5895D] text-white px-8 py-4 rounded-full font-black text-sm shadow-[0_15px_30px_-10px_rgba(212,163,115,0.5)] transition-all active:scale-95"
          >
            + WALK-IN NOW
          </button>
        </div>
      </header>

      {/* DASHBOARD GRID */}
      <div className="bg-white rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] overflow-hidden border border-stone-100">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="min-w-[1200px]">
            
            {/* TIMELINE HEADER */}
            <div className="flex bg-[#F1F0E8] border-b border-stone-100">
              <div className="w-64 p-8 border-r border-stone-200/60 sticky left-0 bg-[#F1F0E8] z-20 font-black text-stone-400 uppercase tracking-widest text-center text-sm">
                Therapist
              </div>
              {operatingHours.map(time => (
                <div key={time} className="flex-1 p-8 text-center font-black text-stone-500 border-r border-stone-200/30 text-lg">
                  {time}
                </div>
              ))}
            </div>

            {/* STAFF DATA ROWS */}
            {staffList.map((staff, idx) => (
              <div key={staff.id} className="flex border-b border-stone-50 group transition-colors hover:bg-stone-50/30">
                <div className="w-64 p-8 border-r border-stone-200/60 sticky left-0 bg-white z-10 font-black text-2xl flex items-center justify-center group-hover:bg-stone-50/80 transition-colors">
                  {staff.name}
                </div>
                
                {operatingHours.map(time => {
                  const active = bookings.find(b => b.therapistId === staff.id && b.startTime <= time && b.endTime > time);
                  
                  return (
                    <div key={time} className="flex-1 h-44 p-3 border-r border-stone-50/50 relative">
                      {active ? (
                        <div 
                          onClick={() => handleOpenCancel(active)}
                          className={`w-full h-full rounded-[1.5rem] border-2 p-4 flex flex-col justify-center items-center cursor-pointer transition-all hover:scale-[1.03] hover:shadow-xl
                            ${(active as any).type === 'cleaning' ? palette.cleaning : (idx % 2 === 0 ? palette.booked.teal : palette.booked.rose)}
                          `}
                        >
                          <span className="font-black text-xl text-center leading-none uppercase tracking-tight">
                            {active.clientName}
                            {active.status === 'pending' && (
                              <span className="block text-[8px] mt-1 bg-white/40 px-2 py-0.5 rounded-full animate-pulse">PENDING APPROVAL</span>
                            )}
                          </span>
                          <div className="mt-3 px-3 py-1 bg-white/20 rounded-full text-[10px] font-black tracking-widest uppercase">
                            {active.startTime} - {active.endTime}
                          </div>
                        </div>
                      ) : (
                        <div 
                          onClick={() => handleOpenWalkIn(staff.id, staff.name, time)}
                          className="w-full h-full rounded-[1.5rem] border-2 border-dashed border-stone-100 hover:border-[#D4A373] hover:bg-[#FAF9F6] flex items-center justify-center cursor-pointer group/slot transition-all"
                        >
                          <span className="text-4xl text-stone-200 group-hover/slot:text-[#D4A373] group-hover/slot:scale-125 transition-all font-light">
                            +
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER NOTE */}
      <footer className="mt-8 text-center text-stone-400 font-bold text-xs uppercase tracking-[0.3em]">
        Mira Royale Management System V4 • Premium Edition
      </footer>

      {/* MODAL: WALK-IN */}
      {showWalkInModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xl flex justify-center items-center p-6 z-50 animate-in fade-in duration-300">
          <div className="bg-[#FAF9F6] rounded-[3.5rem] w-full max-w-2xl overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border border-white">
            <div className="bg-[#2D5A27] p-12 text-white text-center">
              <h2 className="text-5xl font-black uppercase tracking-tighter italic">New Booking</h2>
              <p className="opacity-60 font-black uppercase tracking-widest text-xs mt-3">
                Assigning to {selectedSlot.staffName} at {selectedSlot.time}
              </p>
            </div>
            
            <div className="p-12 space-y-10">
              <div className="grid grid-cols-2 gap-5">
                {services.map(srv => (
                  <button 
                    key={srv.id}
                    onClick={() => setSelectedService(srv)}
                    className={`p-8 rounded-[2rem] border-4 transition-all duration-300 flex flex-col items-center gap-1 ${
                      selectedService?.id === srv.id 
                        ? 'bg-[#D4A373] border-[#B5895D] text-white scale-105 shadow-2xl' 
                        : 'bg-white border-stone-50 text-stone-800 hover:border-stone-200'
                    }`}
                  >
                    <span className="text-2xl font-black uppercase tracking-tight">{srv.name}</span>
                    <span className="text-xs font-black opacity-60 uppercase tracking-widest">
                      {srv.duration} MIN • ${srv.fullPrice}
                    </span>
                  </button>
                ))}
              </div>
              
              <div className="space-y-4">
                <button 
                  disabled={!selectedService || isSubmitting}
                  onClick={confirmWalkIn}
                  className="w-full bg-[#2D5A27] text-white text-2xl font-black py-8 rounded-[2rem] shadow-2xl hover:bg-[#1f3f1b] transition-all disabled:bg-stone-200 active:scale-95"
                >
                  {isSubmitting ? 'PROCESSING...' : 'CONFIRM RESERVATION'}
                </button>
                <button 
                  onClick={() => setShowWalkInModal(false)} 
                  className="w-full text-stone-400 font-black uppercase tracking-widest text-xs py-2"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CANCEL/DELETE */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-stone-900/70 backdrop-blur-2xl flex justify-center items-center p-6 z-50 animate-in zoom-in-95 duration-300">
          <div className="bg-white rounded-[3.5rem] w-full max-w-md p-12 shadow-2xl text-center border-[6px] border-stone-50">
            <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
              <span className="text-rose-500 text-5xl font-black">!</span>
            </div>
            <h2 className="text-3xl font-black text-stone-800 uppercase tracking-tighter mb-3">Delete Appointment</h2>
            <p className="text-stone-500 font-bold mb-10 leading-relaxed">
              Are you sure you want to remove <br/>
              <span className="text-[#D4A373] text-2xl font-black uppercase tracking-tight italic">
                {selectedBooking?.clientName}
              </span>
              <br/>จากสมุดคิวของคุณ?
            </p>
            <div className="space-y-4">
              <button 
                onClick={deleteBooking}
                disabled={isSubmitting}
                className="w-full bg-rose-600 text-white text-xl font-black py-7 rounded-[2rem] shadow-xl hover:bg-rose-700 transition-all active:scale-95"
              >
                {isSubmitting ? 'REMOVING...' : 'YES, REMOVE NOW'}
              </button>
              <button 
                onClick={() => setShowCancelModal(false)} 
                className="w-full text-stone-400 font-black uppercase tracking-widest text-xs py-2"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SIGNAL CENTER */}
      {showSignalCenter && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xl flex justify-center items-center p-6 z-50 animate-in fade-in duration-300">
          <div className="w-full max-w-lg relative">
            <button 
              onClick={() => setShowSignalCenter(false)}
              className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xl text-stone-400 hover:text-stone-800 transition-all z-10"
            >
              ✕
            </button>
            <StaffNotificationTrigger />
          </div>
        </div>
      )}

      {/* MODAL: MOBILE PREVIEW */}
      {showMobilePreview && (
        <StaffMobileAlert 
          staffName="Mina"
          serviceName="60-min Oil Massage"
          startTime="14:30"
          onAcknowledge={() => console.log("Acknowledged")}
          onHeadingBack={() => console.log("Heading Back")}
          onClose={() => setShowMobilePreview(false)}
        />
      )}

      {/* REAL-TIME WEBSITE BOOKING OVERLAY */}
      <PendingBookingOverlay staffList={staffList} services={services} />

    </div>
  );
};

export default V4Dashboard;

