import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { motion } from 'motion/react';
import { BarChart2, Users, DollarSign, TrendingUp } from 'lucide-react';

export const Statics: React.FC = () => {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const s = await apiService.getStats();
      setStats(s);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const maxAmount = Math.max(...stats.map(s => s.amount));

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-serif font-bold text-earth">Statistics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<DollarSign size={24} />} label="Total Revenue" value="$12,450 AUD" color="bg-primary" />
        <StatCard icon={<Users size={24} />} label="Total Customers" value="342" color="bg-earth" />
        <StatCard icon={<TrendingUp size={24} />} label="Growth Rate" value="+12.5%" color="bg-green-500" />
        <StatCard icon={<BarChart2 size={24} />} label="Avg. Session" value="45 min" color="bg-blue-500" />
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-beige/20">
        <div className="flex items-center justify-between mb-10">
          <h3 className="text-xl font-serif font-bold text-earth">Performance Overview</h3>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span className="text-xs font-bold text-earth/40 uppercase tracking-wider">Total amounts</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-pink-400"></div>
              <span className="text-xs font-bold text-earth/40 uppercase tracking-wider">Total customers</span>
            </div>
          </div>
        </div>

        <div className="h-64 flex items-end justify-between gap-4">
          {stats.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-4 group cursor-pointer">
              <div className="w-full flex flex-col items-center gap-1">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${(s.amount / maxAmount) * 100}%` }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                  className="w-full max-w-[20px] bg-primary rounded-t-full relative group-hover:bg-primary/80 transition-colors"
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-earth text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                    ${s.amount} AUD
                  </div>
                </motion.div>
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${(s.customers / 50) * 100}%` }}
                  transition={{ duration: 1, delay: i * 0.1 + 0.2 }}
                  className="w-full max-w-[20px] bg-pink-400 rounded-t-full relative group-hover:bg-pink-400/80 transition-colors"
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-earth text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                    {s.customers}
                  </div>
                </motion.div>
              </div>
              <span className="text-xs font-bold text-earth/40 uppercase tracking-wider">{s.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; color: string }> = ({ icon, label, value, color }) => (
  <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-beige/20 flex items-center gap-4 hover:shadow-lg transition-shadow">
    <div className={`p-4 rounded-2xl ${color} text-white shadow-lg`}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-bold text-earth/40 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-serif font-bold text-earth leading-tight">{value}</p>
    </div>
  </div>
);
