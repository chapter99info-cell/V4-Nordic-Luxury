import React, { useState, useEffect } from 'react';
import { Camera, Trash2, UserPlus, Star } from 'lucide-react';
import { toast } from 'sonner';

interface StaffMember {
  id: string;
  name: string;
  nameEn: string;
  nameTh: string;
  position: string;
  role: string;
  gender: string;
  isActive: boolean;
  status: string;
  avatar: string;
}

export const StaffManagement: React.FC = () => {
  // --- 1. State ทั้งหมด ---
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [newStaffNameEn, setNewStaffNameEn] = useState('');
  const [newStaffNameTh, setNewStaffNameTh] = useState('');
  const [newStaffPosition, setNewStaffPosition] = useState('PROFESSIONAL THERAPIST');
  const [newStaffGender, setNewStaffGender] = useState('Female');
  const [newStaffPhoto, setNewStaffPhoto] = useState<string | null>(null);

  const STORAGE_KEY = 'mira_staff_data';

  // --- 2. โหลดข้อมูลจาก LocalStorage เมื่อเปิดหน้าจอ ---
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setStaff(JSON.parse(saved));
    }
  }, []);

  // --- 3. ฟังก์ชันจัดการรูปภาพ ---
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

  // --- 4. ฟังก์ชันเพิ่มพนักงาน (ตัวที่แก้บั๊กแล้ว) ---
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newStaffNameEn.trim()) {
      toast.error("กรุณากรอกชื่อภาษาอังกฤษด้วยค่ะ");
      return;
    }

    const newStaffMember: StaffMember = {
      id: Date.now().toString(),
      name: newStaffNameEn,
      nameEn: newStaffNameEn,
      nameTh: newStaffNameTh,
      position: newStaffPosition,
      role: newStaffPosition,
      gender: newStaffGender,
      isActive: true, // เปิดสวิตช์ให้หน้า Login เห็น
      status: 'Active',
      avatar: newStaffPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${newStaffNameEn}`,
    };

    const updatedList = [...staff, newStaffMember];
    setStaff(updatedList);
    
    // บันทึกลงลิ้นชักที่หน้า Login ใช้กุญแจเดียวกัน
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));

    // ล้างค่าฟอร์ม
    setNewStaffNameEn('');
    setNewStaffNameTh('');
    setNewStaffPhoto(null);
    
    toast.success('เพิ่มพนักงานเรียบร้อยแล้วค่ะ! 🎉');
  };

  // --- 5. ฟังก์ชันลบพนักงาน ---
  const handleDeleteStaff = (id: string) => {
    if (window.confirm('คุณแน่ใจนะว่าต้องการลบพนักงานท่านนี้?')) {
      const updated = staff.filter(s => s.id !== id);
      setStaff(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      toast.success('ลบข้อมูลเรียบร้อยค่ะ');
    }
  };

  // --- 6. ส่วนการแสดงผล (UI) ---
  return (
    <div className="p-4 max-w-4xl mx-auto space-y-8 font-sans">
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-[#1a3a3a] mb-6 flex items-center gap-2">
          <UserPlus className="text-[#D4AF37]" /> เพิ่มพนักงานใหม่
        </h2>

        <form onSubmit={handleAddStaff} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">ชื่อภาษาอังกฤษ (สำหรับ Login)</label>
              <input 
                type="text" 
                value={newStaffNameEn}
                onChange={(e) => setNewStaffNameEn(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] outline-none"
                placeholder="เช่น Keng"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">ชื่อภาษาไทย</label>
              <input 
                type="text" 
                value={newStaffNameTh}
                onChange={(e) => setNewStaffNameTh(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37] outline-none"
                placeholder="เช่น พี่แสน"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full py-4 bg-[#D4AF37] text-black font-bold rounded-xl hover:bg-[#b8962d] transition-colors shadow-lg shadow-[#D4AF37]/20"
          >
            + เพิ่มพนักงาน / Add Staff
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-[#1a3a3a] px-2">รายชื่อพนักงานในระบบ</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {staff.map((s) => (
            <div key={s.id} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <img src={s.avatar} alt={s.nameEn} className="w-12 h-12 rounded-full border border-[#D4AF37]/20" />
                <div>
                  <p className="font-bold text-gray-800">{s.nameEn} {s.nameTh && `(${s.nameTh})`}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">{s.position}</p>
                </div>
              </div>
              <button 
                onClick={() => handleDeleteStaff(s.id)}
                className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {staff.length === 0 && (
            <p className="text-center col-span-full py-10 text-gray-400 italic">ยังไม่มีข้อมูลพนักงานค่ะ</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffManagement;