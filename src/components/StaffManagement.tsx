import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { UserPlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const StaffManagement = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [newStaffName, setNewStaffName] = useState('');
  const [loading, setLoading] = useState(true);

  // --- 1. ดึงข้อมูลจาก Firebase (ดึงแบบ Real-time) ---
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "staff"), (snapshot) => {
      const staffList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStaff(staffList);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // --- 2. ฟังก์ชันเพิ่มพนักงานลง Database ---
  const handleAddStaff = async () => {
    if (newStaffName.trim() === '') return;
    try {
      await addDoc(collection(db, "staff"), {
        name: newStaffName,
        role: "Therapist",
        status: "Active",
        createdAt: new Date().toISOString()
      });
      setNewStaffName('');
      toast.success("บันทึกพนักงานลงระบบเรียบร้อยค่ะ!");
    } catch (e) {
      console.error("Error adding staff: ", e);
      toast.error("เกิดข้อผิดพลาดในการเพิ่มพนักงาน");
    }
  };

  // --- 3. ฟังก์ชันลบพนักงานออกจาก Database ---
  const handleDelete = async (id: string) => {
    // แทนที่ window.confirm ด้วยการเช็คสถานะหรือใช้ Modal ในอนาคต
    // ในที่นี้ขอใช้การลบโดยตรงเพื่อความรวดเร็วตามโค้ดตัวอย่าง แต่แนะนำให้ใช้ Modal
    try {
      await deleteDoc(doc(db, "staff", id));
      toast.success("ลบพนักงานเรียบร้อยค่ะ");
    } catch (e) {
      console.error("Error deleting staff: ", e);
      toast.error("เกิดข้อผิดพลาดในการลบพนักงาน");
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border-2 border-[#D4AF37]/10">
      <h2 className="text-2xl font-bold mb-6 text-[#2D241E]">จัดการทีมพนักงาน (Staff Management)</h2>
      
      {/* ส่วนเพิ่มพนักงาน */}
      <div className="flex gap-2 mb-8">
        <input 
          type="text" 
          value={newStaffName}
          onChange={(e) => setNewStaffName(e.target.value)}
          placeholder="ใส่ชื่อพนักงานใหม่..."
          className="flex-1 border-2 border-[#D4AF37]/10 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#D4AF37] outline-none bg-[#FDFBF7]"
        />
        <button 
          onClick={handleAddStaff}
          className="bg-[#D4AF37] text-white px-6 py-2 rounded-xl flex items-center gap-2 hover:bg-[#b8962d] transition-all shadow-lg shadow-[#D4AF37]/20"
        >
          <UserPlus size={20} /> เพิ่มพนักงาน
        </button>
      </div>

      {/* รายชื่อพนักงาน */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-[#2D241E]/60 font-medium">กำลังโหลดข้อมูลจากฐานข้อมูล...</p>
        ) : staff.length === 0 ? (
          <p className="text-[#2D241E]/40 italic">ยังไม่มีพนักงานในระบบ</p>
        ) : staff.map((member) => (
          <div key={member.id} className="border-2 border-[#D4AF37]/5 p-4 rounded-2xl flex justify-between items-center hover:bg-[#FDFBF7] transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-full flex items-center justify-center text-[#D4AF37] font-bold border border-[#D4AF37]/20">
                {member.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-[#2D241E]">{member.name}</p>
                <p className="text-[10px] text-[#D4AF37] font-black uppercase tracking-widest">{member.role}</p>
              </div>
            </div>
            <button 
              onClick={() => handleDelete(member.id)} 
              className="text-rose-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-lg transition-all"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaffManagement;
