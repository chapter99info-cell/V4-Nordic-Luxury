import { toast } from 'sonner';
import { Booking, Staff, Service } from '../types';

const OFFLINE_BOOKINGS_KEY = 'offline_bookings';
const CACHED_STAFF_KEY = 'cached_staff';
const CACHED_SERVICES_KEY = 'cached_services';

export const offlineService = {
  isOnline: (): boolean => {
    return window.navigator.onLine;
  },

  cacheStaff: (staff: Staff[]) => {
    localStorage.setItem(CACHED_STAFF_KEY, JSON.stringify(staff));
  },

  getCachedStaff: (): Staff[] => {
    const cached = localStorage.getItem(CACHED_STAFF_KEY);
    return cached ? JSON.parse(cached) : [];
  },

  cacheServices: (services: Service[]) => {
    localStorage.setItem(CACHED_SERVICES_KEY, JSON.stringify(services));
  },

  getCachedServices: (): Service[] => {
    const cached = localStorage.getItem(CACHED_SERVICES_KEY);
    return cached ? JSON.parse(cached) : [];
  },

  saveBookingOffline: (booking: Omit<Booking, 'id'>) => {
    try {
      const existing = localStorage.getItem(OFFLINE_BOOKINGS_KEY);
      const bookings = existing ? JSON.parse(existing) : [];
      
      // Add a temporary ID for tracking
      const offlineBooking = {
        ...booking,
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        isOffline: true,
        createdAt: new Date().toISOString()
      };
      
      bookings.push(offlineBooking);
      localStorage.setItem(OFFLINE_BOOKINGS_KEY, JSON.stringify(bookings));
      
      toast.warning('บันทึกออฟไลน์แล้ว กรุณาต่อเน็ตเพื่อซิงค์ข้อมูล', {
        duration: 5000,
        description: 'ข้อมูลจะถูกส่งไปยังเซิร์ฟเวอร์โดยอัตโนมัติเมื่อคุณเชื่อมต่ออินเทอร์เน็ต'
      });
      
      return offlineBooking;
    } catch (error) {
      console.error('Error saving offline booking:', error);
      toast.error('ไม่สามารถบันทึกข้อมูลออฟไลน์ได้');
      throw error;
    }
  },

  getOfflineBookings: (): (Omit<Booking, 'id'> & { id: string; isOffline: boolean })[] => {
    try {
      const existing = localStorage.getItem(OFFLINE_BOOKINGS_KEY);
      return existing ? JSON.parse(existing) : [];
    } catch (error) {
      console.error('Error getting offline bookings:', error);
      return [];
    }
  },

  removeOfflineBooking: (id: string) => {
    try {
      const existing = localStorage.getItem(OFFLINE_BOOKINGS_KEY);
      if (!existing) return;
      
      const bookings = JSON.parse(existing);
      const filtered = bookings.filter((b: any) => b.id !== id);
      localStorage.setItem(OFFLINE_BOOKINGS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing offline booking:', error);
    }
  },

  clearOfflineBookings: () => {
    localStorage.removeItem(OFFLINE_BOOKINGS_KEY);
  }
};
