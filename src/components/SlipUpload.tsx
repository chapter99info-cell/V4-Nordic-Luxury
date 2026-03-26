import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UploadCloud, CheckCircle, X, Image as ImageIcon } from 'lucide-react';

interface SlipUploadProps {
  onFileSelect: (file: File | null) => void;
  isUploading?: boolean;
}

export const SlipUpload: React.FC<SlipUploadProps> = ({ onFileSelect, isUploading }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      onFileSelect(file);
    } else {
      alert('Please upload an image file (JPG, PNG)');
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    onFileSelect(null);
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-white rounded-[3rem] shadow-xl border border-beige/20 text-center">
      <h2 className="text-2xl font-serif font-bold text-[#4A5D23] mb-2">Upload Slip</h2>
      <p className="text-[#8E9D7A] text-sm mb-8">Please attach your transfer receipt to confirm the booking.</p>

      {!previewUrl ? (
        // สถานะ: ยังไม่ได้เลือกรูป
        <label className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-[#8E9D7A]/40 rounded-[2rem] cursor-pointer hover:bg-[#4A5D23]/5 hover:border-[#4A5D23] transition-all group">
          <UploadCloud size={40} className="text-[#8E9D7A] group-hover:text-[#4A5D23] mb-3 transition-colors" />
          <span className="text-sm font-bold text-gray-600">Tap to choose image</span>
          <span className="text-xs text-gray-400 mt-1">JPG or PNG up to 5MB</span>
          <input 
            type="file" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
            accept="image/*"
            onChange={handleFileChange}
          />
        </label>
      ) : (
        // สถานะ: เลือกรูปแล้ว (พรีวิว)
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative">
          <div className="w-full h-48 rounded-[2rem] overflow-hidden border-2 border-[#4A5D23] shadow-md">
            <img src={previewUrl} alt="Slip Preview" className="w-full h-full object-cover" />
          </div>
          <button 
            onClick={clearSelection}
            className="absolute -top-3 -right-3 bg-white text-rose-500 p-1.5 rounded-full shadow-lg border border-gray-100 hover:bg-rose-50 transition-colors"
          >
            <X size={16} strokeWidth={3} />
          </button>
        </motion.div>
      )}

      {/* Status indicator */}
      {selectedFile && (
        <div className="mt-4 flex items-center justify-center gap-2 text-[#4A5D23] font-bold text-sm">
          <CheckCircle size={18} />
          <span>Receipt attached</span>
        </div>
      )}
    </div>
  );
};
