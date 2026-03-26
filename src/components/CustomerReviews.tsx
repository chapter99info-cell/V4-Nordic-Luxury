import React from 'react';
import { motion } from 'motion/react';
import { Star, Quote } from 'lucide-react';

const reviews = [
  {
    id: 1,
    name: "Kanya S.",
    comment: "The best remedial massage in Sydney! Nara really knows how to target deep muscle tension. I felt like a new person after my session.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
    service: "Remedial Thai Massage"
  },
  {
    id: 2,
    name: "James Wilson",
    comment: "Incredible atmosphere and professional staff. The aromatherapy oil massage was exactly what I needed to destress. Highly recommend!",
    rating: 5,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
    service: "Aromatherapy Oil Massage"
  },
  {
    id: 3,
    name: "Pimchanok T.",
    comment: "Authentic Thai techniques combined with modern clinical knowledge. Somchai is a master of stretching. My flexibility has improved so much.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
    service: "Traditional Thai Massage"
  },
  {
    id: 4,
    name: "David Chen",
    comment: "Clean, peaceful, and professional. The deep tissue therapy was intense but very effective for my chronic back pain. I'll be back!",
    rating: 5,
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150",
    service: "Deep Tissue Therapy"
  }
];

export const CustomerReviews = () => {
  return (
    <section className="py-24 bg-section relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-sage/5 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-sage text-xs font-bold uppercase tracking-[0.3em] mb-4 block"
          >
            Testimonials
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-serif font-bold text-primary mb-6"
          >
            What Our Clients Say
          </motion.h2>
          <motion.div 
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-24 h-1 bg-secondary mx-auto rounded-full"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-8 rounded-[2.5rem] border border-beige/20 shadow-sm hover:shadow-xl transition-all group relative"
            >
              <div className="absolute top-6 right-8 text-primary/5 group-hover:text-primary/10 transition-colors">
                <Quote size={48} />
              </div>

              <div className="flex gap-1 mb-6">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} size={14} className="fill-secondary text-secondary" />
                ))}
              </div>

              <p className="text-earth/70 text-sm leading-relaxed mb-8 italic">
                "{review.comment}"
              </p>

              <div className="flex items-center gap-4 mt-auto">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-beige/20 group-hover:border-primary/20 transition-colors">
                  <img 
                    src={review.image} 
                    alt={review.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-primary">{review.name}</h4>
                  <p className="text-[10px] text-sage font-bold uppercase tracking-widest">{review.service}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Modern "Playful" element - Marquee or floating stats */}
        <div className="mt-20 flex flex-wrap justify-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="text-center">
            <p className="text-3xl font-serif font-bold text-primary">4.9/5</p>
            <p className="text-[10px] font-bold uppercase tracking-widest">Google Rating</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-serif font-bold text-primary">2k+</p>
            <p className="text-[10px] font-bold uppercase tracking-widest">Happy Clients</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-serif font-bold text-primary">15+</p>
            <p className="text-[10px] font-bold uppercase tracking-widest">Master Therapists</p>
          </div>
        </div>
      </div>
    </section>
  );
};
