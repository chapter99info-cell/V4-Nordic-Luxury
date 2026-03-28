import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { UserPlus, Trash2 } from 'lucide-react';

const StaffManagement = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [newStaffName, setNewStaffName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [passcode, setPasscode] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === '1111') {
      setIsAdmin(true);
    } else {
      alert('รหัสผ่านไม่ถูกต้องครับพี่แสน!');
      setPasscode('');
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    try {
      const unsub = onSnapshot(collection(db, "staff"), (snapshot) => {
        const staffList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setStaff(staffList);
        setLoading(false);
      }, (error) => {
        console.error("Firebase Error:", error);
        alert("เชื่อมต่อฐานข้อมูลไม่ได้ เช็ค API Key ใน Hostinger หรือยังคะ?");
      });
      return () => unsub();
    } catch (err) {
      console.error("Setup Error:", err);
    }
  }, [isAdmin]);

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
      alert("บันทึกพนักงานลงระบบเรียบร้อยค่ะ!");
    } catch (e) {
      console.error("Error adding staff: ", e);
      alert("เพิ่มพนักงานไม่ได้! ลองเช็คอินเตอร์เน็ตหรือค่า Firebase นะคะ");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("จะลบพนักงานคนนี้จริงๆ หรอคะพี่แสน?")) return;
    try {
      await deleteDoc(doc(db, "staff", id));
      alert("ลบเรียบร้อยแล้วค่ะ");
    } catch (e) {
      alert("ลบไม่ได้ค่ะพี่แสน!");
    }
  };

  // ... (ส่วนที่เหลือเหมือนเดิมเลยค่ะ) ...
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
            className="border rounded-xl px-4 py-2 w-32 text-center text-2xl tracking-widest outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button type="submit" className="bg-stone-800 text-white px-6 py-2 rounded-xl hover:bg-black transition-all">
            ตกลง
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border-2 border-[#D4AF37]/10">
      <h2 className="text-2xl font-bold mb-6 text-[#2D241E]">จัดการทีมพนักงาน (Staff Management)</h2>
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
      {/* ส่วนรายชื่อพนักงาน... (ก๊อปจากอันเดิมของพี่ได้เลย) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-[#2D241E]/60 font-medium">กำลังโหลดข้อมูล...</p>
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
            <button onClick={() => handleDelete(member.id)} className="text-rose-400 p-2 hover:bg-rose-50 rounded-lg">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaffManagement;