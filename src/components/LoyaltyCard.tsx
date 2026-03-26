import React from 'react';
import { motion } from 'motion/react';
import { Award, Star, Gift, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';

interface LoyaltyCardProps {
  points: number;
  maxPoints?: number;
}

export const LoyaltyCard: React.FC<LoyaltyCardProps> = ({ points, maxPoints = 10 }) => {
  const { t } = useTranslation();
  
  const progress = Math.min((points / maxPoints) * 100, 100);
  const isFull = points >= maxPoints;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-gradient-to-br from-earth to-sage p-8 rounded-[2.5rem] text-white shadow-2xl"
    >
      {/* Decorative Circles */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
              <Award size={24} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-xl">{t('loyalty.member_card')}</h3>
              <p className="text-[10px] uppercase tracking-widest opacity-60 font-bold">VIP Rewards Program</p>
            </div>
          </div>
          {isFull && (
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="bg-amber-400 text-earth px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg"
            >
              Ready to Redeem!
            </motion.div>
          )}
        </div>

        <div className="grid grid-cols-5 gap-3 mb-8">
          {Array.from({ length: maxPoints }).map((_, i) => (
            <div 
              key={i}
              className={`aspect-square rounded-2xl flex items-center justify-center transition-all duration-500 ${
                i < points 
                  ? 'bg-white text-earth shadow-lg scale-105' 
                  : 'bg-white/10 border border-white/20 text-white/30'
              }`}
            >
              {i < points ? <CheckCircle2 size={20} /> : <Star size={16} />}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <p className="text-sm font-bold opacity-80">{t('loyalty.collect_10')}</p>
            <p className="text-2xl font-serif font-bold">{points} <span className="text-xs opacity-60">/ {maxPoints}</span></p>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
            />
          </div>
        </div>

        {isFull && (
          <button className="w-full mt-8 bg-white text-earth py-4 rounded-2xl font-bold text-sm hover:bg-amber-400 transition-all shadow-xl">
            {t('loyalty.redeem')}
          </button>
        )}
      </div>
    </motion.div>
  );
};
