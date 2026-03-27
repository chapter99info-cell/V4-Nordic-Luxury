import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserPlus, Trash2, CheckCircle, XCircle, Loader2, 
  AlertTriangle, X as LucideX, User, Briefcase
} from 'lucide-react';
import { 
  collection, query, onSnapshot, addDoc, deleteDoc, 
  doc, updateDoc, serverTimestamp, where 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, handleFirestoreError, OperationType, storage } from '../firebase';
import { Staff } from '../types';

interface StaffManagementProps {
  config?: any;
}

export const StaffManagement: React.FC<StaffManagementProps> = ({ config }) => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [feedback, setFeedback] = useState<{status: 'success'|'error', msg: string} | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'staff'),
      where('shopId', '==', config?.shopId || 'SHOP01')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const staffData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Staff));
      setStaff(staffData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'staff');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [config?.shopId]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newRole) return;

    try {
      await addDoc(collection(db, 'staff'), {
        name: newName,
        role: newRole,
        label: newLabel || newRole, // Default to role if label is empty
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newName)}&background=random&size=200`,
        specialties: [newRole],
        status: 'Off',
        isActive: true,
        shopId: config?.shopId || 'SHOP01',
        createdAt: serverTimestamp()
      });
      setNewName('');
      setNewRole('');
      setNewLabel('');
      setFeedback({ status: 'success', msg: 'เพิ่มพนักงานเรียบร้อยแล้วค่ะ' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      setFeedback({ status: 'error', msg: 'เกิดข้อผิดพลาดในการเพิ่มพนักงานค่ะ' });
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'staff', id), {
        isActive: !currentStatus
      });
    } catch (error) {
      setFeedback({ status: 'error', msg: 'ไม่สามารถเปลี่ยนสถานะได้ค่ะ' });
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteDoc(doc(db, 'staff', deleteConfirm));
      setDeleteConfirm(null);
      setFeedback({ status: 'success', msg: 'ลบรายชื่อพนักงานเรียบร้อยแล้วค่ะ' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      setFeedback({ status: 'error', msg: 'ไม่สามารถลบข้อมูลได้ค่ะ' });
    }
  };

  const handleEditStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    try {
      await updateDoc(doc(db, 'staff', editingStaff.id), {
        name: editingStaff.name,
        role: editingStaff.role,
        label: editingStaff.label || editingStaff.role,
        avatar: editingStaff.imageUrl || editingStaff.avatar
      });
      setEditingStaff(null);
      setFeedback({ status: 'success', msg: 'แก้ไขข้อมูลพนักงานเรียบร้อยแล้วค่ะ' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      setFeedback({ status: 'error', msg: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลค่ะ' });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, staffId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `staff_images/${staffId}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      await updateDoc(doc(db, 'staff', staffId), {
        imageUrl: downloadURL,
        avatar: downloadURL // Sync with avatar for compatibility
      });

      if (editingStaff && editingStaff.id === staffId) {
        setEditingStaff({ ...editingStaff, imageUrl: downloadURL, avatar: downloadURL });
      }

      setFeedback({ status: 'success', msg: 'อัปโหลดรูปภาพเรียบร้อยแล้วค่ะ' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error("Upload error:", error);
      setFeedback({ status: 'error', msg: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพค่ะ' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* Header Section */}
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-serif font-bold text-primary">จัดการพนักงานค่ะ</h2>
        <p className="text-earth/60 text-lg">เพิ่มหรือพักงานพนักงานของคุณได้ที่นี่ค่ะ</p>
      </div>

      {/* Add New Staff Form - Large & Clear */}
      <section className="bg-white p-8 md:p-12 rounded-[3rem] border-4 border-primary/10 shadow-xl shadow-primary/5">
        <h3 className="text-2xl font-bold text-primary mb-8 flex items-center gap-3">
          <UserPlus size={32} className="text-secondary" />
          เพิ่มพนักงานใหม่
        </h3>
        
        <form onSubmit={handleAddStaff} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xl font-bold text-primary px-2">ชื่อเล่นพนักงาน</label>
              <div className="relative">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-earth/30" size={28} />
                <input 
                  type="text" 
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="ตัวอย่าง: พี่นก"
                  className="w-full bg-section border-2 border-beige/30 rounded-[2rem] py-6 pl-16 pr-8 text-2xl font-bold text-primary focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all placeholder:text-earth/20"
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-xl font-bold text-primary px-2">ความถนัด (เช่น นวดไทย)</label>
              <div className="relative">
                <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 text-earth/30" size={28} />
                <input 
                  type="text" 
                  required
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="ตัวอย่าง: นวดไทย, นวดน้ำมัน"
                  className="w-full bg-section border-2 border-beige/30 rounded-[2rem] py-6 pl-16 pr-8 text-2xl font-bold text-primary focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all placeholder:text-earth/20"
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-xl font-bold text-primary px-2">ตำแหน่ง (เช่น SENIOR THERAPIST)</label>
              <div className="relative">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-earth/30" size={28} />
                <input 
                  type="text" 
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="ตัวอย่าง: SENIOR THERAPIST"
                  className="w-full bg-section border-2 border-beige/30 rounded-[2rem] py-6 pl-16 pr-8 text-2xl font-bold text-primary focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all placeholder:text-earth/20"
                />
              </div>
            </div>
          </div>
          
          <button 
            type="submit"
            className="w-full bg-primary text-white py-8 rounded-[2rem] text-3xl font-bold hover:bg-sage transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-4 active:scale-95"
          >
            <UserPlus size={36} />
            เพิ่มพนักงานเข้าร้าน
          </button>
        </form>
      </section>

      {/* Feedback Messages */}
      <AnimatePresence>
        {feedback && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`p-6 rounded-[2rem] flex items-center justify-center gap-4 border-4 shadow-lg ${
              feedback.status === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            {feedback.status === 'success' ? <CheckCircle size={32} /> : <AlertTriangle size={32} />}
            <p className="text-2xl font-bold">{feedback.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Staff List Grid Cards */}
      <div className="space-y-8">
        <h3 className="text-3xl font-serif font-bold text-primary px-4">รายชื่อพนักงานทั้งหมดค่ะ</h3>
        
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-primary" size={64} />
            <p className="text-xl font-bold text-primary/40">กำลังโหลดข้อมูลอยู่ค่ะ...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {staff.length === 0 ? (
              <div className="col-span-full p-20 text-center bg-white rounded-[3rem] border-4 border-dashed border-beige/30">
                <p className="text-2xl font-bold text-earth/20">ยังไม่มีรายชื่อพนักงานในระบบค่ะ</p>
              </div>
            ) : (
              staff.map((member) => (
                <motion.div 
                  key={member.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-[3rem] border-4 border-beige/20 shadow-lg overflow-hidden relative group"
                >
                  {/* Edit Button - Top Left */}
                  <button 
                    onClick={() => setEditingStaff(member)}
                    className="absolute top-6 left-6 p-4 bg-primary/10 text-primary rounded-2xl hover:bg-primary hover:text-white transition-all z-10 shadow-md"
                  >
                    <User size={28} />
                  </button>

                  {/* Delete Button - Top Right */}
                  <button 
                    onClick={() => setDeleteConfirm(member.id)}
                    className="absolute top-6 right-6 p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all z-10 shadow-md"
                  >
                    <Trash2 size={28} />
                  </button>

                  <div className="p-8 pt-12 text-center space-y-6">
                    <div className="flex justify-center">
                      <div className="relative">
                        <img 
                          src={
                            member.imageUrl || 
                            member.avatar || 
                            (member.name.toLowerCase().includes('senior') 
                              ? '/image_d57467.png' 
                              : 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=200&h=200')
                          } 
                          alt={member.name} 
                          className="w-32 h-32 rounded-full border-4 border-primary/10 object-cover shadow-inner"
                          referrerPolicy="no-referrer"
                        />
                        <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-full border-4 border-white flex items-center justify-center ${
                          member.isActive ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}>
                          {member.isActive ? <CheckCircle size={20} className="text-white" /> : <XCircle size={20} className="text-white" />}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-3xl font-bold text-primary">{member.name}</h4>
                      <p className="text-xl font-bold text-secondary">{member.role}</p>
                    </div>

                    {/* The Big Toggle Button */}
                    <button 
                      onClick={() => toggleStatus(member.id, member.isActive)}
                      className={`w-full py-6 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg ${
                        member.isActive 
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200' 
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300 shadow-slate-100'
                      }`}
                    >
                      {member.isActive ? (
                        <>
                          <CheckCircle size={32} />
                          <span className="text-2xl font-bold">พร้อมทำงาน (Active)</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={32} />
                          <span className="text-2xl font-bold">พักงาน (Inactive)</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="absolute inset-0 bg-primary/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl p-12 rounded-[4rem] shadow-2xl border-8 border-rose-100 text-center space-y-10"
            >
              <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                <Trash2 size={48} />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-4xl font-bold text-primary">ยืนยันการลบไหมคะ?</h3>
                <p className="text-2xl text-earth/60 font-medium">
                  ต้องการลบชื่อนี้ออกจากร้านใช่ไหมคะ? <br/>
                  <span className="text-rose-500 font-bold">(ข้อมูลจะหายไปถาวรค่ะ)</span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="py-6 rounded-[2rem] text-2xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                >
                  ยกเลิกค่ะ
                </button>
                <button 
                  onClick={confirmDelete}
                  className="py-6 rounded-[2rem] text-2xl font-bold bg-rose-500 text-white hover:bg-rose-600 transition-all shadow-xl shadow-rose-200"
                >
                  ใช่ค่ะ ลบเลย
                </button>
              </div>
              
              <button 
                onClick={() => setDeleteConfirm(null)}
                className="absolute top-8 right-8 p-4 text-earth/20 hover:text-primary transition-colors"
              >
                <LucideX size={32} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Staff Modal */}
      <AnimatePresence>
        {editingStaff && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingStaff(null)}
              className="absolute inset-0 bg-primary/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl p-12 rounded-[4rem] shadow-2xl border-8 border-primary/10 space-y-8 max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="text-center space-y-2">
                <h3 className="text-4xl font-bold text-primary">แก้ไขข้อมูลพนักงาน</h3>
                <p className="text-xl text-earth/60">อัปเดตข้อมูลและรูปภาพของพนักงาน</p>
              </div>

              <div className="flex flex-col items-center gap-6">
                <div className="relative group">
                  <img 
                    src={
                      editingStaff.imageUrl || 
                      editingStaff.avatar || 
                      (editingStaff.name.toLowerCase().includes('senior') 
                        ? '/image_d57467.png' 
                        : 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=200&h=200')
                    } 
                    alt={editingStaff.name} 
                    className="w-48 h-48 rounded-full border-8 border-primary/5 object-cover shadow-xl"
                    referrerPolicy="no-referrer"
                  />
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleImageUpload(e, editingStaff.id)}
                      disabled={uploading}
                    />
                    {uploading ? (
                      <Loader2 className="animate-spin text-white" size={48} />
                    ) : (
                      <div className="text-white text-center">
                        <p className="font-bold">เปลี่ยนรูป</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <form onSubmit={handleEditStaff} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xl font-bold text-primary px-2">ชื่อเล่น</label>
                  <input 
                    type="text" 
                    required
                    value={editingStaff.name}
                    onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                    className="w-full bg-section border-2 border-beige/30 rounded-[2rem] py-5 px-8 text-2xl font-bold text-primary focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xl font-bold text-primary px-2">ตำแหน่ง / คำบรรยาย</label>
                  <input 
                    type="text" 
                    required
                    value={editingStaff.label || editingStaff.role}
                    onChange={(e) => setEditingStaff({ ...editingStaff, label: e.target.value, role: e.target.value })}
                    className="w-full bg-section border-2 border-beige/30 rounded-[2rem] py-5 px-8 text-2xl font-bold text-primary focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                  <button 
                    type="button"
                    onClick={() => setEditingStaff(null)}
                    className="py-6 rounded-[2rem] text-2xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                  >
                    ยกเลิกค่ะ
                  </button>
                  <button 
                    type="submit"
                    className="py-6 rounded-[2rem] text-2xl font-bold bg-primary text-white hover:bg-sage transition-all shadow-xl shadow-primary/20"
                  >
                    บันทึกข้อมูลค่ะ
                  </button>
                </div>
              </form>
              
              <button 
                onClick={() => setEditingStaff(null)}
                className="absolute top-8 right-8 p-4 text-earth/20 hover:text-primary transition-colors"
              >
                <LucideX size={32} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
