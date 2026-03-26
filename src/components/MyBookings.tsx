import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { Booking } from '../types';
import { format } from 'date-fns';
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { LoyaltyCard } from './LoyaltyCard';
import { useTranslation } from '../i18n/I18nContext';
import { formatCurrency, formatDate, formatTime } from '../lib/formatters';

export const MyBookings = () => {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const path = 'bookings';
    const q = query(
      collection(db, path),
      where('clientId', '==', auth.currentUser.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      setLoading(false);
    });

    // Fetch loyalty points
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribeUser = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setLoyaltyPoints(doc.data().loyaltyPoints || 0);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeUser();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!auth.currentUser) {
    return (
      <div className="py-20 text-center bg-section/30 rounded-[3rem] border-2 border-dashed border-beige/40">
        <p className="text-earth/40 text-sm italic">Please login to view your bookings.</p>
        <button 
          onClick={() => window.location.href = '/login'}
          className="mt-4 px-6 py-2 bg-primary text-white rounded-full text-sm font-bold"
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-serif font-bold text-primary mb-2">{t('common.my_bookings')}</h2>
          <p className="text-earth/50 text-sm">View and manage your upcoming and past sessions.</p>
        </div>
      </div>

      {/* Loyalty Card Section */}
      <div className="max-w-md">
        <LoyaltyCard points={loyaltyPoints} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bookings.map((booking) => (
          <div key={booking.id} className="bg-white rounded-[2.5rem] border border-beige/20 p-8 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h4 className="text-xl font-serif font-bold text-primary group-hover:text-sage transition-colors">{booking.serviceName}</h4>
                <p className="text-[10px] text-sage font-bold uppercase tracking-[0.2em] mt-1">{booking.duration} Min Session</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${
                booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 
                booking.status === 'cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
              }`}>
                {booking.status.replace(/-/g, ' ')}
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-earth/60">
                <div className="w-8 h-8 rounded-full bg-section flex items-center justify-center text-sage">
                  <Calendar size={16} />
                </div>
                <span className="text-sm font-medium">{formatDate(booking.date)}</span>
              </div>
              <div className="flex items-center gap-3 text-earth/60">
                <div className="w-8 h-8 rounded-full bg-section flex items-center justify-center text-sage">
                  <Clock size={16} />
                </div>
                <span className="text-sm font-medium">{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
              </div>
              <div className="flex items-center gap-3 text-earth/60">
                <div className="w-8 h-8 rounded-full bg-section flex items-center justify-center text-sage">
                  <AlertCircle size={16} />
                </div>
                <span className="text-sm font-medium">{t('common.therapist')}: {booking.therapistName || t('common.any')}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-beige/10">
              <div>
                <p className="text-[10px] text-earth/40 font-bold uppercase tracking-widest mb-1">Total Paid</p>
                <p className="text-2xl font-serif font-bold text-primary">{formatCurrency(booking.price || 0)}</p>
              </div>
              {booking.status === 'confirmed' && (
                <button className="text-rose-500 text-[10px] font-bold uppercase tracking-widest hover:text-rose-600 transition-colors bg-rose-50 px-4 py-2 rounded-full">
                  {t('common.cancel')}
                </button>
              )}
            </div>
          </div>
        ))}

        {bookings.length === 0 && (
          <div className="col-span-full py-20 text-center bg-section/30 rounded-[3rem] border-2 border-dashed border-beige/40">
            <p className="text-earth/40 text-sm italic">You don't have any bookings yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
