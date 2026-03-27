import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  PointerSensor, 
  TouchSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent,
  DragStartEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { doc, updateDoc, collection, query, onSnapshot, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Booking, Staff } from '../types';
import { format, addMinutes } from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Loader2, 
  Clock, 
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock3,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useDraggable, useDroppable } from '@dnd-kit/core';

// Configuration
const START_HOUR = 9;
const END_HOUR = 22;
const SLOT_DURATION = 30; // minutes

// Generate time slots
const TIME_SLOTS = Array.from({ length: (END_HOUR - START_HOUR) * (60 / SLOT_DURATION) + 1 }, (_, i) => {
  const totalMinutes = i * SLOT_DURATION;
  const hours = Math.floor(totalMinutes / 60) + START_HOUR;
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
});

interface AdminCalendarProps {
  onQuickAdd?: () => void;
  config?: any;
}

export default function AdminCalendar({ onQuickAdd, config }: AdminCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [confirmMove, setConfirmMove] = useState<{
    booking: Booking;
    newStaffId: string;
    newTime: string;
  } | null>(null);

  // Sensors for Desktop and iPad/Mobile
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Avoid accidental drags
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Long press for touch
        tolerance: 5,
      },
    })
  );

  // Fetch Staff
  useEffect(() => {
    const q = query(
      collection(db, 'staff'), 
      where('isActive', '==', true),
      where('shopId', '==', config?.shopId || 'SHOP01')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff)));
    });
    return () => unsubscribe();
  }, [config?.shopId]);

  // Fetch Bookings
  useEffect(() => {
    const path = 'bookings';
    const q = query(
      collection(db, path),
      where('date', '==', format(selectedDate, 'yyyy-MM-dd')),
      where('shopId', '==', config?.shopId || 'SHOP01')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return () => unsubscribe();
  }, [selectedDate]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const bookingId = active.id as string;
    const [overStaffId, overTime] = (over.id as string).split('|');
    
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    // Check if anything actually changed
    if (booking.therapistId === overStaffId && booking.startTime === overTime) return;

    setConfirmMove({
      booking,
      newStaffId: overStaffId,
      newTime: overTime
    });
  };

  const executeMove = async () => {
    if (!confirmMove) return;
    const { booking, newStaffId, newTime } = confirmMove;
    setConfirmMove(null);
    setIsUpdating(true);

    try {
      const newStaff = staff.find(s => s.id === newStaffId);
      const bookingRef = doc(db, 'bookings', booking.id!);
      
      const [h, m] = newTime.split(':').map(Number);
      const endTotalMinutes = h * 60 + m + booking.duration;
      const endH = Math.floor(endTotalMinutes / 60);
      const endM = endTotalMinutes % 60;
      const newEndTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

      await updateDoc(bookingRef, {
        therapistId: newStaffId,
        therapistName: newStaff?.name || booking.therapistName,
        startTime: newTime,
        endTime: newEndTime
      });

      toast.success('ย้ายคิวสำเร็จแล้วค่ะ', {
        icon: <CheckCircle2 className="text-emerald-500" size={18} />,
        className: 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold'
      });
    } catch (error) {
      console.error("Failed to update booking", error);
      toast.error('เกิดข้อผิดพลาดในการย้ายคิวค่ะ');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'pending':
      case 'payment_pending':
        return 'bg-amber-100 border-amber-300 text-amber-900';
      case 'confirmed':
        return 'bg-blue-100 border-blue-300 text-blue-900';
      case 'completed':
        return 'bg-emerald-100 border-emerald-300 text-emerald-900';
      case 'cancelled':
        return 'bg-rose-50 border-rose-200 text-rose-400';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-900';
    }
  };

  const getStatusIcon = (status: Booking['status']) => {
    switch (status) {
      case 'pending':
      case 'payment_pending':
        return <Clock3 size={12} />;
      case 'confirmed':
        return <CheckCircle2 size={12} />;
      case 'completed':
        return <CheckCircle2 size={12} className="fill-emerald-500 text-white" />;
      case 'cancelled':
        return <XCircle size={12} />;
      default:
        return <AlertCircle size={12} />;
    }
  };

  return (
    <div className="relative min-h-[80vh] pb-24">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-4xl font-serif font-bold text-primary mb-2">ตารางนัดหมายค่ะ</h2>
          <p className="text-earth/50 text-sm font-medium">จัดการคิวงานและพนักงานแบบเรียลไทม์ค่ะ</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded-[2rem] border-2 border-beige/20 shadow-xl">
          <button 
            onClick={() => setSelectedDate(new Date())}
            className="px-6 py-2 rounded-full bg-section text-primary font-black text-xs uppercase tracking-widest hover:bg-beige/30 transition-all"
          >
            วันนี้ค่ะ
          </button>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setSelectedDate(prev => addMinutes(prev, -1440))}
              className="p-3 rounded-full hover:bg-section transition-all text-primary"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="flex flex-col items-center px-4 min-w-[160px]">
              <span className="text-xl font-black text-primary uppercase tracking-tighter">
                {format(selectedDate, 'EEEE, d MMM')}
              </span>
              <span className="text-[10px] font-bold text-sage uppercase tracking-[0.2em]">
                {format(selectedDate, 'yyyy')}
              </span>
            </div>
            <button 
              onClick={() => setSelectedDate(prev => addMinutes(prev, 1440))}
              className="p-3 rounded-full hover:bg-section transition-all text-primary"
            >
              <ChevronRight size={24} />
            </button>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="p-3 rounded-full hover:bg-section transition-all text-primary/40 hover:text-primary"
            title="รีเฟรชหน้าจอค่ะ"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Status Legend */}
      <div className="flex flex-wrap items-center gap-6 mb-6 px-4 py-3 bg-white/50 backdrop-blur-sm rounded-3xl border border-beige/10">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-amber-100 border border-amber-300" />
          <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">รอยืนยันค่ะ</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-100 border border-blue-300" />
          <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">ยืนยันแล้วค่ะ</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-emerald-100 border border-emerald-300" />
          <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">เสร็จสิ้นค่ะ</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-rose-50 border border-rose-200" />
          <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">ยกเลิกค่ะ</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-[3rem] border-2 border-beige/20 shadow-2xl overflow-hidden relative">
        {isUpdating && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-[100] flex items-center justify-center">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-4 border border-beige/20"
            >
              <Loader2 className="animate-spin text-primary" size={40} />
              <p className="font-black text-primary text-sm uppercase tracking-[0.2em]">กำลังอัปเดตข้อมูล...</p>
            </motion.div>
          </div>
        )}

        <DndContext 
          sensors={sensors} 
          onDragStart={handleDragStart} 
          onDragEnd={handleDragEnd}
          modifiers={[restrictToWindowEdges]}
        >
          <div className="overflow-x-auto no-scrollbar">
            <div className="min-w-[1000px]">
              {/* Staff Headers */}
              <div className="grid grid-cols-[120px_repeat(auto-fill,minmax(200px,1fr))] border-b-2 border-beige/10 sticky top-0 bg-white z-40">
                <div className="p-6 bg-section/20 border-r-2 border-beige/10 flex items-center justify-center">
                  <Clock className="text-primary/40" size={24} />
                </div>
                {staff.map(s => (
                  <div key={s.id} className="p-6 text-center border-r-2 border-beige/10 last:border-r-0 bg-white">
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <img 
                          src={
                            s.imageUrl || 
                            s.avatar || 
                            (s.name.toLowerCase().includes('senior') 
                              ? '/image_d57467.png' 
                              : 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=200&h=200')
                          } 
                          alt={s.name} 
                          className="w-14 h-14 rounded-2xl object-cover ring-4 ring-primary/5 shadow-md"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-primary leading-none mb-1">{s.name}</h4>
                        <p className="text-[9px] text-sage font-bold uppercase tracking-widest opacity-60">{s.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Time Grid */}
              <div className="relative">
                {TIME_SLOTS.map((time) => (
                  <div key={time} className="grid grid-cols-[120px_repeat(auto-fill,minmax(200px,1fr))] h-20 border-b border-beige/10 last:border-b-0 group">
                    {/* Time Label */}
                    <div className="p-4 flex items-center justify-center border-r-2 border-beige/10 bg-section/5 sticky left-0 z-30">
                      <span className="text-lg font-black text-primary tracking-tighter">
                        {time}
                      </span>
                    </div>

                    {/* Staff Columns */}
                    {staff.map(s => (
                      <DroppableCell 
                        key={`${s.id}-${time}`} 
                        id={`${s.id}|${time}`}
                      >
                        {/* Render Booking if it starts at this time */}
                        {bookings
                          .filter(b => b.therapistId === s.id && b.startTime === time && b.status !== 'cancelled')
                          .map(booking => (
                            <DraggableBooking 
                              key={booking.id} 
                              booking={booking} 
                              getStatusColor={getStatusColor}
                              getStatusIcon={getStatusIcon}
                            />
                          ))
                        }
                      </DroppableCell>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Drag Overlay for smooth visual feedback */}
          <DragOverlay dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: '0.4',
                },
              },
            }),
          }}>
            {activeId ? (
              <div className="opacity-80 scale-105 pointer-events-none">
                {(() => {
                  const booking = bookings.find(b => b.id === activeId);
                  if (!booking) return null;
                  return (
                    <div className={`rounded-2xl p-4 shadow-2xl border-2 w-[190px] ${getStatusColor(booking.status)}`}>
                      <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">
                        {booking.startTime} - {booking.endTime}
                      </p>
                      <h5 className="text-sm font-black leading-tight mb-1">{booking.clientName}</h5>
                      <p className="text-[9px] font-bold uppercase tracking-widest opacity-80">
                        {booking.serviceName}
                      </p>
                    </div>
                  );
                })()}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={onQuickAdd}
        className="fixed bottom-10 right-10 w-20 h-20 bg-primary text-white rounded-full shadow-[0_20px_50px_rgba(74,93,35,0.4)] flex items-center justify-center z-50 group border-4 border-white"
      >
        <Plus size={40} strokeWidth={3} />
        <span className="absolute -top-12 right-0 bg-primary text-white text-[10px] font-black px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
          WALK-IN ด่วนค่ะ
        </span>
      </motion.button>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {confirmMove && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setConfirmMove(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl relative z-10 border border-beige/20"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CalendarIcon className="text-primary" size={32} />
              </div>
              <h3 className="text-2xl font-serif font-bold text-primary text-center mb-2">ยืนยันการย้ายคิวไหมคะ?</h3>
              <p className="text-earth/60 text-center text-sm mb-8 leading-relaxed">
                คุณกำลังจะย้ายคิวของ <span className="font-bold text-primary">{confirmMove.booking.clientName}</span><br />
                ไปยังเวลา <span className="font-bold text-primary">{confirmMove.newTime} ค่ะ</span>
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setConfirmMove(null)}
                  className="flex-1 py-4 rounded-full font-bold text-earth hover:bg-section transition-all"
                >
                  ยกเลิกค่ะ
                </button>
                <button 
                  onClick={executeMove}
                  className="flex-1 bg-primary text-white py-4 rounded-full font-bold shadow-lg shadow-primary/20 hover:bg-sage transition-all"
                >
                  ยืนยันค่ะ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Helper Components ---

function DroppableCell({ id, children }: { id: string; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div 
      ref={setNodeRef}
      className={`relative border-r border-beige/10 last:border-r-0 p-1 transition-colors ${
        isOver ? 'bg-primary/10 ring-2 ring-primary/20 ring-inset' : 'group-hover:bg-section/5'
      }`}
    >
      {children}
    </div>
  );
}

function DraggableBooking({ 
  booking, 
  getStatusColor, 
  getStatusIcon 
}: { 
  booking: Booking; 
  getStatusColor: (s: Booking['status']) => string;
  getStatusIcon: (s: Booking['status']) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: booking.id!,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  // Calculate height based on duration (30 mins = 1 slot = 80px height)
  // We use absolute positioning to span multiple slots
  const height = (booking.duration / 30) * 80 - 8; // -8 for padding

  return (
    <div
      ref={setNodeRef}
      style={{ 
        ...style, 
        height: `${height}px`,
        touchAction: 'none' // CRITICAL for iPad dragging
      }}
      {...listeners}
      {...attributes}
      className={`absolute inset-x-1 z-20 cursor-grab active:cursor-grabbing transition-shadow ${
        isDragging ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`h-full w-full rounded-2xl p-3 shadow-md border-2 flex flex-col justify-between overflow-hidden ${getStatusColor(booking.status)}`}
      >
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-1">
            <p className="text-[9px] font-black uppercase tracking-widest opacity-60 truncate">
              {booking.startTime} - {booking.endTime}
            </p>
            <div className="flex-shrink-0">
              {getStatusIcon(booking.status)}
            </div>
          </div>
          <h5 className="text-[11px] font-black leading-tight line-clamp-2">{booking.clientName}</h5>
        </div>
        
        <div className="flex items-center justify-between mt-auto pt-1 border-t border-current/10">
          <p className="text-[8px] font-bold uppercase tracking-widest opacity-70 truncate">
            {booking.serviceName}
          </p>
          {booking.isWalkIn && (
            <span className="bg-white/40 px-1.5 py-0.5 rounded text-[7px] font-black uppercase">Walk-in</span>
          )}
        </div>
      </motion.div>
    </div>
  );
}
