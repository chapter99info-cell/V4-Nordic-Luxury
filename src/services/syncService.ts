import { apiService } from './api';
import { offlineService } from './offlineService';
import { toast } from 'sonner';

export const syncService = {
  syncOfflineBookings: async () => {
    if (!offlineService.isOnline()) return;

    const offlineBookings = offlineService.getOfflineBookings();
    if (offlineBookings.length === 0) return;

    console.log(`Attempting to sync ${offlineBookings.length} offline bookings...`);
    
    let successCount = 0;
    let failCount = 0;

    for (const booking of offlineBookings) {
      try {
        // Remove the temporary ID and offline flag before sending to API
        const { id, isOffline, ...bookingData } = booking;
        
        // Use a flag or a different method if needed to bypass the offline check in apiService
        // But since we checked isOnline() at the start, apiService.createBooking should work fine
        await apiService.createBooking(bookingData);
        
        // Remove from local storage after successful sync
        offlineService.removeOfflineBooking(id);
        successCount++;
      } catch (error) {
        console.error(`Failed to sync booking ${booking.id}:`, error);
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`ซิงค์ข้อมูลสำเร็จ ${successCount} รายการ`, {
        description: failCount > 0 ? `ล้มเหลว ${failCount} รายการ` : undefined
      });
    } else if (failCount > 0) {
      toast.error(`ไม่สามารถซิงค์ข้อมูลได้ (${failCount} รายการ)`, {
        description: 'กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตอีกครั้ง'
      });
    }
  },

  initSyncListeners: () => {
    window.addEventListener('online', () => {
      console.log('App is back online. Triggering sync...');
      syncService.syncOfflineBookings();
    });

    // Also try to sync on load if online
    if (offlineService.isOnline()) {
      syncService.syncOfflineBookings();
    }
  }
};
