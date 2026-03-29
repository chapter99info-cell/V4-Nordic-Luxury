import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase'; // --- 1. ต้อง import storage มาด้วยนะคะ
import { collection, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // --- 2. import ตัวจัดการรูปภาพ
import { UserPlus, Trash2, Users, Camera, Mail } from 'lucide-react';
import { toast } from 'sonner';

const StaffManagement = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState(''); // --- 3. เพิ่ม Email สำหรับ Login
  const [newStaffGender, setNewStaffGender] = useState('Female');
  const [imageUpload, setImageUpload] = useState<File | null>(null); // --- 4. State สำหรับเก็บไฟล์รูป
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [passcode, setPasscode] = useState('');

  // --- Login 1111 ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === '1111') setIsAdmin(true);
    else { toast.error('รหัสไม่ถูกต้องค่ะ'); setPasscode(''); }
  };

  // --- Load Data (Real-time) ---
  useEffect(() => {
    if (!isAdmin) return;
    const unsub = onSnapshot(collection(db, "staff"), (snapshot) => {
      const staffList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStaff(staffList);
      setLoading(false);
    });
    return () => unsub();
  }, [isAdmin]);

  // --- 5. ฟังก์ชันอัปโหลดรูปภาพ (ถ้ามี) ---
  const uploadImage = async (staffId: string) => {
    if (imageUpload == null) return null;
    const imageRef = ref(storage, `staff/${staffId}_${imageUpload.name}`);
    try {
      const snapshot = await uploadBytes(imageRef, imageUpload);
      const url = await getDownloadURL(snapshot.ref);
      return url;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  // --- 6. ฟังก์ชันเพิ่มพนักงาน (V4 + Image) ---
  const handleAddStaff = async () => {
    if (newStaffName.trim() === '' || newStaffEmail.trim() === '') {
      toast.error("กรุณาใส่ชื่อภาษาอังกฤษและอีเมลสำหรับ Login ด้วยค่ะ");
      return;
    }
    
    setLoading(true); // แสดงสถานะกำลังโหลดตอนบันทึก
    try {
      // Step A: สร้างข้อมูลเบื้องต้นใน Firestore เพื่อเอา staffId มาก่อน
      const docRef = await addDoc(collection(db, "staff"), {
        name: newStaffName, // ชื่อภาษาอังกฤษ
        email: newStaffEmail, // สำหรับ Login
        gender: newStaffGender,
        role: "Therapist",
        status: "Active",
        isActive: true, // --- เพิ่มฟิลด์นี้เพื่อให้ผ่าน Rules และ Login ได้
        photoUrl: "https://via.placeholder.com/150", // รูปชั่วคราว
        createdAt: new Date().toISOString()
      });

      // Step B: ถ้ามีรูป ให้ทำการอัปโหลด
      if (imageUpload) {
        const photoUrl = await uploadImage(docRef.id);
        if (photoUrl) {
          // Step C: อัปเดต photoUrl ที่ได้ใน Firestore
          const staffRef = doc(db, "staff", docRef.id);
          const { updateDoc } = await import('firebase/firestore'); // import ชั่วคราว
          await updateDoc(staffRef, { photoUrl: photoUrl });
        }
      }

      // Step D: เคลียร์ค่าใน Form
      setNewStaffName('');
      setNewStaffEmail('');
      setNewStaffGender('Female');
      setImageUpload(null);
      
      // เคลียร์ input file
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      toast.success("เพิ่มหมอนวดคนใหม่เรียบร้อยค่ะ!");
    } catch (e) {
      console.error("Error adding staff: ", e);
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูลค่ะ! ลองเช็ค Firebase นะคะ");
    }
    setLoading(false);
  };

  // --- 7. ลบพนักงาน (V4 Only) ---
  const handleDelete = async (id: string) => {
    if (window.confirm("ต้องการลบหมอนวดคนนี้ออกจากระบบใช่ไหมคะ?")) {
      try {
        await deleteDoc(doc(db, "staff", id));
        toast.success("ลบสำเร็จค่ะ");
      } catch (error) {
        toast.error("เกิดข้อผิดพลาดในการลบข้อมูลค่ะ");
      }
    }
  };

  // ... (ส่วนที่เหลือคือการแสดงผล... ก๊อปไปวางทับอันเดิมได้เลยค่ะ) ...
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
    <div className="p-6 bg-white rounded-2xl shadow-sm border-2 border-[#D4AF37]/20">
      <h2 className="text-2xl font-bold mb-6 text-[#2D241E] flex items-center gap-2">
        <Users className="text-[#D4AF37]" /> จัดการทีมพนักงาน
      </h2>
      
      {/* --- ส่วนเพิ่มพนักงาน (มีอัปโหลดรูป) --- */}
      <div className="bg-[#FDFBF7] p-4 rounded-2xl mb-8 border border-[#D4AF37]/10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          {/* ชื่อภาษาอังกฤษ */}
          <input 
            type="text" 
            value={newStaffName}
            onChange={(e) => setNewStaffName(e.target.value)}
            placeholder="ชื่อภาษาอังกฤษ (สำหรับโชว์หน้าเว็บ)..."
            className="border-2 border-[#D4AF37]/10 rounded-xl px-4 py-2 focus:ring-2 focus:ring-[#D4AF37] outline-none"
          />
          {/* อีเมลสำหรับ Login */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="email" 
              value={newStaffEmail}
              onChange={(e) => setNewStaffEmail(e.target.value)}
              placeholder="อีเมล (สำหรับ Login)..."
              className="border-2 border-[#D4AF37]/10 rounded-xl px-4 pl-10 py-2 w-full outline-none"
            />
          </div>
          {/* เลือกเพศ */}
          <select 
            value={newStaffGender}
            onChange={(e) => setNewStaffGender(e.target.value)}
            className="border-2 border-[#D4AF37]/10 rounded-xl px-4 py-2 bg-white outline-none"
          >
            <option value="Female">เพศหญิง (Female)</option>
            <option value="Male">เพศชาย (Male)</option>
          </select>
          {/* ปุ่มอัปโหลดรูป */}
          <div className="relative">
            <label htmlFor="fileInput" className="border-2 border-dashed border-[#D4AF37]/30 text-[#D4AF37] rounded-xl px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-[#FDFBF7]/50 w-full justify-center">
              <Camera size={18} /> {imageUpload ? imageUpload.name.substring(0, 10) + '...' : 'อัปโหลดรูป...'}
            </label>
            <input 
              id="fileInput"
              type="file" 
              onChange={(event) => {
                if (event.target.files && event.target.files[0]) {
                  setImageUpload(event.target.files[0]);
                }
              }}
              className="hidden" // ซ่อน input file เดิมๆ
            />
          </div>
        </div>
        <button 
          onClick={handleAddStaff}
          disabled={loading}
          className="bg-[#D4AF37] text-white px-10 py-2.5 rounded-xl w-full flex items-center justify-center gap-2 hover:bg-[#b8962d] transition-all disabled:bg-gray-300 shadow-lg shadow-[#D4AF37]/20"
        >
          {loading ? 'กำลังบันทึกข้อมูลและอัปโหลดรูป...' : <> <UserPlus size={20} /> เพิ่มหมอนวด人ใหม่ลงระบบ </ > }
        </button>
      </div>

      {/* --- รายชื่อพนักงาน (V4 + Show Image) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map((member) => (
          <div key={member.id} className="border-2 border-[#D4AF37]/5 p-4 rounded-2xl flex justify-between items-center hover:shadow-md transition-all bg-white group">
            <div className="flex items-center gap-3">
              {/* แสดงรูปพนักงาน */}
              <img 
                src={member.photoUrl || "https://via.placeholder.com/150"} 
                alt={member.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-[#D4AF37]/10"
              />
              <div>
                <p className="font-bold text-[#2D241E] text-lg">{member.name}</p>
                <p className="text-sm text-gray-500 flex items-center gap-1"> <Mail size={14} /> {member.email}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase mt-1 inline-block ${member.gender === 'Male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                  {member.gender}
                </span>
              </div>
            </div>
            
            {/* ปุ่มลบชื่อ */}
            <button 
          onClick={() => handleDelete(member.id)} 
          className="opacity-0 group-hover:opacity-100 text-rose-400 p-2 hover:bg-rose-50 rounded-lg transition-all"
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