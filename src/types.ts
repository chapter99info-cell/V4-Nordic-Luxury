export interface User {
  uid: string;
  email: string;
  phoneNumber?: string;
  displayName?: string;
  photoURL?: string;
  role: 'owner' | 'admin' | 'staff' | 'client';
  shopId?: string;
  createdAt: string;
  medicalAlerts?: string;
  painPoints?: string[];
  painLevel?: number;
}

export interface Service {
  id: string;
  name: string;
  type?: string;
  description: string;
  fullPrice: number;
  depositAmount: number;
  duration: number;
  image: string;
  rates: { [key: string]: number };
  bestFor: string;
  keyBenefits: string[];
  isActive: boolean;
  badge?: string;
}

export interface PromoSettings {
  isEnabled: boolean;
  discountPercentage: number;
  updatedAt: any;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  label?: string;
  avatar: string;
  imageUrl?: string;
  specialties: string[];
  status: 'Working' | 'Off';
  locationStatus?: 'At the Beach' | 'In-Store';
  isActive: boolean;
  fcmToken?: string;
  createdAt?: string;
}

export interface Holiday {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  message: string;
  type: 'holiday' | 'emergency';
  isActive: boolean;
}

export interface Booking {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  serviceId?: string;
  serviceName: string;
  therapistId?: string;
  therapistName?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  duration: number;
  price?: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'waiting-for-deposit' | 'payment_pending' | 'payment_rejected' | 'completed' | 'no-show';
  paymentStatus: 'unpaid' | 'deposit-paid' | 'fully-paid' | 'pending-verification';
  isWalkIn: boolean;
  shopId?: string;
  createdAt: string;
  updatedAt?: string;
  needsHealthFundRebate?: boolean;
  useCoconutOil?: boolean;
  depositPaid: boolean;
  depositAmountPaid?: number;
  intakeFormCompleted: boolean;
  paymentMethod?: 'Cash' | 'Transfer' | 'Card';
  paymentSlipUrl?: string;
  isCashCollectedByOwner?: boolean;
  subtotal?: number;
  discount?: number;
  source?: 'AI Assistant' | 'Web' | 'Walk-in' | 'Manual' | 'Website';
  note?: string;
  slotId?: string;
  isReturning?: boolean;
  type?: 'cleaning';
  pricingLogic?: {
    basePrice: number;
    gstAmount: number;
    totalPrice: number;
    depositRequired: number;
    currency: string;
  };
}

export interface Product {
  id: string;
  name: string;
  price: number;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking_assigned' | 'booking_cancelled' | 'payment_received' | 'system';
  bookingId?: string;
  isRead: boolean;
  createdAt: any; // Firestore Timestamp
}
