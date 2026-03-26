import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RefreshCw, TrendingUp, AlertCircle, Users, DollarSign } from 'lucide-react';
import { businessAiService } from '../services/businessAiService';
import { Booking, Staff } from '../types';
import ReactMarkdown from 'react-markdown';

interface BusinessInsightsProps {
  bookings: Booking[];
  staff: Staff[];
}

export const BusinessInsights: React.FC<BusinessInsightsProps> = ({ bookings, staff }) => {
  const [insights, setInsights] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchInsights = async () => {
    setIsLoading(true);
    try {
      const result = await businessAiService.getInsights(bookings, staff);
      setInsights(result);
    } catch (error) {
      console.error("Error fetching insights:", error);
      setInsights("ขออภัยครับ ไม่สามารถดึงข้อมูลวิเคราะห์ได้ในขณะนี้");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (bookings.length > 0 || staff.length > 0) {
      fetchInsights();
    }
  }, [bookings.length, staff.length]);

  return (
    <div className="bg-white rounded-[3rem] border border-beige/20 p-8 shadow-sm relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles size={24} />
          </div>
          <div>
            <h4 className="text-xl font-serif font-bold text-primary">Mira Business Manager (V4)</h4>
            <p className="text-xs text-earth/40">AI-Powered Daily Insights & Actions</p>
          </div>
        </div>
        <button 
          onClick={fetchInsights}
          disabled={isLoading}
          className={`p-3 rounded-full hover:bg-section transition-all ${isLoading ? 'animate-spin' : ''}`}
          title="Refresh Insights"
        >
          <RefreshCw size={20} className="text-primary/40" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-12 flex flex-col items-center justify-center gap-4"
          >
            <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
            <p className="text-sm font-bold text-primary/40 uppercase tracking-widest">Analyzing Business Data...</p>
          </motion.div>
        ) : (
          <motion.div 
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="prose prose-sm max-w-none relative z-10"
          >
            <div className="markdown-body text-earth/80 leading-relaxed">
              <ReactMarkdown>{insights}</ReactMarkdown>
            </div>
            
            {/* Quick Stats Grid for visual flair */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-beige/10">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-earth/30 uppercase tracking-widest mb-1">GST Logic</span>
                <span className="text-xs font-bold text-primary">10% Melbourne Std</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-earth/30 uppercase tracking-widest mb-1">Dashboard</span>
                <span className="text-xs font-bold text-primary">iPad Optimized</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-earth/30 uppercase tracking-widest mb-1">Status</span>
                <span className="text-xs font-bold text-sage">Actionable</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-earth/30 uppercase tracking-widest mb-1">Tone</span>
                <span className="text-xs font-bold text-secondary">Business Friendly</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
