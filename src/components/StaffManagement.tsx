import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase'; 
import { collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { UserPlus, Trash2, Users, Camera, Mail, Lock, RotateCcw } from 'lucide-react';

const StaffManagement = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffGender, setNewStaffGender] = useState('Female');
  const [imageUpload, setImageUpload] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [passcode, setPasscode] = useState('');

  // ฟังก์ชันล้างค่าในฟอร์ม (Reset)
  const resetForm = () => {
    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffGender('Female');
    setImageUpload(null);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === '1111') setIsAdmin(true);
    else { alert('รหัสผ่านไม่ถูกต้องค่ะ'); setPasscode(''); }
  };

  useEffect(() => {
    if (!isAdmin) return;
    const unsub = onSnapshot(collection(db, "staff"), (snapshot) => {
      const staffList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStaff(staffList);
    });
    return () => unsub();
  }, [isAdmin]);

  const handleAddStaff = async () => {
    if (!newStaffName || !newStaffEmail) {
      alert("กรุณาใส่ชื่อและอีเมลให้ครบนะคะ");
      return;
    }

    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, "staff"), {
        name: newStaffName,
        email: newStaffEmail,
        gender: newStaffGender,
        role: "Therapist",
        status: "Active",
        photoUrl: "", 
        createdAt: new Date().toISOString()
      });

      if (imageUpload) {
        const storageRef = ref(storage, `staff-photos/${docRef.id}_${imageUpload.name}`);
        const snapshot = await uploadBytes(storageRef, imageUpload);
        const url = await getDownloadURL(snapshot.ref);
        await updateDoc(doc(db, "staff", docRef.id), { photoUrl: url });
      }

      resetForm(); // ล้างข้อมูลอัตโนมัติหลังเพิ่มพนักงานสำเร็จ
      alert("เพิ่มพนักงานเรียบร้อยแล้วค่ะ! 🎉");
    } catch (error: any) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, photoUrl?: string) => {
    if (window.confirm("คุณแสนแน่ใจนะคะว่าจะลบพนักงานคนนี้ออกจากระบบ?")) {
      try {
        await deleteDoc(doc(db, "staff", id));
        // ลบรูปออกจาก Storage ด้วยเพื่อไม่ให้หนักเครื่อง
        if (photoUrl) {
          const imageRef = ref(storage, photoUrl);
          await deleteObject(imageRef).catch(e => console.log("No image to delete"));
        }
        alert("ลบข้อมูลเรียบร้อยแล้วค่ะ");
      } catch (error) {
        alert("ลบไม่สำเร็จค่ะ");
      }
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <form onSubmit={handleLogin} className="text-center p-8 bg-white rounded-3xl shadow-lg border">
          <Lock className="mx-auto mb-4 text-[#D4AF37]" size={40} />
          <h2 className="text-xl font-bold mb-4 italic">ADMIN ACCESS</h2>
          <input 
            type="password" 
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="รหัสผ่าน"
            className="w-full text-center text-2xl border rounded-xl py-2 mb-4 outline-none focus:ring-2 focus:ring-[#D4AF37]"
          />
          <button className="w-full bg-[#D4AF37] text-black py-3 rounded-xl font-bold">UNLOCK</button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Users className="text-[#D4AF37]" size={30} />
        <h1 className="text-2xl font-bold italic">STAFF MANAGEMENT</h1>
      </div>

      {/* ส่วนกรอกข้อมูลพนักงานใหม่ */}
      <div className="bg-stone-50 p-6 rounded-2xl mb-8 border border-stone-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            type="text" 
            value={newStaffName}
            onChange={(e) => setNewStaffName(e.target.value)}
            placeholder="ชื่อพนักงาน"
            className="p-3 rounded-xl border-none ring-1 ring-stone-200"
          />
          <input 
            type="email" 
            value={newStaffEmail}
            onChange={(e) => setNewStaffEmail(e.target.value)}
            placeholder="อีเมล"
            className="p-3 rounded-xl border-none ring-1 ring-stone-200"
          />
          <select 
            value={newStaffGender}
            onChange={(e) => setNewStaffGender(e.target.value)}
            className="p-3 rounded-xl border-none ring-1 ring-stone-200"
          >
            <option value="Female">Female (หญิง)</option>
            <option value="Male">Male (ชาย)</option>
          </select>
          <div className="relative">
            <label className="flex items-center justify-center gap-2 p-3 bg-white border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:bg-stone-100">
              <Camera size={18} />
              <span className="text-sm truncate">{imageUpload ? imageUpload.name : "เลือกรูปภาพ"}</span>
              <input type="file" className="hidden" onChange={(e) => e.target.files && setImageUpload(e.target.files[0])} />
            </label>
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <button 
            onClick={handleAddStaff}
            disabled={loading}
            className="flex-1 bg-[#D4AF37] text-black py-3 rounded-xl font-bold disabled:bg-stone-300 flex items-center justify-center gap-2"
          >
            <UserPlus size={20} />
            {loading ? "กำลังบันทึก..." : "เพิ่มหมอนวดคนใหม่ลงระบบ"}
          </button>
          
          {/* ปุ่ม Reset ล้างค่า */}
          <button 
            onClick={resetForm}
            className="px-6 bg-stone-200 text-stone-600 rounded-xl font-bold hover:bg-stone-300 flex items-center justify-center"
            title="ล้างค่า"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      {/* ส่วนแสดงรายชื่อและปุ่มลบ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {staff.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-4 bg-white border rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src={member.photoUrl || "https://via.placeholder.com/150"} 
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#D4AF37]" 
                  alt="" 
                />
              </div>
              <div>
                <p className="font-bold text-lg leading-tight">{member.name}</p>
                <p className="text-xs text-stone-400">{member.email}</p>
                <span className="text-[10px] bg-stone-100 px-2 py-0.5 rounded-full text-stone-500 uppercase tracking-wider">{member.gender}</span>
              </div>
            </div>
            
            {/* ปุ่มลบพนักงาน (Trash Icon) */}
            <button 
              onClick={() => handleDelete(member.id, member.photoUrl)} 
              className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors rounded-lg"
            >
              <Trash2 size={22} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaffManagement;