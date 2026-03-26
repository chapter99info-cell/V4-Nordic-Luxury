import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SlipUpload } from './SlipUpload';
import { 
  CreditCard, Banknote, Landmark, Copy, 
  CheckCircle, ExternalLink, Info, Upload, Image as ImageIcon, Loader2, Camera, X as LucideX, Tag
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { PromoSettings } from '../types';

interface PaymentSelectionProps {
  serviceName: string;
  originalPrice: number;
  promo?: PromoSettings | null;
  loading?: boolean;
  onConfirm: (paymentMethod: 'card' | 'cash', finalPrice: number, slipFile?: File) => void;
}

import { shopConfig } from '../config/shopConfig';

export const PaymentSelection: React.FC<PaymentSelectionProps> = ({ serviceName, originalPrice, promo, loading, onConfirm }) => {
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'cash' | null>(null);
  const [copied, setCopied] = useState(false);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply Global Promo Discount first
  const basePrice = promo?.isEnabled 
    ? originalPrice * (1 - promo.discountPercentage / 100) 
    : originalPrice;

  // Additional 5% discount for cash/transfer
  const cashDiscountAmount = basePrice * 0.05;
  const cashPrice = basePrice - cashDiscountAmount;
  
  // Card price is deposit if enabled
  const cardPrice = shopConfig.paymentGateway.enableDeposit 
    ? basePrice * (shopConfig.paymentGateway.depositPercentage / 100)
    : basePrice;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSlipFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlipPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = async () => {
    if (!selectedMethod) return;

    // We now pass the file back to the parent component (BookingModal) 
    // so it can create the booking first and then upload to a folder named after the booking ID.
    onConfirm(selectedMethod, selectedMethod === 'cash' ? cashPrice : cardPrice, slipFile || undefined);
  };

  // ข้อมูลบัญชีร้าน (ปรับแก้ตามจริง)
  const bankDetails = {
    bank: 'Commonwealth Bank',
    accountName: 'Chapter99 Studio',
    bsb: '062-123',
    accountNumber: '1234 5678',
    payId: 'chapter99info@gmail.com'
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-8 bg-white rounded-[3rem] shadow-xl border border-beige/20">
      
      {/* Header สรุปยอด */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-serif font-bold text-[#4A5D23]">Payment Method</h2>
        <p className="text-[#8E9D7A] text-sm">Select how you'd like to pay for {serviceName}</p>
      </div>

      <div className="space-y-4">
        {/* Option 1: Pay by Card */}
        <motion.div
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setSelectedMethod('card')}
          className={`relative p-5 rounded-3xl border-2 cursor-pointer transition-all ${
            selectedMethod === 'card' 
              ? 'border-[#4A5D23] bg-[#4A5D23]/5' 
              : 'border-beige/30 hover:border-[#4A5D23]/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${selectedMethod === 'card' ? 'bg-[#4A5D23] text-white' : 'bg-gray-100 text-gray-500'}`}>
                <CreditCard size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">
                  {shopConfig.paymentGateway.enableDeposit ? 'Pay Deposit by Card' : 'Credit / Debit Card'}
                </h3>
                <p className="text-xs text-gray-500">
                  {shopConfig.paymentGateway.enableDeposit 
                    ? `Pay ${shopConfig.paymentGateway.depositPercentage}% deposit to secure booking` 
                    : 'Standard online payment'}
                </p>
              </div>
            </div>
            <div className="text-right">
              {promo?.isEnabled && (
                <span className="text-[10px] text-gray-400 line-through block">${originalPrice.toFixed(2)}</span>
              )}
              <span className="text-lg font-bold text-gray-800">${cardPrice.toFixed(2)}</span>
            </div>
          </div>
        </motion.div>

        {/* Option 2: Pay by Cash / Transfer (มีส่วนลด 5%) */}
        <motion.div
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setSelectedMethod('cash')}
          className={`relative p-5 rounded-3xl border-2 cursor-pointer transition-all ${
            selectedMethod === 'cash' 
              ? 'border-[#4A5D23] bg-[#4A5D23]/5 shadow-lg shadow-[#4A5D23]/10' 
              : 'border-beige/30 hover:border-[#4A5D23]/30'
          }`}
        >
          {/* Badge 5% OFF */}
          <div className="absolute -top-3 -right-3 bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md animate-pulse">
            SAVE 5%
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${selectedMethod === 'cash' ? 'bg-[#4A5D23] text-white' : 'bg-gray-100 text-gray-500'}`}>
                <Banknote size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Cash or Direct Transfer</h3>
                <p className="text-xs text-gray-500">Zero fees for us, discount for you</p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="text-sm text-gray-400 line-through">${basePrice.toFixed(2)}</span>
              <span className="text-xl font-bold text-[#4A5D23]">${cashPrice.toFixed(2)}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bank Details Dropdown (แสดงเมื่อเลือก Cash/Transfer) */}
      <AnimatePresence>
        {selectedMethod === 'cash' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
              <div className="flex items-center gap-2 text-[#4A5D23] font-bold text-sm mb-2">
                <Landmark size={18} />
                <span>Bank Transfer Details (PayID)</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">PayID / Email</p>
                  <p className="font-bold text-gray-800">{bankDetails.payId}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Account Name</p>
                  <p className="font-bold text-gray-800">{bankDetails.accountName}</p>
                </div>
              </div>

              {/* ปุ่ม Copy PayID */}
              <button 
                onClick={() => handleCopy(bankDetails.payId)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {copied ? <CheckCircle size={16} className="text-emerald-500" /> : <Copy size={16} />}
                {copied ? 'Copied to clipboard!' : 'Copy PayID'}
              </button>

              {/* ลิงก์ YouTube อธิบายการจ่ายเงิน */}
              <a 
                href="https://youtu.be/6FTltcGPSh0?si=Cjj-pO36QWXNl-Kh" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-start gap-2 text-xs text-blue-600 bg-blue-50 p-3 rounded-xl hover:bg-blue-100 transition-colors"
              >
                <Info size={20} className="shrink-0" />
                <span>Need help with mobile payments? Watch this quick guide on how to transfer using mobile apps.</span>
                <ExternalLink size={14} className="shrink-0 mt-0.5" />
              </a>

              {/* Slip Upload Section */}
              <div className="pt-2">
                <SlipUpload 
                  onFileSelect={(file) => setSlipFile(file)}
                  isUploading={uploading}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Button */}
      <button 
        disabled={!selectedMethod || (selectedMethod === 'cash' && !slipFile) || uploading || loading}
        onClick={handleConfirm}
        className={`w-full py-5 rounded-[2rem] font-bold text-white shadow-xl flex items-center justify-center gap-3 transition-all ${
          selectedMethod && (selectedMethod === 'card' || slipFile) && !loading
            ? 'bg-[#4A5D23] hover:bg-[#3A4A1A] hover:shadow-[#4A5D23]/30' 
            : 'bg-gray-300 cursor-not-allowed opacity-70'
        }`}
      >
        {uploading || loading ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            {loading ? 'Processing Booking...' : 'Uploading Slip...'}
          </>
        ) : (
          <>
            {selectedMethod === 'card' && shopConfig.paymentGateway.enableDeposit 
              ? `Pay Deposit & Book` 
              : 'Confirm & Book'} <CheckCircle size={20} />
          </>
        )}
      </button>
    </div>
  );
};
