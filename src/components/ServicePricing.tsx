import React from 'react';
import { motion } from 'motion/react';
import { Hand, Droplets, Footprints, Activity, Info, Edit2 } from 'lucide-react';

interface PricingItem {
  id: string;
  nameTh: string;
  nameEn: string;
  icon: React.ReactNode;
  options: { duration: string; price: number }[];
  noteTh?: string;
  noteEn?: string;
  isHicaps?: boolean;
}

const pricingData: PricingItem[] = [
  {
    id: 'remedial',
    nameTh: 'นวดบำบัดค่ะ',
    nameEn: 'Remedial Massage',
    icon: <Activity className="w-8 h-8 text-[#1a3a3a]" />,
    isHicaps: true,
    options: [
      { duration: '60m', price: 100 },
      { duration: '90m', price: 145 },
      { duration: '120m', price: 190 },
    ],
    noteTh: 'เบิก HICAPS ได้ค่ะ',
    noteEn: 'HICAPS Available',
  },
  {
    id: 'thai',
    nameTh: 'นวดไทยดั้งเดิมค่ะ',
    nameEn: 'Thai Traditional Massage',
    icon: <Hand className="w-8 h-8 text-[#1a3a3a]" />,
    options: [
      { duration: '60m', price: 90 },
      { duration: '90m', price: 135 },
      { duration: '120m', price: 180 },
    ],
  },
  {
    id: 'oil',
    nameTh: 'นวดน้ำมัน/อโรมาค่ะ',
    nameEn: 'Aromatherapy Oil Massage',
    icon: <Droplets className="w-8 h-8 text-[#1a3a3a]" />,
    options: [
      { duration: '60m', price: 95 },
      { duration: '90m', price: 140 },
      { duration: '120m', price: 185 },
    ],
  },
  {
    id: 'foot',
    nameTh: 'นวดกดจุดเท้าค่ะ',
    nameEn: 'Foot Reflexology',
    icon: <Footprints className="w-8 h-8 text-[#1a3a3a]" />,
    options: [
      { duration: '30m', price: 60 },
      { duration: '45m', price: 80 },
      { duration: '60m', price: 95 },
    ],
  },
  {
    id: 'neck',
    nameTh: 'นวดคอ บ่า ไหล่ค่ะ',
    nameEn: 'Deep Tissue - Neck, Shoulders, Back',
    icon: <Activity className="w-8 h-8 text-[#1a3a3a]" />,
    options: [
      { duration: '30m', price: 65 },
      { duration: '45m', price: 85 },
      { duration: '60m', price: 100 },
    ],
  },
];

interface ServicePricingProps {
  isAdmin?: boolean;
}

export const ServicePricing: React.FC<ServicePricingProps> = ({ isAdmin = false }) => {
  return (
    <section className={`py-16 px-6 ${isAdmin ? 'bg-transparent' : 'bg-[#FDFBF7]'}`}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-black text-[#1a3a3a] mb-4">
            รายการนวดและราคาค่ะ / Service Menu & Pricing
          </h2>
          <p className="text-[#1a3a3a]/80 text-2xl font-black bg-white/50 py-4 rounded-full border-2 border-primary/10">
            {isAdmin 
              ? 'ใช้สำหรับดูหรือแก้ไขราคานวดของร้านค่ะ / View or edit massage prices.'
              : 'สัมผัสประสบการณ์การนวดที่ผ่อนคลายค่ะ / Experience relaxing massage services.'}
          </p>
        </div>

        <div className="grid gap-6">
          {pricingData.map((service) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-[#F5F2ED] border-2 border-[#D4AF37]/10 rounded-[3rem] p-8 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex items-start gap-6">
                  <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-[#D4AF37]/5">
                    {service.icon}
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-[#1a3a3a] leading-tight mb-1">
                      {service.nameTh}
                    </h3>
                    <p className="text-xl font-bold text-[#1a3a3a]/50">
                      {service.nameEn}
                    </p>
                    {service.isHicaps && (
                      <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 bg-[#1a3a3a] text-white text-sm font-black rounded-full uppercase tracking-wider">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        {service.noteTh} / {service.noteEn}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 lg:justify-end flex-grow">
                  {service.options.map((opt, idx) => (
                    <div 
                      key={idx}
                      className="bg-white px-8 py-5 rounded-[2.5rem] border-2 border-[#D4AF37]/10 flex flex-col items-center justify-center min-w-[140px] shadow-sm"
                    >
                      <span className="text-xs font-black text-[#1a3a3a]/40 uppercase tracking-[0.2em] mb-2">
                        {opt.duration}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-[#1a3a3a]">
                          ${opt.price}
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-[#1a3a3a]/30 uppercase mt-1">
                        AUD
                      </span>
                    </div>
                  ))}
                </div>

                {isAdmin && (
                  <div className="flex lg:flex-col justify-end lg:justify-center">
                    <button 
                      className="bg-[#D4AF37] hover:bg-[#B8860B] text-white px-12 py-7 rounded-[3rem] font-black text-2xl shadow-2xl hover:shadow-primary/40 transition-all flex items-center gap-4 group whitespace-nowrap border-b-8 border-[#b8962d] active:border-b-0 active:translate-y-2"
                      onClick={() => console.log('Edit Price clicked')}
                    >
                      <Edit2 className="w-8 h-8 group-hover:rotate-12 transition-transform" />
                      <span>แก้ไขราคา / Edit</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {!isAdmin && (
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-3 bg-[#1a3a3a]/5 px-8 py-4 rounded-full text-[#1a3a3a]/60 font-black text-lg">
              <Info className="w-6 h-6" />
              <span>ราคาทั้งหมดเป็นสกุลเงินดอลลาร์ออสเตรเลีย (AUD) / All prices are in AUD.</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
