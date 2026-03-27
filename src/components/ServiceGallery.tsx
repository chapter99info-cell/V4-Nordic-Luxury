import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { shopConfig } from '../config/shopConfig';
import { Service, PromoSettings } from '../types';
import { Check, ChevronRight, Sparkles, SearchX, Tag } from 'lucide-react';
import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import { collection, addDoc, serverTimestamp, query, onSnapshot, where, doc, getDoc } from 'firebase/firestore';

interface ServiceGalleryProps {
  onSelectService: (service: Service) => void;
}

export const ServiceGallery: React.FC<ServiceGalleryProps> = ({ onSelectService }) => {
  const [filter, setFilter] = useState('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [promo, setPromo] = useState<PromoSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hesitationTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Fetch Services
    const q = query(collection(db, 'services'), where('isActive', '==', true));
    const unsubscribeServices = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
      setServices(docs.length > 0 ? docs : shopConfig.services);
      setLoading(false);
    });

    // Fetch Promo Settings
    const unsubscribePromo = onSnapshot(doc(db, 'shop_settings', 'promo'), (doc) => {
      if (doc.exists()) {
        setPromo(doc.data() as PromoSettings);
      }
    });

    return () => {
      unsubscribeServices();
      unsubscribePromo();
    };
  }, []);
  
  const categories = ['All', ...Array.from(new Set(services.map(s => s.type || 'Other')))];
  
  const filteredServices = filter === 'All' 
    ? services 
    : services.filter(s => s.type === filter);

  const selectedService = services.find(s => s.id === selectedId);

  // Function to log hesitation to Firebase
  const logHesitation = async (service: Service) => {
    const path = 'hesitation_logs';
    try {
      await addDoc(collection(db, path), {
        serviceId: service.id,
        serviceName: service.name,
        price: Math.min(...(Object.values(service.rates) as number[])),
        category: service.type,
        userId: auth.currentUser?.uid || 'anonymous',
        userEmail: auth.currentUser?.email || 'anonymous',
        timestamp: serverTimestamp(),
        durationBeforeLog: '2 minutes',
        action: 'selected_but_not_proceeded'
      });
      console.log(`Logged hesitation for: ${service.name}`);
    } catch (error) {
      // Silent fail for analytics to not disturb user experience, but log to console
      console.error('Failed to log hesitation:', error);
    }
  };

  // Auto-scroll and Hesitation Tracking
  useEffect(() => {
    // Clear any existing timer
    if (hesitationTimerRef.current) {
      clearTimeout(hesitationTimerRef.current);
      hesitationTimerRef.current = null;
    }

    if (selectedId) {
      // 1. Auto-scroll logic
      const timer = setTimeout(() => {
        const element = document.getElementById(`service-${selectedId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      // 2. Hesitation Tracking logic (2 minutes = 120,000 ms)
      const currentService = services.find(s => s.id === selectedId);
      if (currentService) {
        hesitationTimerRef.current = setTimeout(() => {
          logHesitation(currentService);
        }, 120000); 
      }

      return () => {
        clearTimeout(timer);
        if (hesitationTimerRef.current) clearTimeout(hesitationTimerRef.current);
      };
    }
  }, [selectedId, services]);

  const handleConfirm = () => {
    // Clear timer when user proceeds
    if (hesitationTimerRef.current) {
      clearTimeout(hesitationTimerRef.current);
      hesitationTimerRef.current = null;
    }
    
    if (selectedService) {
      onSelectService(selectedService);
      // Reset selection so the floating button disappears after clicking
      setSelectedId(null);
    }
  };

  const isAdminRoute = window.location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-section pt-24 pb-64 px-4 md:px-8 transition-all duration-500">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header & Categories */}
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sage text-[10px] font-bold uppercase tracking-[0.4em] block"
            >
              Our Heritage
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-serif font-bold text-primary"
            >
              Select Service
            </motion.h2>
          </div>

          <div className="flex justify-center gap-2 overflow-x-auto py-2 no-scrollbar">
            {categories.map((cat, idx) => (
              <motion.button
                key={`${cat}-${idx}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => {
                  setFilter(cat);
                  setSelectedId(null); // Reset selection when filter changes
                }}
                className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
                  filter === cat 
                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                    : 'bg-white border-beige/30 text-earth/60 hover:border-primary/40'
                }`}
              >
                {cat}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Modern Grid Layout or Empty State */}
        <AnimatePresence mode="wait">
          {filteredServices.length > 0 ? (
            <motion.div 
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6"
            >
              {filteredServices.map((service, index) => (
                <motion.div
                  id={`service-${service.id}`}
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -8 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedId(service.id)}
                  className={`relative group cursor-pointer rounded-[2.5rem] overflow-hidden border-2 transition-all duration-500 ${
                    selectedId === service.id 
                      ? 'border-primary shadow-2xl shadow-primary/20' 
                      : 'border-transparent bg-white shadow-sm hover:shadow-xl hover:shadow-earth/5'
                  }`}
                >
                  {/* Image Section */}
                  <div className="aspect-[4/5] overflow-hidden relative">
                    <img 
                      src={service.image} 
                      alt={service.name} 
                      className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${
                        selectedId === service.id ? 'scale-105' : ''
                      }`} 
                    />
                    {/* Promo Badge */}
                    {promo?.isEnabled && (
                      <div className="absolute top-4 left-4 bg-rose-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg flex items-center gap-1 z-10">
                        <Tag size={10} />
                        Sale {promo.discountPercentage}% OFF
                      </div>
                    )}
                    {/* Active State Overlay */}
                    <div className={`absolute inset-0 transition-opacity duration-500 ${
                      selectedId === service.id 
                        ? 'bg-primary/20 opacity-100' 
                        : 'bg-gradient-to-t from-black/80 via-black/20 to-transparent'
                    }`} />
                  </div>

                  {/* Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-70 mb-1">{service.type}</p>
                    <h3 className="font-serif font-bold text-lg md:text-xl leading-tight mb-2">{service.name}</h3>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Starts from</span>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          {promo?.isEnabled ? (
                            <>
                              <span className="text-[10px] line-through opacity-50">
                                ${Math.min(...(Object.values(service.rates) as number[])).toFixed(2)}
                              </span>
                              <span className="text-xl font-bold text-white">
                                ${(Math.min(...(Object.values(service.rates) as number[])) * (1 - promo.discountPercentage / 100)).toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="text-xl font-bold">${Math.min(...(Object.values(service.rates) as number[])).toFixed(2)}</span>
                          )}
                        </div>
                        {selectedId === service.id && (
                          <motion.div 
                            initial={{ scale: 0, rotate: -45 }} 
                            animate={{ scale: 1, rotate: 0 }} 
                            className="bg-primary p-2 rounded-full shadow-lg"
                          >
                            <Check size={14} className="text-white" />
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Hover Sparkle */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Sparkles size={16} className="text-white/50" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="py-20 text-center space-y-4"
            >
              <SearchX size={48} className="mx-auto text-earth/20" />
              <p className="text-earth/50">No services found in this category</p>
              <button 
                onClick={() => setFilter('All')} 
                className="text-primary font-bold hover:underline underline-offset-8 transition-all"
              >
                View All Services
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Confirm Button */}
        <AnimatePresence>
          {selectedId && !isAdminRoute && (
            <motion.div 
              key="booking-confirm-button"
              initial={{ y: 100, opacity: 0 }} 
              animate={{ 
                y: 0, 
                opacity: 1,
                transition: { type: 'spring', damping: 15 }
              }} 
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-32 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50 print:hidden"
            >
              <motion.button 
                animate={{ 
                  scale: [1, 1.02, 1],
                  boxShadow: [
                    "0 25px 50px -12px rgba(74, 93, 35, 0.25)",
                    "0 25px 50px -12px rgba(74, 93, 35, 0.45)",
                    "0 25px 50px -12px rgba(74, 93, 35, 0.25)"
                  ]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2,
                  ease: "easeInOut"
                }}
                onClick={handleConfirm}
                className="w-full bg-primary text-white py-6 rounded-[2.5rem] font-bold shadow-2xl flex items-center justify-center gap-3 group hover:bg-sage transition-all"
              >
                Next Step: Select Details 
                <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
