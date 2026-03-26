import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, Calendar as CalendarIcon, User, Clock, DollarSign } from 'lucide-react';

export const Sessions: React.FC<{ config?: any, role?: string | null }> = ({ config, role }) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const isOwnerOrAdmin = role === 'owner' || role === 'admin';

  // 🔗 ใช้ท่อข้อมูลเดียวกับหน้า Dashboard เลยค่ะ (Fallback if config is missing)
  const SCRIPT_URL = config?.scriptUrl || "https://script.google.com/macros/s/AKfycbzfsrRjLdw7R3oKRHviKwzqXGkAQMzgfRifajsor0JJB1pZ1MDM58mw8ZHS6fM6nAERww/exec";

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${SCRIPT_URL}?action=getBookings`);
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // ระบบค้นหาชื่อลูกค้า
  const filteredBookings = bookings.filter(b => 
    b[1].toLowerCase().includes(searchTerm.toLowerCase()) || 
    b[2].includes(searchTerm)
  );

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-primary">Booking Sessions</h1>
          <p className="text-earth/50">จัดการและติดตามคิวลูกค้าทั้งหมดจาก Google Sheets</p>
        </header>

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-earth/30" size={20} />
            <input 
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-beige/20 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-beige/20 rounded-2xl font-medium hover:bg-section transition-colors text-earth/60">
            <Filter size={20} /> Filter
          </button>
        </div>

        {/* Sessions Table */}
        <div className="bg-white rounded-[2rem] border border-beige/10 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-20 text-center text-earth/30">Loading sessions from Google Sheets...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-20 text-center text-earth/30">No sessions found for "{searchTerm}"</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-section/50 text-primary text-xs uppercase tracking-widest border-b border-beige/10">
                    <th className="px-6 py-5 font-bold">Client</th>
                    <th className="px-6 py-5 font-bold">Service</th>
                    <th className="px-6 py-5 font-bold">Date & Time</th>
                    <th className="px-6 py-5 font-bold">Status</th>
                    {isOwnerOrAdmin && <th className="px-6 py-5 font-bold text-right">Payment</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-beige/10">
                  {filteredBookings.map((b, i) => (
                    <motion.tr 
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-section/30 transition-colors group"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <User size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-earth">{b[1]}</p>
                            <p className="text-xs text-earth/40">{b[2]}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-3 py-1 bg-section text-earth/60 rounded-full text-xs font-medium">
                          {b[3]}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-sm text-earth/60">
                          <Clock size={14} className="text-earth/30" />
                          {new Date(b[0]).toLocaleDateString('en-AU')}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-bold">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Confirmed
                        </div>
                      </td>
                      {isOwnerOrAdmin && (
                        <td className="px-6 py-5 text-right font-bold text-primary">
                          ${parseFloat(b[5]).toFixed(2)}
                        </td>
                      )}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sessions;
