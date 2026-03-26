import React from 'react';
import { motion } from 'motion/react';
import { shopConfig } from '../config/shopConfig';
import { MapPin, Phone, Mail, Clock, Award, Heart, ShieldCheck, Users } from 'lucide-react';

export const AboutUs = () => {
  return (
    <div className="space-y-12 pb-20">
      {/* Hero Section */}
      <div className="relative h-[40vh] rounded-[3rem] overflow-hidden">
        <img 
          src={shopConfig.heroImage} 
          alt={`About ${shopConfig.name}`} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent flex items-end p-12">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Our Story</h2>
            <p className="text-white/80 text-lg font-light leading-relaxed">
              {shopConfig.description}
            </p>
          </div>
        </div>
      </div>

      {/* Philosophy & Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: Heart, title: 'Compassionate Care', desc: 'We treat every client with the utmost respect and personalized attention to their specific needs.' },
          { icon: Award, title: 'Certified Expertise', desc: 'Our therapists are highly trained and accredited, bringing years of experience in remedial techniques.' },
          { icon: ShieldCheck, title: 'Safe Sanctuary', desc: 'We maintain the highest standards of hygiene and professionalism in our tranquil healing space.' },
        ].map((value, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-[2.5rem] border border-beige/20 shadow-sm hover:shadow-md transition-all text-center"
          >
            <div className="w-16 h-16 bg-section rounded-2xl flex items-center justify-center text-primary mx-auto mb-6">
              <value.icon size={32} />
            </div>
            <h3 className="text-xl font-serif font-bold text-primary mb-4">{value.title}</h3>
            <p className="text-earth/60 text-sm leading-relaxed">{value.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Detailed Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div>
            <span className="text-sage text-xs font-bold uppercase tracking-[0.4em] mb-4 block">The MIRA Experience</span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary mb-6">Why Choose Us?</h2>
            <p className="text-earth/70 leading-relaxed mb-6">
              At MIRA Remedial Thai Massage, we believe that true healing comes from a holistic approach. Our sanctuary combines the ancient wisdom of traditional Thai massage with modern remedial techniques to address chronic pain, stress, and physical tension.
            </p>
            <p className="text-earth/70 leading-relaxed">
              Whether you're seeking clinical recovery or a peaceful escape from the daily grind, our expert therapists are dedicated to helping you achieve your wellness goals in a serene, professional environment.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-primary">500+</p>
                <p className="text-[10px] text-earth/40 uppercase tracking-widest font-bold">Happy Clients</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                <Award size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-primary">Year One</p>
                <p className="text-[10px] text-earth/40 uppercase tracking-widest font-bold">Experience</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-section rounded-[3rem] p-10 space-y-8 border border-beige/20 shadow-inner">
          <h4 className="text-2xl font-serif font-bold text-primary mb-4">Contact Information</h4>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <MapPin size={24} className="text-sage mt-1" />
              <div>
                <p className="text-sm font-bold text-primary">Our Location</p>
                <p className="text-sm text-earth/60">{shopConfig.location}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Phone size={24} className="text-sage mt-1" />
              <div>
                <p className="text-sm font-bold text-primary">Phone Number</p>
                <p className="text-sm text-earth/60">{shopConfig.phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Mail size={24} className="text-sage mt-1" />
              <div>
                <p className="text-sm font-bold text-primary">Email Address</p>
                <p className="text-sm text-earth/60">hello@miramassage.com.au</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Clock size={24} className="text-sage mt-1" />
              <div>
                <p className="text-sm font-bold text-primary">Opening Hours</p>
                <p className="text-sm text-earth/60">Mon - Sun: 10:00 AM - 8:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
