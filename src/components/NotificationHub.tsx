import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { 
  collection, query, where, onSnapshot, 
  orderBy, limit, updateDoc, doc, deleteDoc, 
  Timestamp, addDoc 
} from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';
import { db, auth, messaging } from '../firebase';
import { AppNotification } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export const NotificationHub: React.FC = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
      setNotifications(docs);
      setUnreadCount(docs.filter(n => !n.isRead).length);

      // Real-time Toast for new unread notifications
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data() as AppNotification;
          if (!data.isRead) {
            toast.success(data.title, {
              description: data.message,
              icon: <Bell className="text-primary" size={16} />,
            });
          }
        }
      });
    });

    // Setup FCM
    const setupFCM = async () => {
      try {
        if (!messaging) return;
        // Use window.Notification to avoid conflict with AppNotification interface
        if (!('Notification' in window)) return;
        
        const permission = await window.Notification.requestPermission();
        if (permission === 'granted') {
          const token = await getToken(messaging, {
            vapidKey: 'YOUR_VAPID_KEY' // User will need to provide this in settings
          });
          if (token) {
            await updateDoc(doc(db, 'users', auth.currentUser!.uid), {
              fcmToken: token
            });
          }
        }
      } catch (err) {
        console.error('FCM Setup Error:', err);
      }
    };

    setupFCM();

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { isRead: true });
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    await Promise.all(unread.map(n => updateDoc(doc(db, 'notifications', n.id), { isRead: true })));
  };

  const deleteNotification = async (id: string) => {
    await deleteDoc(doc(db, 'notifications', id));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full bg-white border border-beige/30 text-earth/40 hover:text-primary transition-all"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 bg-white rounded-3xl border border-beige/20 shadow-xl z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-beige/10 flex items-center justify-between bg-section/30">
              <h3 className="font-serif font-bold text-primary">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-earth/30 space-y-2">
                  <Bell size={32} className="mx-auto opacity-20" />
                  <p className="text-xs">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-beige/5">
                  {notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`p-4 hover:bg-section/20 transition-colors relative group ${!n.isRead ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!n.isRead ? 'bg-primary' : 'bg-transparent'}`} />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-bold text-earth/90">{n.title}</p>
                          <p className="text-xs text-earth/60 leading-relaxed">{n.message}</p>
                          <p className="text-[10px] text-earth/30">
                            {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleTimeString() : 'Just now'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!n.isRead && (
                          <button 
                            onClick={() => markAsRead(n.id)}
                            className="p-1.5 bg-white border border-beige/20 rounded-lg text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                          >
                            <Check size={12} />
                          </button>
                        )}
                        <button 
                          onClick={() => deleteNotification(n.id)}
                          className="p-1.5 bg-white border border-beige/20 rounded-lg text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 bg-section/10 text-center border-t border-beige/10">
              <button className="text-[10px] font-bold text-earth/40 uppercase tracking-widest hover:text-primary transition-all">
                View all history
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
