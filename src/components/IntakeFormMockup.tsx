import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Check, AlertCircle, ShieldCheck, Info } from 'lucide-react';

export const IntakeFormMockup = () => {
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-section font-sans text-earth p-6">
      <div className="max-w-md mx-auto bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-primary/5">
        {/* Header */}
        <div className="bg-primary p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <button className="mb-4 opacity-60 hover:opacity-100 transition-opacity">
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-2xl font-serif font-bold">Clinical Intake</h1>
            <p className="text-white/60 text-xs uppercase tracking-widest font-bold mt-1">Mira Remedial Thai</p>
          </div>
          {/* Decorative Lotus */}
          <div className="absolute -right-8 -bottom-8 opacity-10 w-40 h-40 border-4 border-white rounded-full" />
        </div>

        {/* Form Content */}
        <div className="p-8 space-y-8">
          {/* Section 1: Pain Matrix Preview */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <AlertCircle size={18} />
              <h2 className="text-sm font-bold uppercase tracking-widest">Pain Matrix</h2>
            </div>
            <div className="bg-section/50 rounded-3xl p-6 border border-beige/20">
              <div className="grid grid-cols-5 gap-2 text-[8px] font-bold uppercase tracking-tighter text-earth/40 mb-4">
                <div className="col-span-1">Area</div>
                <div>Left</div>
                <div>Right</div>
                <div>Both</div>
                <div>Ctr</div>
              </div>
              {['Neck', 'Shoulders', 'Lower Back'].map((area) => (
                <div key={area} className="grid grid-cols-5 gap-2 py-2 border-b border-beige/10 last:border-0 items-center">
                  <div className="text-[10px] font-bold text-primary">{area}</div>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`w-4 h-4 rounded-md border-2 transition-all ${i === 2 && area === 'Shoulders' ? 'bg-secondary border-secondary' : 'border-beige/30'}`} />
                  ))}
                </div>
              ))}
            </div>
          </section>

          {/* Section 2: Medical Checklist */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck size={18} />
              <h2 className="text-sm font-bold uppercase tracking-widest">Medical History</h2>
            </div>
            <div className="space-y-3">
              {['High Blood Pressure', 'Recent Surgery', 'Allergies'].map((item, i) => (
                <label key={item} className="flex items-center gap-4 p-4 rounded-2xl border border-beige/20 bg-white hover:border-primary/20 transition-all cursor-pointer">
                  <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center ${i === 2 ? 'bg-primary border-primary text-white' : 'border-beige/30'}`}>
                    {i === 2 && <Check size={12} />}
                  </div>
                  <span className="text-xs font-medium">{item}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Policy Note */}
          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-3">
            <Info size={16} className="text-primary shrink-0" />
            <p className="text-[10px] text-primary/70 leading-relaxed">
              Your data is encrypted and stored according to Australian Privacy Standards for HICAPS compliance.
            </p>
          </div>

          <button className="w-full bg-primary text-white py-5 rounded-full font-bold uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-sage transition-all">
            Submit Clinical Form
          </button>
        </div>
      </div>
    </div>
  );
};
