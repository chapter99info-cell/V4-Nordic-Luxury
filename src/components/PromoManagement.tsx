import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Tag, 
  Percent, 
  Save, 
  AlertCircle, 
  CheckCircle2,
  Zap,
  Clock,
  Settings
} from 'lucide-react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { PromoSettings } from '../types';

export const PromoManagement: React.FC = () => {
  const [promo, setPromo] = useState<PromoSettings>({
    isEnabled: false,
    discountPercentage: 10,
    updatedAt: new Date().toISOString()
  });
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ status: 'success' | 'error', msg: string } | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'shop_settings', 'promo'), (doc) => {
      if (doc.exists()) {
        setPromo(doc.data() as PromoSettings);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      await setDoc(doc(db, 'shop_settings', 'promo'), {
        ...promo,
        updatedAt: new Date().toISOString()
      });
      setFeedback({ status: 'success', msg: 'Promotion settings updated successfully!' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error("Error saving promo:", error);
      setFeedback({ status: 'error', msg: 'Failed to update settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h3 className="text-2xl font-serif font-bold text-primary">Promotion System</h3>
        <p className="text-earth/50 text-sm">Enable store-wide discounts and manage campaign settings.</p>
      </div>

      <div className="bg-white rounded-[3rem] border border-beige/20 p-8 shadow-sm space-y-8">
        {/* Toggle Switch */}
        <div className="flex items-center justify-between p-6 bg-section rounded-[2rem] border border-beige/10">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${promo.isEnabled ? 'bg-primary text-white' : 'bg-earth/10 text-earth/40'}`}>
              <Zap size={24} />
            </div>
            <div>
              <h4 className="font-bold text-primary">Global Discount</h4>
              <p className="text-[10px] text-earth/40 uppercase tracking-widest font-bold">Apply to all services</p>
            </div>
          </div>
          <button 
            onClick={() => setPromo(prev => ({ ...prev, isEnabled: !prev.isEnabled }))}
            className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${promo.isEnabled ? 'bg-primary' : 'bg-earth/20'}`}
          >
            <motion.div 
              animate={{ x: promo.isEnabled ? 24 : 4 }}
              className="absolute top-1 left-0 w-6 h-6 bg-white rounded-full shadow-md"
            />
          </button>
        </div>

        {/* Discount Percentage */}
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-[10px] font-bold text-earth/40 uppercase tracking-widest ml-4">
            <Percent size={14} /> Discount Percentage
          </label>
          <div className="relative">
            <input 
              type="range" 
              min="0" 
              max="50" 
              step="5"
              value={promo.discountPercentage}
              onChange={e => setPromo(prev => ({ ...prev, discountPercentage: Number(e.target.value) }))}
              className="w-full h-2 bg-section rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between mt-2 px-2">
              {[0, 10, 20, 30, 40, 50].map(val => (
                <span key={val} className="text-[10px] font-bold text-earth/30">{val}%</span>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center py-4">
            <span className="text-5xl font-serif font-bold text-primary">{promo.discountPercentage}%</span>
            <span className="text-xl font-serif font-bold text-primary/40 ml-2">OFF</span>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex gap-4">
          <AlertCircle className="text-amber-500 shrink-0" size={20} />
          <p className="text-xs text-amber-800 leading-relaxed">
            When enabled, all active services will display a <strong>Sale Badge</strong> and the discounted price will be automatically calculated in the booking flow.
          </p>
        </div>

        {/* Feedback & Save */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            {feedback && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center gap-2 text-xs font-bold ${feedback.status === 'success' ? 'text-emerald-600' : 'text-rose-500'}`}
              >
                {feedback.status === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {feedback.msg}
              </motion.div>
            )}
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-full font-bold text-sm hover:bg-sage transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {isSaving ? <Clock className="animate-spin" size={18} /> : <Save size={18} />}
            SAVE SETTINGS
          </button>
        </div>
      </div>
    </div>
  );
};
