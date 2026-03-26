import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  MessageSquare, 
  CheckCircle2,
  XCircle,
  Power,
  Info
} from 'lucide-react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Holiday } from '../types';
import { format, isAfter, isBefore, parseISO, startOfDay, addDays } from 'date-fns';
import { shopConfig } from '../config/shopConfig';

export const HolidayManagement: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isEmergencyClosed, setIsEmergencyClosed] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHoliday, setNewHoliday] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    message: '',
    type: 'holiday' as 'holiday' | 'emergency'
  });

  useEffect(() => {
    const q = query(collection(db, 'holidays'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Holiday));
      setHolidays(docs.length > 0 ? docs : shopConfig.holidays);
      
      // Check if there's an active emergency closure for "today"
      const emergency = docs.find(h => h.type === 'emergency' && h.isActive);
      setIsEmergencyClosed(!!emergency);
    });

    return () => unsubscribe();
  }, []);

  const handleAddHoliday = async () => {
    if (!newHoliday.message) return;
    
    await addDoc(collection(db, 'holidays'), {
      ...newHoliday,
      isActive: true,
      createdAt: serverTimestamp()
    });
    
    setShowAddModal(false);
    setNewHoliday({
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      message: '',
      type: 'holiday'
    });
  };

  const handleDeleteHoliday = async (id: string) => {
    await deleteDoc(doc(db, 'holidays', id));
  };

  const toggleEmergencyClose = async () => {
    if (isEmergencyClosed) {
      // Find and deactivate the emergency closure
      const emergency = holidays.find(h => h.type === 'emergency' && h.isActive);
      if (emergency) {
        await updateDoc(doc(db, 'holidays', emergency.id), { isActive: false });
      }
    } else {
      // Create a new emergency closure for today
      const today = format(new Date(), 'yyyy-MM-dd');
      await addDoc(collection(db, 'holidays'), {
        startDate: today,
        endDate: today,
        message: 'We are temporarily closed due to an emergency. We apologize for the inconvenience.',
        type: 'emergency',
        isActive: true,
        createdAt: serverTimestamp()
      });
    }
  };

  return (
    <div className="bg-white rounded-[3rem] border border-beige/20 p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h4 className="text-xl font-serif font-bold text-primary">Holiday & Closure Management</h4>
          <p className="text-xs text-earth/40">Manage shop closures and holiday messages for the AI Chatbot</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleEmergencyClose}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
              isEmergencyClosed 
                ? 'bg-red-500 text-white shadow-lg shadow-red-200' 
                : 'bg-section text-red-500 border border-red-100 hover:bg-red-50'
            }`}
          >
            <Power size={16} />
            {isEmergencyClosed ? 'Shop is Closed (Emergency)' : 'Emergency Close'}
          </button>
          
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-primary text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-sage transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <Plus size={16} /> Add Closure
          </button>
        </div>
      </div>

      {/* Active Closures List */}
      <div className="space-y-4">
        <h5 className="text-[10px] font-bold uppercase tracking-widest text-earth/30 mb-4">Scheduled Closures</h5>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {holidays.filter(h => h.isActive).map((holiday) => (
            <motion.div 
              key={holiday.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-6 rounded-[2rem] border ${
                holiday.type === 'emergency' 
                  ? 'bg-red-50 border-red-100' 
                  : 'bg-section border-beige/10'
              } relative group`}
            >
              <button 
                onClick={() => handleDeleteHoliday(holiday.id)}
                className="absolute top-4 right-4 p-2 text-earth/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={16} />
              </button>
              
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl ${
                  holiday.type === 'emergency' ? 'bg-red-100 text-red-600' : 'bg-white text-primary shadow-sm'
                }`}>
                  {holiday.type === 'emergency' ? <AlertTriangle size={20} /> : <CalendarIcon size={20} />}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-bold text-primary">
                    {holiday.startDate === holiday.endDate 
                      ? format(parseISO(holiday.startDate), 'MMMM d, yyyy')
                      : `${format(parseISO(holiday.startDate), 'MMM d')} - ${format(parseISO(holiday.endDate), 'MMM d, yyyy')}`
                    }
                  </p>
                  <div className="flex items-start gap-2 bg-white/50 p-3 rounded-xl border border-beige/5">
                    <MessageSquare size={14} className="text-earth/30 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-earth/60 italic leading-relaxed">
                      "{holiday.message}"
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                      holiday.type === 'emergency' ? 'bg-red-200 text-red-700' : 'bg-sage/10 text-sage'
                    }`}>
                      {holiday.type}
                    </span>
                    <span className="text-[8px] font-bold text-earth/30 uppercase tracking-widest flex items-center gap-1">
                      <CheckCircle2 size={10} /> AI Chatbot Active
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          
          {holidays.filter(h => h.isActive).length === 0 && (
            <div className="md:col-span-2 py-12 text-center bg-section rounded-[2rem] border border-dashed border-beige/20">
              <Info size={32} className="text-earth/10 mx-auto mb-4" />
              <p className="text-earth/30 text-sm italic">No scheduled closures. Shop is operating normally.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Holiday Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-primary/20 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[3rem] p-10 shadow-2xl max-w-md w-full space-y-8 border border-beige/20"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-serif font-bold text-primary">Add New Closure</h3>
              <button onClick={() => setShowAddModal(false)} className="text-earth/30 hover:text-primary">
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-earth/40 ml-2">Start Date</label>
                  <input 
                    type="date" 
                    value={newHoliday.startDate}
                    onChange={(e) => setNewHoliday({...newHoliday, startDate: e.target.value, endDate: e.target.value})}
                    className="w-full bg-section border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-earth/40 ml-2">End Date</label>
                  <input 
                    type="date" 
                    value={newHoliday.endDate}
                    onChange={(e) => setNewHoliday({...newHoliday, endDate: e.target.value})}
                    className="w-full bg-section border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-earth/40 ml-2">Holiday Message</label>
                <textarea 
                  placeholder="Explain why the shop is closed (e.g., Happy Songkran! We are closed for the festival...)"
                  value={newHoliday.message}
                  onChange={(e) => setNewHoliday({...newHoliday, message: e.target.value})}
                  rows={3}
                  className="w-full bg-section border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest text-earth/40 hover:bg-section transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddHoliday}
                  className="flex-1 bg-primary text-white py-4 rounded-2xl text-sm font-bold uppercase tracking-widest hover:bg-sage transition-all shadow-lg shadow-primary/20"
                >
                  Save Closure
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
