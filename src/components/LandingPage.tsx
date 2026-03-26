import React from 'react';
import { shopConfig as defaultShopConfig, ShopConfig } from '../config/shopConfig';
import { motion } from 'motion/react';
import { Clock, DollarSign, ChevronRight, MapPin, Phone, Instagram, Facebook, Calendar, Grid, BarChart2, MessageSquare, Info, Sparkles, Heart, Award, ShieldCheck, Users } from 'lucide-react';
import { Service } from '../types';
import { CustomerReviews } from './CustomerReviews';
import { QuickBookingForm } from './QuickBookingForm';
import { ServiceGallery } from './ServiceGallery';

interface LandingPageProps {
  onBookNow: (service?: Service, withCoconut?: boolean, duration?: number) => void;
  setActiveTab: (tab: string) => void;
  setView: (view: 'landing' | 'app') => void;
  onStaffLogin: () => void;
  config?: ShopConfig;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onBookNow, 
  setActiveTab, 
  setView, 
  onStaffLogin,
  config = defaultShopConfig 
}) => {
  const handleNav = (tab: string) => {
    setActiveTab(tab);
    setView('app');
  };

  const features = config.featureFlags;

  return (
    <div className="bg-background text-earth selection:bg-primary/20 font-sans min-h-screen pb-24">
      {/* Header (The Hero) */}
      <section className="relative h-[70vh] md:h-[85vh] flex flex-col items-center justify-start overflow-hidden">
        {/* Mural Background with Gradient Fade */}
        <div className="absolute inset-0">
          <img 
            src={config.heroImage} 
            alt={`${config.name} Hero`} 
            className="w-full h-full object-cover object-center transition-transform duration-1000"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-background" />
        </div>
        
        {/* Circular Logo */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10 mt-12"
        >
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden">
            <img src={config.logo} alt={`${config.name} Logo`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        </motion.div>
      </section>

      {/* Introduction Section */}
      <section className="relative z-10 -mt-20 px-6 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-white/80 backdrop-blur-sm p-8 md:p-12 rounded-[3rem] shadow-xl shadow-primary/5 border border-primary/5"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/20 text-secondary text-[10px] font-bold tracking-[0.3em] uppercase backdrop-blur-md border border-secondary/30 mb-6">
            {config.landingPageContent.hero.badge}
          </span>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-primary mb-8 tracking-tight leading-tight">
            {config.landingPageContent.hero.title}
          </h1>
          <p className="text-earth/70 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-light">
            {config.landingPageContent.hero.subtitle}
          </p>
          <div className="mt-10 flex flex-col md:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => onBookNow()}
              className="w-full md:w-auto bg-primary text-white px-10 py-5 rounded-full text-sm font-bold uppercase tracking-[0.2em] hover:bg-sage transition-all shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95"
            >
              {config.landingPageContent.hero.cta}
            </button>
            <a href="#services" className="text-primary font-bold uppercase tracking-widest text-xs hover:underline underline-offset-8 px-6 py-4">
              Explore Services
            </a>
          </div>
        </motion.div>
      </section>

      {/* Atmosphere Video Section */}
      {features.showAtmosphere && (
        <section className="py-24 bg-section overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <span className="text-secondary text-xs font-bold uppercase tracking-[0.4em] block">
                  {config.landingPageContent.atmosphere.title}
                </span>
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary leading-tight">
                  {config.landingPageContent.atmosphere.subtitle}
                </h2>
                <p className="text-earth/60 text-lg leading-relaxed font-light">
                  {config.landingPageContent.atmosphere.description}
                </p>
                <div className="flex items-center gap-6 pt-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-12 h-12 rounded-full border-2 border-white overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="User" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs font-bold text-primary uppercase tracking-widest">
                    Trusted by <span className="text-sage">500+</span> monthly guests
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative group"
              >
                <div className="relative aspect-video rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white bg-beige/10">
                  {config.promoVideo ? (
                    <video 
                      autoPlay 
                      loop 
                      muted 
                      playsInline
                      className="w-full h-full object-cover"
                    >
                      <source src={config.promoVideo} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <img 
                      src={config.heroImage} 
                      alt="Atmosphere" 
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors duration-500" />
                </div>
                
                {/* Floating Badge */}
                <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-[2rem] shadow-xl border border-beige/10 hidden md:block">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-sage/10 flex items-center justify-center text-sage">
                      <Clock size={24} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-primary uppercase tracking-widest">Open Daily</h4>
                      <p className="text-[10px] text-earth/50">9:00 AM — 8:00 PM</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* About Us Section */}
      {features.showAboutUs && (
        <section id="about" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-8 space-y-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-8"
              >
                <span className="text-sage text-xs font-bold uppercase tracking-[0.4em] block">
                  {config.landingPageContent.about.subtitle}
                </span>
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary leading-tight">
                  {config.landingPageContent.about.title}
                </h2>
                <p className="text-earth/60 text-lg leading-relaxed font-light">
                  {config.landingPageContent.about.description}
                </p>
                <p className="text-earth/60 text-lg leading-relaxed font-light italic">
                  "{config.landingPageContent.about.philosophy}"
                </p>
                <div className="grid grid-cols-2 gap-6 pt-4">
                  {config.landingPageContent.about.values.map((value, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-secondary" />
                      <span className="text-xs font-bold text-primary uppercase tracking-widest">{value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <div className="grid grid-cols-2 gap-4">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="space-y-4"
                >
                  <div className="aspect-[3/4] rounded-[2rem] overflow-hidden shadow-xl">
                    <img src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=400&h=600" alt="Healing" className="w-full h-full object-cover" />
                  </div>
                  <div className="bg-section p-6 rounded-[2rem] border border-beige/10">
                    <Award className="text-secondary mb-4" size={32} />
                    <h4 className="text-sm font-bold text-primary uppercase tracking-widest">Certified</h4>
                    <p className="text-[10px] text-earth/50">Accredited remedial therapists</p>
                  </div>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="space-y-4 mt-12"
                >
                  <div className="bg-primary p-6 rounded-[2rem] text-white">
                    <Heart className="text-secondary mb-4" size={32} />
                    <h4 className="text-sm font-bold uppercase tracking-widest">Compassion</h4>
                    <p className="text-[10px] text-white/60">Personalized care for every body</p>
                  </div>
                  <div className="aspect-[3/4] rounded-[2rem] overflow-hidden shadow-xl">
                    <img src="https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&q=80&w=400&h=600" alt="Massage" className="w-full h-full object-cover" />
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* HICAPS Marquee */}
      {features.showMarquee && (
        <div className="bg-primary py-4 overflow-hidden border-y border-white/10">
          <motion.div 
            animate={{ x: [0, -1000] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="flex whitespace-nowrap gap-12 items-center"
          >
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-white text-sm font-bold uppercase tracking-[0.3em]">HICAPS Accepted</span>
                <div className="w-2 h-2 rounded-full bg-sage" />
                <span className="text-white/60 text-sm font-serif italic">Instant Private Health Rebates</span>
                <div className="w-2 h-2 rounded-full bg-sage" />
              </div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Service Gallery Section */}
      {features.showServices && (
        <section id="services" className="py-24 bg-section">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-16 space-y-4">
              <span className="text-sage text-[10px] font-bold uppercase tracking-[0.4em] block">
                {config.landingPageContent.services.subtitle}
              </span>
              <h2 className="text-5xl font-serif font-bold text-primary">
                {config.landingPageContent.services.title}
              </h2>
              <p className="mt-4 text-earth/40 text-sm font-medium uppercase tracking-widest flex items-center justify-center gap-2">
                <span className="w-8 h-[1px] bg-beige" />
                HICAPS Available for All Treatments
                <span className="w-8 h-[1px] bg-beige" />
              </p>
            </div>
            <ServiceGallery onSelectService={onBookNow} />
          </div>
        </section>
      )}

      {/* Customer Reviews Section */}
      {features.showReviews && <CustomerReviews />}

      {/* Quick Booking Form Section */}
      {features.showQuickBooking && <QuickBookingForm />}

      {/* Footer */}
      <footer id="contact" className="bg-primary text-white py-20 px-6 mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
          <div className="space-y-6">
            <h4 className="font-serif text-3xl font-bold tracking-tight">{config.name}</h4>
            <div className="space-y-4 text-white/70">
              <div className="flex items-start gap-4">
                <MapPin size={20} className="text-sage flex-shrink-0" />
                <p>{config.location}</p>
              </div>
              <div className="flex items-center gap-4">
                <Phone size={20} className="text-sage flex-shrink-0" />
                <p>{config.phone}</p>
              </div>
              <div className="flex items-center gap-4">
                <MessageSquare size={20} className="text-sage flex-shrink-0" />
                <p>{config.email}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:items-end justify-center gap-6">
            <div className="flex gap-4">
              <a href="#" className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-primary transition-all">
                <Instagram size={24} />
              </a>
              <a href="#" className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-primary transition-all">
                <Facebook size={24} />
              </a>
            </div>
            <p className="text-white/40 text-[10px] uppercase tracking-[0.3em] flex items-center gap-4">
              © 2026 {config.name}
              <button 
                onClick={onStaffLogin}
                className="opacity-20 hover:opacity-100 transition-opacity cursor-pointer"
              >
                Staff Login
              </button>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
