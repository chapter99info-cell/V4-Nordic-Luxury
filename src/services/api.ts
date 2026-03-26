import { Service, Staff, Booking } from '../types';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  limit
} from 'firebase/firestore';
import { shopConfig } from '../config/shopConfig';
import { sendLineNotification } from './notificationService';

/**
 * API Service Layer
 * Using Firestore for real data persistence.
 */

export const apiService = {
  getServices: async (): Promise<Service[]> => {
    const path = 'services';
    try {
      const snapshot = await getDocs(collection(db, path));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return [];
    }
  },

  seedServices: async () => {
    const path = 'services';
    try {
      for (const service of shopConfig.services) {
        const { id, ...data } = service;
        await setDoc(doc(db, path, id), data);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  getStaff: async (): Promise<Staff[]> => {
    const path = 'staff';
    try {
      const snapshot = await getDocs(collection(db, path));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return [];
    }
  },

  seedStaff: async () => {
    const path = 'staff';
    try {
      const staffData: Omit<Staff, 'id'>[] = [
        {
          name: 'Senior Therapist A',
          role: 'Senior Therapist',
          avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200&h=200',
          imageUrl: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200&h=200',
          specialties: ['Remedial', 'Deep Tissue'],
          status: 'Working',
          isActive: true
        },
        {
          name: 'Therapist B',
          role: 'Massage Therapist',
          avatar: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=200&h=200',
          specialties: ['Swedish', 'Aromatherapy'],
          status: 'Working',
          isActive: true
        }
      ];

      for (const s of staffData) {
        // Check if staff already exists by name to avoid duplicates
        const q = query(collection(db, path), where('name', '==', s.name));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          await addDoc(collection(db, path), s);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  getBookings: async (userId?: string): Promise<Booking[]> => {
    const path = 'bookings';
    try {
      let q = query(collection(db, path), orderBy('createdAt', 'desc'));
      if (userId) {
        q = query(collection(db, path), where('clientId', '==', userId), orderBy('createdAt', 'desc'));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return [];
    }
  },

  createBooking: async (booking: Omit<Booking, 'id'>): Promise<Booking> => {
    const path = 'bookings';
    const slotsPath = 'public_slots';
    try {
      // [ป้องกันข้อมูลซ้ำ] เช็คว่ามีการจองชื่อ/เบอร์นี้ ในเวลาเดิมซ้ำไหม (ป้องกันการกดรัว)
      if (booking.clientPhone) {
        const duplicateCheck = query(
          collection(db, path),
          where('clientPhone', '==', booking.clientPhone),
          where('date', '==', booking.date),
          where('startTime', '==', booking.startTime),
          limit(1)
        );
        const dupSnapshot = await getDocs(duplicateCheck);
        if (!dupSnapshot.empty) {
          throw new Error("Duplicate booking detected. Please wait a moment.");
        }
      }

      // 1. Create public slot first to get slotId (avoids updateDoc later)
      let slotId: string | undefined;
      try {
        const slotRef = await addDoc(collection(db, slotsPath), {
          bookingId: 'pending', // Temporary, will update if possible
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status || 'confirmed'
        });
        slotId = slotRef.id;
      } catch (slotErr) {
        console.error("Error creating public slot:", slotErr);
      }

      // 2. Create booking with slotId
      const now = new Date().toISOString();
      const bookingData = {
        ...booking,
        status: booking.status || 'confirmed',
        createdAt: now,
        slotId
      };

      const docRef = await addDoc(collection(db, path), bookingData);
      const createdBooking = { id: docRef.id, ...bookingData } as Booking;

      // 3. Update slot with real bookingId if we have a slotId
      if (slotId) {
        try {
          await updateDoc(doc(db, slotsPath, slotId), { bookingId: docRef.id });
        } catch (updateSlotErr) {
          console.error("Error updating slot with bookingId:", updateSlotErr);
        }
      }

      // 4. Check for returning customer (only if authenticated, otherwise skip to avoid permission error)
      let isReturning = false;
      if (auth.currentUser) {
        try {
          if (booking.clientPhone) {
            const q = query(
              collection(db, path), 
              where('clientPhone', '==', booking.clientPhone),
              limit(2)
            );
            const snapshot = await getDocs(q);
            isReturning = snapshot.size > 1;
            
            if (isReturning) {
              await updateDoc(docRef, { isReturning: true });
              createdBooking.isReturning = true;
            }
          }
        } catch (err) {
          console.error("Error checking returning customer:", err);
        }
      }

      // 5. Trigger Notifications (Background)
      apiService.triggerNotifications(createdBooking, now, isReturning);

      return createdBooking;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  },

  triggerNotifications: async (booking: Booking, timestamp: string, isReturning: boolean = false) => {
    // 1. Send LINE Notification
    if (booking.status === 'confirmed') {
      const lineMessage = `✅ [Booking Confirmed]\n` +
        `Customer: ${booking.clientName}\n` +
        `Phone: ${booking.clientPhone || 'N/A'}\n` +
        `Service: ${booking.serviceName}\n` +
        `Date: ${booking.date}\n` +
        `Time: ${booking.startTime} - ${booking.endTime}\n` +
        `Staff: ${booking.therapistName || 'Any Staff'}\n` +
        `Price: $${booking.price}\n` +
        `Source: ${booking.source || 'Web'}`;
      
      sendLineNotification(lineMessage).catch(err => console.error("LINE notification failed:", err));
    }

    // 2. Call Google Script Webhook via our server proxy
    try {
      const webhookData = {
        booking_id: booking.id,
        timestamp: timestamp,
        name: booking.clientName.trim(),
        phone: (booking.clientPhone || 'N/A').trim(),
        service: booking.serviceName,
        price: booking.price || 0,
        note: (booking.note || (booking.source === 'Web' ? 'Web Booking' : (booking.source || 'N/A'))).trim(),
        appointment: {
          start_time: `${booking.date}T${booking.startTime}:00`,
          duration_min: booking.duration,
          end_with_buffer: `${booking.date}T${booking.endTime}:00`
        },
        customer_info: {
          name: booking.clientName.trim(),
          phone: (booking.clientPhone || 'N/A').trim(),
          email: (booking.clientEmail || 'N/A').trim(),
          is_returning: isReturning
        },
        service_details: {
          service_type: booking.serviceName
        },
        pricing_logic: {
          total_price_inc_gst: booking.price || 0,
          gst_amount: (booking.price || 0) * 0.1,
          deposit: shopConfig.paymentGateway.enableDeposit ? (booking.price * (shopConfig.paymentGateway.depositPercentage / 100)) : 0
        },
        status_management: {
          booking_status: booking.status,
          is_approved: booking.status === 'confirmed',
          is_paid: booking.paymentStatus === 'fully-paid' || booking.paymentStatus === 'deposit-paid',
          source: booking.source || 'Web'
        }
      };

      fetch('/api/webhook/google-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      }).catch(err => console.error("Webhook call failed:", err));
    } catch (webhookErr) {
      console.error("Error preparing webhook data:", webhookErr);
    }
  },

  createManualBlock: async (date: string, startTime: string, duration: number): Promise<void> => {
    const slotsPath = 'public_slots';
    try {
      const [h, m] = startTime.split(':').map(Number);
      const start = new Date();
      start.setHours(h, m, 0, 0);
      const end = new Date(start.getTime() + (duration + 15) * 60000);
      const endTime = `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;

      await addDoc(collection(db, slotsPath), {
        date,
        startTime,
        endTime,
        status: 'blocked',
        isManualBlock: true
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, slotsPath);
    }
  },

  getStats: async () => {
    const path = 'bookings';
    try {
      const snapshot = await getDocs(collection(db, path));
      const bookings = snapshot.docs.map(d => d.data() as Booking);
      
      // คำนวณยอดเงินจริงแยกตามบริการ
      const statsMap = bookings.reduce((acc: any, curr) => {
        const name = curr.serviceName.substring(0, 5);
        if (!acc[name]) acc[name] = { name, amount: 0, customers: 0 };
        acc[name].amount += (curr.price || 0);
        acc[name].customers += 1;
        return acc;
      }, {});

      return Object.values(statsMap);
    } catch (error) {
      return [];
    }
  },

  getRecentBookings: async (limitCount: number = 5): Promise<Booking[]> => {
    const path = 'bookings';
    try {
      const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(limitCount));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return [];
    }
  },

  approveBooking: async (bookingId: string, therapistId?: string, therapistName?: string): Promise<void> => {
    const path = 'bookings';
    try {
      const bookingRef = doc(db, path, bookingId);
      const bookingSnap = await getDoc(bookingRef);
      
      if (!bookingSnap.exists()) throw new Error("Booking not found");
      
      const updateData: any = { 
        status: 'confirmed',
        updatedAt: new Date().toISOString()
      };

      if (therapistId) updateData.therapistId = therapistId;
      if (therapistName) updateData.therapistName = therapistName;

      await updateDoc(bookingRef, updateData);
      
      // Fetch updated booking to trigger notifications
      const updatedSnap = await getDoc(bookingRef);
      const updatedBooking = { id: updatedSnap.id, ...updatedSnap.data() } as Booking;
      
      // Trigger notifications for the newly confirmed booking
      await apiService.triggerNotifications(updatedBooking, updatedBooking.updatedAt || new Date().toISOString());
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  },

  rejectBooking: async (bookingId: string): Promise<void> => {
    const path = 'bookings';
    try {
      const bookingRef = doc(db, path, bookingId);
      await updateDoc(bookingRef, { 
        status: 'cancelled',
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  },

  appendToGoogleSheets: async (sheetPayload: any) => {
    const url = import.meta.env?.VITE_SHEETS_WEBHOOK_URL;
    if (!url) {
      console.info('[appendToGoogleSheets] VITE_SHEETS_WEBHOOK_URL not set; skip.', sheetPayload);
      return { skipped: true };
    }
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sheetPayload),
      });
      if (!res.ok) throw new Error(`Sheets append failed: ${res.status}`);
      return res.json().catch(() => ({}));
    } catch (error) {
      console.error("Error appending to Google Sheets:", error);
      return { error };
    }
  },

  notifyBookingApproved: async (payload: any) => {
    const url = import.meta.env?.VITE_BOOKING_APPROVED_NOTIFY_URL;
    if (!url) {
      console.info('[notifyBookingApproved] VITE_BOOKING_APPROVED_NOTIFY_URL not set; skip.', payload);
      return { skipped: true };
    }
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Approval notify failed: ${res.status}`);
      return res.json().catch(() => ({}));
    } catch (error) {
      console.error("Error notifying booking approval:", error);
      return { error };
    }
  },

  notifyBookingDeclined: async (booking: any) => {
    const url = import.meta.env?.VITE_DECLINE_NOTIFY_URL;
    if (!url) {
      console.info('[notifyBookingDeclined] VITE_DECLINE_NOTIFY_URL not set; skip.', booking);
      return { skipped: true };
    }
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'booking_declined', ...booking }),
      });
      if (!res.ok) throw new Error(`Decline notify failed: ${res.status}`);
      return res.json().catch(() => ({}));
    } catch (error) {
      console.error("Error notifying booking decline:", error);
      return { error };
    }
  },

  fixStaffData: async () => {
    const path = 'staff';
    // Only attempt to fix if user is logged in
    if (!auth.currentUser) return;
    
    try {
      const snapshot = await getDocs(collection(db, path));
      for (const d of snapshot.docs) {
        const data = d.data();
        // ถ้าเป็น Senior Therapist และรูปพัง ให้เอารูปพรีเมียมไปใส่
        if (data.role?.includes('Senior') && (!data.imageUrl || data.imageUrl.includes('unsplash.com/photo-1544161515-4ab6ce6db874'))) {
          await updateDoc(doc(db, path, d.id), {
            imageUrl: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200&h=200',
            avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200&h=200'
          });
          console.log(`Fixed Senior Therapist image data for ${data.name}`);
        }
      }
    } catch (error: any) {
      // Ignore permission errors as they are expected for non-admin users
      if (error?.code === 'permission-denied' || error?.message?.includes('permissions')) {
        return;
      }
      console.error("Error fixing staff data:", error);
    }
  }
};
