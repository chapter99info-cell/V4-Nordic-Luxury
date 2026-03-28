import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { UserPlus, Trash2, Users, Camera, X } from 'lucide-react';
import { toast } from 'sonner';

const StaffManagement = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [newStaffNameEn, setNewStaffNameEn] = useState('');
  const [newStaffNameTh, setNewStaffNameTh] = useState('');
  const [newStaffPosition, setNewStaffPosition] = useState('PROFESSIONAL THERAPIST');
  const [newStaffGender, setNewStaffGender] = useState('Female');
  const [newStaffPhoto, setNewStaffPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [passcode, setPasscode] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Login 1111 ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === '1111') {
      setIsAdmin(true);
    } else {
      toast.error('รหัสไม่ถูกต้องค่ะ');
      setPasscode('');
    }
  };

  // --- Load Data from LocalStorage ---
  useEffect(() => {
    if (!isAdmin) return;
    try {
      const savedStaff = localStorage.getItem('mira_staff_list');
      if (savedStaff) {
        setStaff(JSON.parse(savedStaff));
      }
    } catch (error) {
      console.error("Error loading staff from localStorage:", error);
      toast.error("โหลดข้อมูลพนักงานไม่สำเร็จค่ะ");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  // --- Handle Photo Upload (Base64) ---
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewStaffPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Add Staff (Save to LocalStorage) ---
  const handleAddStaff = () => {
    if (newStaffNameEn.trim() === '' || newStaffNameTh.trim() === '') {
      toast.error("กรุณากรอกชื่อทั้งภาษาไทยและอังกฤษค่ะ");
      return;
    }
    
    const newMember = {
      id: Date.now().toString(), // Unique ID
      nameEn: newStaffNameEn,
      nameTh: newStaffNameTh,
      gender: newStaffGender,
      position: newStaffPosition,
      photo: newStaffPhoto || `https://picsum.photos/seed/${Date.now()}/400/400`,
      role: "Therapist",
      status: "Active",
      createdAt: new Date().toISOString()
    };

    const updatedStaff = [...staff, newMember];
    setStaff(updatedStaff);
    localStorage.setItem('mira_staff_list', JSON.stringify(updatedStaff));
    
    setNewStaffNameEn('');
    setNewStaffNameTh('');
    setNewStaffPhoto(null);
    toast.success("เพิ่มพนักงานเรียบร้อยค่ะ!");
  };

  // --- Delete Staff (Update LocalStorage) ---
  const handleDelete = (id: string) => {
    if (window.confirm("ต้องการลบพนักงานคนนี้ใช่ไหมคะ?")) {
      const updatedStaff = staff.filter(member => member.id !== id);
      setStaff(updatedStaff);
      localStorage.setItem('mira_staff_list', JSON.stringify(updatedStaff));
      toast.success("ลบสำเร็จค่ะ");
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
        <h2 className="text-xl font-bold mb-4 text-stone-700">🔐 กรุณาใส่รหัสผ่านผู้ดูแล</h2>
        <form onSubmit={handleLogin} className="flex gap-2">
          <input 
            type="password" 
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="รหัส 4 หลัก..."
            className="border rounded-xl px-4 py-2 w-32 text-center text-2xl tracking-widest outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />
          <button type="submit" className="bg-stone-800 text-white px-6 py-2 rounded-xl hover:bg-black transition-all">
            ตกลง
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-[2.5rem] shadow-sm border-2 border-[#D4AF37]/20">
      <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-12">
        <div className="flex-1 w-full">
          <h2 className="text-4xl font-black mb-8 text-[#1a3a3a] flex items-center gap-3">
            <Users className="w-10 h-10 text-[#D4AF37]" /> จัดการทีมพนักงาน
          </h2>
          
          {/* --- Refined Add Staff Form --- */}
          <div className="bg-[#FDFBF7] p-8 rounded-[2rem] border-2 border-[#D4AF37]/10 shadow-inner">
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
              {/* Photo Upload Area */}
              <div className="relative group">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden cursor-pointer bg-stone-200 flex items-center justify-center group-hover:brightness-90 transition-all"
                >
                  {newStaffPhoto ? (
                    <img src={newStaffPhoto} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Camera className="w-10 h-10 text-stone-400" />
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handlePhotoChange} 
                  className="hidden" 
                  accept="image/*"
                />
                {newStaffPhoto && (
                  <button 
                    onClick={() => setNewStaffPhoto(null)}
                    className="absolute -top-1 -right-1 bg-rose-500 text-white p-1 rounded-full shadow-lg hover:bg-rose-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Form Inputs */}
              <div className="flex-1 grid grid-cols-1 gap-4 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    value={newStaffNameEn}
                    onChange={(e) => setNewStaffNameEn(e.target.value)}
                    placeholder="Name (English)..."
                    className="border-2 border-[#D4AF37]/10 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-[#D4AF37] outline-none bg-white text-lg font-medium"
                  />
                  <input 
                    type="text" 
                    value={newStaffNameTh}
                    onChange={(e) => setNewStaffNameTh(e.target.value)}
                    placeholder="ชื่อพนักงาน (ภาษาไทย)..."
                    className="border-2 border-[#D4AF37]/10 rounded-2xl px-5 py-3 focus:ring-2 focus:ring-[#D4AF37] outline-none bg-white text-lg font-medium"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select 
                    value={newStaffPosition}
                    onChange={(e) => setNewStaffPosition(e.target.value)}
                    className="border-2 border-[#D4AF37]/10 rounded-2xl px-5 py-3 bg-white outline-none text-lg font-medium"
                  >
                    <option value="PROFESSIONAL THERAPIST">PROFESSIONAL THERAPIST</option>
                    <option value="SENIOR THERAPIST">SENIOR THERAPIST</option>
                    <option value="MASTER THERAPIST">MASTER THERAPIST</option>
                    <option value="RECEPTIONIST">RECEPTIONIST</option>
                  </select>
                  <select 
                    value={newStaffGender}
                    onChange={(e) => setNewStaffGender(e.target.value)}
                    className="border-2 border-[#D4AF37]/10 rounded-2xl px-5 py-3 bg-white outline-none text-lg font-medium"
                  >
                    <option value="Female">เพศหญิง (Female)</option>
                    <option value="Male">เพศชาย (Male)</option>
                    <option value="Other">อื่นๆ (Other)</option>
                  </select>
                </div>

                <button 
                  onClick={handleAddStaff}
                  className="mt-2 bg-[#D4AF37] text-white px-8 py-4 rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:bg-[#b8962d] transition-all shadow-lg hover:shadow-[#D4AF37]/40 active:scale-95"
                >
                  <UserPlus size={24} /> เพิ่มพนักงาน / Add Staff
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- Preview Card --- */}
        <div className="hidden xl:block w-80">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 text-center">Preview Card</p>
          <div className="bg-white border-2 border-[#D4AF37]/20 rounded-[2.5rem] p-8 shadow-xl flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-full border-4 border-[#FDFBF7] shadow-lg overflow-hidden mb-6 bg-stone-100">
              <img src={newStaffPhoto || 'https://picsum.photos/seed/staff/400/400'} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <h3 className="staff-card-title text-[#1a3a3a] mb-1">
              {newStaffNameEn || 'Employee Name'}
            </h3>
            <p className="staff-card-name-th text-[#1a3a3a] mb-4">
              {newStaffNameTh || 'ชื่อพนักงาน'}
            </p>
            <div className="w-12 h-0.5 bg-[#D4AF37]/30 mb-4" />
            <p className="staff-card-position text-[#1a3a3a]">
              {newStaffPosition}
            </p>
          </div>
        </div>
      </div>

      {/* --- Responsive Staff Grid --- */}
      <div className="staff-grid">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-[#2D241E]/60 font-bold text-xl">กำลังโหลดข้อมูลพนักงาน...</p>
          </div>
        ) : staff.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-stone-50 rounded-[2rem] border-2 border-dashed border-stone-200">
            <p className="text-[#2D241E]/40 italic text-xl">ยังไม่มีพนักงานในระบบค่ะ</p>
          </div>
        ) : staff.map((member) => (
          <div 
            key={member.id} 
            className="relative bg-white border-2 border-[#D4AF37]/10 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center group"
          >
            {/* Delete Button */}
            <button 
              onClick={() => handleDelete(member.id)}
              className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 p-3 text-rose-400 hover:bg-rose-50 rounded-full transition-all z-10"
              title="ลบพนักงาน"
            >
              <Trash2 size={24} />
            </button>

            {/* Employee Photo */}
            <div className="w-32 h-32 rounded-full border-4 border-[#FDFBF7] shadow-lg overflow-hidden mb-6 bg-stone-100 group-hover:scale-105 transition-transform duration-500">
              <img 
                src={member.photo || `https://picsum.photos/seed/${member.id}/400/400`} 
                alt={member.nameEn} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer" 
              />
            </div>

            {/* Employee Info */}
            <h3 className="staff-card-title text-[#1a3a3a] mb-1">
              {member.nameEn}
            </h3>
            <p className="staff-card-name-th text-[#1a3a3a] mb-4">
              {member.nameTh}
            </p>
            
            <div className="w-12 h-0.5 bg-[#D4AF37]/30 mb-4" />
            
            <p className="staff-card-position text-[#1a3a3a]">
              {member.position || 'THERAPIST'}
            </p>

            {/* Gender Badge */}
            <div className={`mt-6 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              member.gender === 'Male' ? 'bg-blue-50 text-blue-500' : 
              member.gender === 'Female' ? 'bg-pink-50 text-pink-500' : 
              'bg-gray-50 text-gray-500'
            }`}>
              {member.gender}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaffManagement;
