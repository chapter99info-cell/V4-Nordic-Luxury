import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { UserPlus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

const StaffManagement = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffGender, setNewStaffGender] = useState('Female'); // ค่าเริ่มต้นเป็นหญิง
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [passcode, setPasscode] = useState('');

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

  // --- Load Data ---
  useEffect(() => {
    if (!isAdmin) return;
    const unsub = onSnapshot(collection(db, "staff"), (snapshot) => {
      const staffList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStaff(staffList);
      setLoading(false);
    }, (error) => {
      console.error("Firebase Error:", error);
      toast.error("เชื่อมต่อฐานข้อมูลไม่ได้");
    });
    return () => unsub();
  }, [isAdmin]);

  // --- Add Staff (เพิ่มเพศลงไปด้วย) ---
  const handleAddStaff = async () => {
    if (newStaffName.trim() === '') return;
    try {
      await addDoc(collection(db, "staff"), {
        name: newStaffName,
        gender: newStaffGender, // บันทึกเพศลง Firebase
        role: "Therapist",
        status: "Active",
        createdAt: new Date().toISOString()
      });
      setNewStaffName('');
      toast.success("เพิ่มพนักงานเรียบร้อยค่ะ!");
    } catch (e) {
      console.error("Error adding staff:", e);
      toast.error("เกิดข้อผิดพลาดค่ะ");
    }
  };

  // --- Delete Staff ---
  const handleDelete = async (id: string) => {
    if (window.confirm("ต้องการลบพนักงานคนนี้ใช่ไหมคะ?")) {
      try {
        await deleteDoc(doc(db, "staff", id));
        toast.success("ลบสำเร็จค่ะ");
      } catch (e) {
        console.error("Error deleting staff:", e);
        toast.error("ลบไม่สำเร็จค่ะ");
      }
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
    <div className="p-6 bg-white rounded-2xl shadow-sm border-2 border-[#D4AF37]/20">
      <h2 className="text-2xl font-bold mb-6 text-[#2D241E] flex items-center gap-2">
        <Users className="text-[#D4AF37]" /> จัดการทีมพนักงาน
      </h2>
      
      {/* --- ส่วนเพิ่มพนักงาน (มีเลือกเพศ) --- */}
      <div className="bg-[#FDFBF7] p-4 rounded-2xl mb-8 border border-[#D4AF37]/10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input 
            type="text" 
            value={newStaffName}
            onChange={(e) => setNewStaffName(e.target.value)}
            placeholder="ชื่อพนักงาน..."
            className="border-2 border-[#D4AF37]/10 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#D4AF37] outline-none"
          />
          <select 
            value={newStaffGender}
            onChange={(e) => setNewStaffGender(e.target.value)}
            className="border-2 border-[#D4AF37]/10 rounded-xl px-4 py-2 bg-white outline-none"
          >
            <option value="Female">เพศหญิง (Female)</option>
            <option value="Male">เพศชาย (Male)</option>
            <option value="Other">อื่นๆ (Other)</option>
          </select>
          <button 
            onClick={handleAddStaff}
            className="bg-[#D4AF37] text-white px-6 py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-[#b8962d] transition-all"
          >
            <UserPlus size={20} /> เพิ่มพนักงาน
          </button>
        </div>
      </div>

      {/* --- รายชื่อพนักงาน (มีแสดงเพศ และปุ่มลบ) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-[#2D241E]/60 font-medium">กำลังโหลดข้อมูล...</p>
        ) : staff.length === 0 ? (
          <p className="text-[#2D241E]/40 italic">ยังไม่มีพนักงานในระบบ</p>
        ) : staff.map((member) => (
          <div key={member.id} className="border-2 border-[#D4AF37]/5 p-4 rounded-2xl flex justify-between items-center hover:shadow-md transition-all bg-white group">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold border-2 ${member.gender === 'Male' ? 'bg-blue-50 border-blue-100 text-blue-500' : member.gender === 'Female' ? 'bg-pink-50 border-pink-100 text-pink-500' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                {member.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-[#2D241E]">{member.name}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${member.gender === 'Male' ? 'bg-blue-100 text-blue-600' : member.gender === 'Female' ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-600'}`}>
                  {member.gender || 'N/A'}
                </span>
              </div>
            </div>
            
            {/* ปุ่มลบชื่อ */}
            <button 
              onClick={() => handleDelete(member.id)}
              className="opacity-0 group-hover:opacity-100 p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-all"
              title="ลบพนักงาน"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaffManagement;
