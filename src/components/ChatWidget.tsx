import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, User } from 'lucide-react';
import { collection, query, onSnapshot, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../firebase';
import { aiChatService } from '../services/aiService';
import { apiService } from '../services/api';
import { Holiday, Booking, Staff } from '../types';
import { format, addMinutes } from 'date-fns';

import { shopConfig } from '../config/shopConfig';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: shopConfig.aiPersona.greetingMsg }
  ]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch Holidays (Publicly readable)
    const holidaysPath = 'holidays';
    const hq = query(collection(db, holidaysPath));
    const unsubscribeHolidays = onSnapshot(hq, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Holiday));
      setHolidays(docs);
    }, (error) => {
      // Only log if it's not a permission error for guests, or if we really expect it to work
      if (auth.currentUser || error.message.indexOf('permissions') === -1) {
        handleFirestoreError(error, OperationType.GET, holidaysPath);
      }
    });

    // Fetch Public Slots (Publicly readable, no PII)
    const slotsPath = 'public_slots';
    const today = format(new Date(), 'yyyy-MM-dd');
    const sq_slots = query(collection(db, slotsPath), where('date', '==', today));
    const unsubscribeSlots = onSnapshot(sq_slots, (snapshot) => {
      const docs = snapshot.docs.map(doc => doc.data());
      setBookings(docs as any); // Re-use bookings state for slots
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, slotsPath);
    });

    // Fetch Staff Status (Publicly readable)
    const staffPath = 'staff';
    const sq = query(collection(db, staffPath));
    const unsubscribeStaff = onSnapshot(sq, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff));
      setStaff(docs);
    }, (error) => {
      if (auth.currentUser || error.message.indexOf('permissions') === -1) {
        handleFirestoreError(error, OperationType.GET, staffPath);
      }
    });

    // Listen for auth changes
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      // No longer need to subscribe to bookings specifically for chat
    });

    return () => {
      unsubscribeHolidays();
      unsubscribeSlots();
      unsubscribeStaff();
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const currentStatus = {
        current_time: format(new Date(), 'yyyy-MM-dd HH:mm'),
        booked_slots: bookings.map(b => `${b.startTime}-${b.endTime} (${b.isWalkIn ? 'Walk-in' : 'Booked'})`),
        available_staff: staff.filter(s => s.status === 'Working').length
      };

      const response = await aiChatService.sendMessage(userMessage, history, holidays, currentStatus);
      
      // Handle Function Calls
      if (response.functionCalls) {
        for (const call of response.functionCalls) {
          if (call.name === 'createTentativeBooking') {
            const args = call.args as any;
            const path = 'bookings';
            try {
              const startTime = args.startTime;
              const duration = args.duration;
              const [hours, minutes] = startTime.split(':').map(Number);
              const startDate = new Date();
              startDate.setHours(hours, minutes, 0, 0);
              const endDate = addMinutes(startDate, duration + 15); // Include 15m buffer
              const endTime = format(endDate, 'HH:mm');

              const bookingData: any = {
                clientId: auth.currentUser?.uid || 'guest',
                clientName: args.customerName,
                clientPhone: args.customerPhone,
                clientEmail: args.customerEmail || '',
                serviceName: args.serviceType,
                date: args.date,
                startTime: args.startTime,
                endTime: endTime,
                duration: args.duration,
                status: 'pending',
                paymentStatus: 'unpaid',
                isWalkIn: false,
                createdAt: new Date().toISOString(),
                depositPaid: false,
                intakeFormCompleted: false,
                source: 'AI Assistant'
              };

              if (args.basePrice) {
                const gst = args.basePrice * 0.1;
                bookingData.pricingLogic = {
                  basePrice: args.basePrice,
                  gstAmount: gst,
                  totalPrice: args.basePrice + gst,
                  depositRequired: args.depositRequired || 30,
                  currency: 'AUD'
                };
                bookingData.price = args.basePrice + gst;
              }

              await apiService.createBooking(bookingData);
              console.log("Tentative booking created successfully via apiService");
            } catch (error) {
              console.error("Error creating booking in chat:", error);
            }
          } else if (call.name === 'getFinancialSummary') {
            const args = call.args as any;
            if (args.pin === '9999') {
              try {
                const summary = await apiService.getDailyFinancialSummary();
                const summaryText = `Daily Financial Summary for ${format(new Date(), 'yyyy-MM-dd')}:\n` +
                  `- Total Revenue: $${summary.totalRevenue}\n` +
                  `- Total Bookings: ${summary.totalBookings}\n` +
                  `- Cash Total: $${summary.cashTotal}\n` +
                  `- Transfer Total: $${summary.transferTotal}`;
                
                // We need to send this back to the AI or just display it.
                // The best way is to send it as a tool response, but for simplicity in this widget,
                // we can just append it to the messages or let the AI know.
                // However, the AI expects a tool response.
                // Since our current aiChatService.sendMessage doesn't support tool responses yet,
                // I'll just append a model message with the data.
                setMessages(prev => [...prev, { role: 'model', text: summaryText }]);
                setIsTyping(false);
                return; // Stop here as we've handled it
              } catch (error) {
                console.error("Error fetching financial summary:", error);
              }
            } else {
              setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, but the Admin PIN you provided is incorrect. I cannot reveal sensitive financial data." }]);
              setIsTyping(false);
              return;
            }
          }
        }
      }

      const textResponse = response.text || "Sawasdee ka, I've received your request. Let me check that for you.";
      setMessages(prev => [...prev, { role: 'model', text: textResponse }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'model', text: "Sawasdee ka, I'm having a little trouble connecting. Please try again later." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 print:hidden">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 right-0 w-[350px] h-[500px] bg-white rounded-[2.5rem] shadow-2xl border border-beige/20 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest">Mira Assistant</h4>
                  <p className="text-[10px] opacity-60 uppercase tracking-widest">Online</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-section/30">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-3xl text-sm ${
                    m.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-white text-primary rounded-tl-none border border-beige/20 shadow-sm'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-3xl rounded-tl-none border border-beige/20 shadow-sm flex gap-1">
                    <span className="w-1.5 h-1.5 bg-primary/20 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-primary/20 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-primary/20 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-beige/10">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="w-full bg-section/50 border border-beige/40 rounded-full py-3 pl-6 pr-12 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-full hover:scale-105 transition-transform disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-primary text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform ring-4 ring-white"
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </button>
    </div>
  );
}
