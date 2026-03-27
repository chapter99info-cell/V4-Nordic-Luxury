import { Service, Holiday } from '../types';

export interface ShopConfig {
  shopId: string;
  name: string;
  description: string;
  location: string;
  phone: string;
  email: string;
  address: string;
  websiteUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  logo: string;
  heroImage: string;
  promoVideo?: string;
  currency: string;
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
  featureFlags: {
    showReviews: boolean;
    showGallery: boolean;
    showAboutUs: boolean;
    showAtmosphere: boolean;
    showMarquee: boolean;
    showServices: boolean;
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
    about: {
      title: string;
      subtitle: string;
      description: string;
      philosophy: string;
      values: string[];
    };
  };
  paymentGateway: {
    provider: string;
    accountId: string;
    taxRate: number;
    enableDeposit: boolean;
    depositPercentage: number;
  };
  aiPersona: {
    name: string;
    language: string[];
    greetingMsg: string;
  };
  lineChannelAccessToken?: string;
  lineAdminUserId?: string;
  services: Service[];
  holidays: Holiday[];
}

export const shopConfig: ShopConfig = {
  shopId: import.meta.env?.VITE_SHOP_ID ?? "SHOP_001",
  name: "Mira Royale",
  description: "Traditional Thai healing meets modern clinical precision. Experience the art of massage in a sanctuary designed for your recovery.",
  location: "Australia/Sydney",
  phone: "+61 3 9876 5432",
  email: "chapter99info@gmail.com",
  address: "123 Cook St, Forestville NSW 2087",
  websiteUrl: "https://www.chapter99.com.au",
  instagramUrl: "https://www.instagram.com/chapter99",
  facebookUrl: "https://www.facebook.com/chapter99",
  logo: "https://firebasestorage.googleapis.com/v0/b/studio-6487656110-a5b1f.firebasestorage.app/o/Thai%20Massage%20Master%20temple%202026%2Fphotos%2FLogo%2FLogo%20-%20MIRA-02.jpg?alt=media&token=640b06a3-76f3-40a2-9167-eb37670ab911",
  heroImage: "https://firebasestorage.googleapis.com/v0/b/studio-6487656110-a5b1f.firebasestorage.app/o/Thai%20Massage%20Master%20temple%202026%2Fphotos%2FCover%20Hero%2F0001.png?alt=media&token=c25ad649-3529-4dd7-b4ef-db7f7c3880f0",
  promoVideo: "https://firebasestorage.googleapis.com/v0/b/studio-6368441530-fca54.firebasestorage.app/o/chapter99%20studio%2FMira%20Thai%20Massage%2FVDO%2FMix02.mp4?alt=media&token=8ec782aa-c9d5-4487-a5bc-505c4529fa66",
  currency: "AUD",
  lineChannelAccessToken: "YOUR_LINE_CHANNEL_ACCESS_TOKEN",
  lineAdminUserId: "YOUR_LINE_ADMIN_USER_ID",
  themeColors: {
    primary: "#D4AF37",
    secondary: "#1A1A1B",
    accent: "#D4AF37",
    background: "#FDFBF7",
    section: "#FAFAF5",
    earth: "#2D241E",
    sage: "#D4AF37",
    beige: "#F5F5F0",
    gold: "#D4AF37",
  },
  featureFlags: {
    showReviews: true,
    showGallery: true,
    showAboutUs: true,
    showAtmosphere: true,
    showMarquee: true,
    showServices: true,
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
    about: {
      title: "OUR STORY",
      subtitle: "A JOURNEY OF HEALING",
      description: "Founded on the principles of traditional Thai medicine and modern anatomical science, Mira Royale was born from a desire to provide more than just a massage. We provide a path to recovery.",
      philosophy: "We believe that true healing occurs when the body and mind are in perfect harmony. Our treatments are designed to restore this balance, using techniques passed down through generations, refined for the modern world.",
      values: [
        "Authenticity in every touch",
        "Clinical precision in treatment",
        "Sanctuary for the senses",
        "Commitment to your recovery"
      ]
    }
  },
  paymentGateway: {
    provider: "Stripe",
    accountId: "acct_123456789",
    taxRate: 0.1,
    enableDeposit: true,
    depositPercentage: 50
  },
  aiPersona: {
    name: "Mira",
    language: ["en", "th"],
    greetingMsg: "Sawasdee kha! Welcome to Mira Royale. I am Mira, your personal assistant. How may I assist you today?"
  },
  services: [
    {
      id: "s1",
      name: "Remedial Massage",
      type: "Clinical",
      description: "Targeted treatment for specific injuries or chronic pain. HICAPS available for instant rebates.",
      fullPrice: 100,
      depositAmount: 50,
      duration: 60,
      image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=800&h=600",
      rates: { "60": 100, "90": 145, "120": 190 },
      bestFor: "Injury recovery & chronic pain",
      keyBenefits: ["HICAPS Rebates", "Pain Management", "Improved Mobility"],
      isActive: true,
      badge: "HICAPS AVAILABLE"
    },
    {
      id: "s2",
      name: "Thai Traditional Massage",
      type: "Traditional",
      description: "Ancient healing technique combining rhythmic pressure and yoga-like stretching.",
      fullPrice: 90,
      depositAmount: 45,
      duration: 60,
      image: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&q=80&w=800&h=600",
      rates: { "60": 90, "90": 135, "120": 180 },
      bestFor: "Flexibility & energy flow",
      keyBenefits: ["Increased Flexibility", "Energy Boost", "Stress Relief"],
      isActive: true
    },
    {
      id: "s3",
      name: "Aromatherapy Oil Massage",
      type: "Relaxation",
      description: "Gentle massage using essential oils to soothe the mind and body.",
      fullPrice: 95,
      depositAmount: 45,
      duration: 60,
      image: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&q=80&w=800&h=600",
      rates: { "60": 95, "90": 140, "120": 185 },
      bestFor: "Deep relaxation & mental calm",
      keyBenefits: ["Mental Clarity", "Skin Nourishment", "Deep Sleep"],
      isActive: true
    },
    {
      id: "s4",
      name: "Foot Reflexology",
      type: "Traditional",
      description: "Pressure point massage on the feet to stimulate internal organ health.",
      fullPrice: 60,
      depositAmount: 30,
      duration: 30,
      image: "https://images.unsplash.com/photo-1519824141121-b97674372073?auto=format&fit=crop&q=80&w=800&h=600",
      rates: { "30": 60, "45": 80, "60": 95 },
      bestFor: "Tired feet & overall wellness",
      keyBenefits: ["Improved Circulation", "Detoxification", "Foot Health"],
      isActive: true
    },
    {
      id: "s5",
      name: "Deep Tissue",
      type: "Focus",
      description: "Intense pressure targeting the neck, shoulders, and back to release tension.",
      fullPrice: 65,
      depositAmount: 30,
      duration: 30,
      image: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&q=80&w=800&h=600",
      rates: { "30": 65, "45": 85, "60": 100 },
      bestFor: "Upper body tension & desk workers",
      keyBenefits: ["Tension Release", "Posture Correction", "Focus Area Relief"],
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
