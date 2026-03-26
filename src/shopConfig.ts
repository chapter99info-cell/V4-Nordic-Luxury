import { Service, Staff, Holiday } from './types';

export interface ShopConfig {
  shopId: string;
  name: string;
  description: string;
  location: string;
  phone: string;
  email: string;
  logo: string;
  heroImage: string;
  promoVideo?: string;
  themeColors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    section: string;
    earth: string;
    sage: string;
    beige: string;
    gold: string;
  };
  landingPageFeatures: {
    showAtmosphere: boolean;
    showMarquee: boolean;
    showServices: boolean;
    showReviews: boolean;
    showQuickBooking: boolean;
  };
  landingPageContent: {
    hero: {
      badge: string;
      title: string;
      subtitle: string;
      cta: string;
    };
    atmosphere: {
      title: string;
      subtitle: string;
      description: string;
    };
    services: {
      title: string;
      subtitle: string;
    };
    reviews: {
      title: string;
      subtitle: string;
    };
  };
  services: Service[];
  holidays: Holiday[];
}

export const shopConfig: ShopConfig = {
  shopId: "SHOP01",
  name: "MIRA ROYALE V4",
  description: "Traditional Thai healing meets modern clinical precision. Experience the art of massage in a sanctuary designed for your recovery.",
  location: "Altona, Melbourne, VIC 3018",
  phone: "+61 3 9876 5432",
  email: "mira.royale@example.com",
  logo: "https://firebasestorage.googleapis.com/v0/b/studio-6487656110-a5b1f.firebasestorage.app/o/Thai%20Massage%20Master%20temple%202026%2Fphotos%2FLogo%2FLogo%20-%20MIRA-02.jpg?alt=media&token=640b06a3-76f3-40a2-9167-eb37670ab911",
  heroImage: "https://firebasestorage.googleapis.com/v0/b/studio-6487656110-a5b1f.firebasestorage.app/o/Thai%20Massage%20Master%20temple%202026%2Fphotos%2FCover%20Hero%2F0001.png?alt=media&token=c25ad649-3529-4dd7-b4ef-db7f7c3880f0",
  promoVideo: "https://firebasestorage.googleapis.com/v0/b/studio-6368441530-fca54.firebasestorage.app/o/chapter99%20studio%2FMira%20Thai%20Massage%2FVDO%2FMix02.mp4?alt=media&token=8ec782aa-c9d5-4487-a5bc-505c4529fa66",
  themeColors: {
    primary: "#4A5D23",
    secondary: "#C5A059",
    accent: "#8A9A5B",
    background: "#FFFFFF",
    section: "#FAFAF5",
    earth: "#2D2A26",
    sage: "#8A9A5B",
    beige: "#E5D3B3",
    gold: "#D4AF37",
  },
  landingPageFeatures: {
    showAtmosphere: true,
    showMarquee: true,
    showServices: true,
    showReviews: true,
    showQuickBooking: true,
  },
  landingPageContent: {
    hero: {
      badge: "TRADITIONAL THAI HEALING",
      title: "MIRA ROYALE",
      subtitle: "Traditional Thai healing meets modern clinical precision. Experience the art of massage in a sanctuary designed for your recovery.",
      cta: "BOOK YOUR SESSION",
    },
    atmosphere: {
      title: "THE ATMOSPHERE",
      subtitle: "A SANCTUARY FOR THE SENSES",
      description: "Step into a world where time slows down. Our space is designed to harmonize with your body's natural rhythm, using natural materials, soft lighting, and the gentle aroma of Thai herbs.",
    },
    services: {
      title: "OUR TREATMENTS",
      subtitle: "HEALING HANDS, ANCIENT WISDOM",
    },
    reviews: {
      title: "CLIENT STORIES",
      subtitle: "VOICES OF RECOVERY",
    },
  },
  services: [
    {
      id: "thai-relaxation-oil",
      name: "Thai Relaxation Combination with oil",
      type: "Massage",
      description: "A perfect blend of traditional Thai stretching and soothing aromatherapy oil. This treatment uses long, rhythmic strokes to reduce stress and improve circulation. Ideal for those seeking pure relaxation and a recharge for the body and mind.",
      fullPrice: 90,
      depositAmount: 30,
      duration: 60,
      image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=800&h=600",
      rates: { "30": 60, "45": 75, "60": 90, "90": 130 },
      bestFor: "Stress relief & pure relaxation",
      keyBenefits: ["Stress Relief", "Gentle Stretching", "Aromatherapy"],
      isActive: true
    },
    {
      id: "thai-deep-tissue-oil",
      name: "Thai Deep Tissue combination with oil",
      type: "Massage",
      description: "Designed to target chronic muscle tension and \"knots\" (trigger points). By using oil to reduce friction, our therapists can apply deeper pressure to reach underlying muscle layers more effectively without over-sensitivity.",
      fullPrice: 95,
      depositAmount: 30,
      duration: 60,
      image: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&q=80&w=800&h=600",
      rates: { "30": 65, "45": 80, "60": 95, "90": 135 },
      bestFor: "Chronic muscle tension & knots",
      keyBenefits: ["Muscle Recovery", "Firm Pressure", "Tension Release"],
      isActive: true
    },
    {
      id: "thai-massage-no-oil",
      name: "Traditional Thai (No Oil)",
      type: "Traditional",
      description: "The authentic \"dry\" Thai treatment. This session focuses on acupressure and passive yoga-like stretching to open the body’s energy lines and improve flexibility. No oil is used, and you will feel lighter and more aligned.",
      fullPrice: 95,
      depositAmount: 30,
      duration: 60,
      image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800&h=600",
      rates: { "30": 65, "45": 80, "60": 95, "90": 135 },
      bestFor: "Flexibility & traditional alignment",
      keyBenefits: ["Improved Flexibility", "Traditional Techniques", "Non-Greasy"],
      isActive: true
    },
    {
      id: "foot-massage",
      name: "Traditional Thai Foot",
      type: "Foot",
      description: "Focusing on reflex points on the soles of the feet, this treatment uses a traditional wooden stick and therapeutic pressure to stimulate internal organs and improve overall health. Includes a relaxing foot soak with flowers.",
      fullPrice: 75,
      depositAmount: 25,
      duration: 45,
      image: "https://images.unsplash.com/photo-1519824145371-296894a0daa9?auto=format&fit=crop&q=80&w=800&h=600",
      rates: { "30": 55, "45": 75, "60": 90 },
      bestFor: "Circulation & foot fatigue",
      keyBenefits: ["Reflexology", "Improved Circulation", "Deep Relaxation"],
      isActive: true
    },
    {
      id: "accredited-oil",
      name: "Treatment by accredited therapist (HICAPS) with oil",
      type: "Remedial",
      description: "A clinical approach to therapy performed by a certified professional. This treatment focuses on addressing specific physical issues, such as neck and shoulder pain or posture-related stiffness, using therapeutic oils for a smooth, effective session.",
      fullPrice: 100,
      depositAmount: 40,
      duration: 60,
      image: "https://images.unsplash.com/photo-1602928321679-560bb453f190?auto=format&fit=crop&q=80&w=800&h=600",
      rates: { "30": 70, "60": 100, "90": 150, "120": 200 },
      bestFor: "Specific physical issues & certified care",
      keyBenefits: ["Professional Therapy", "Targeted Healing", "Certified Care"],
      isActive: true
    },
    {
      id: "accredited-deep-tissue",
      name: "Treatment deep tissue by accredited therapist (HICAPS)",
      type: "Remedial",
      description: "(Our Signature Therapeutic Session) The highest level of clinical care. Our accredited therapists use deep tissue techniques to manage severe muscle tightness and structural imbalances, ensuring the most effective and comfortable deep-pressure experience.",
      fullPrice: 110,
      depositAmount: 40,
      duration: 60,
      image: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&q=80&w=800&h=600",
      rates: { "30": 75, "60": 105, "90": 155, "120": 205 },
      bestFor: "Severe muscle tightness & structural imbalances",
      keyBenefits: ["Maximum Pain Relief", "Clinical Expertise", "Deep Muscle Alignment"],
      isActive: true
    }
  ],
  holidays: [
    {
      id: 'songkran-2026',
      startDate: '2026-04-13',
      endDate: '2026-04-15',
      message: 'Happy Songkran! We are closed for the Thai New Year festival.',
      type: 'holiday',
      isActive: true
    },
    {
      id: 'christmas-2026',
      startDate: '2026-12-25',
      endDate: '2026-12-26',
      message: 'Merry Christmas! We are closed for the holidays.',
      type: 'holiday',
      isActive: true
    }
  ]
};
