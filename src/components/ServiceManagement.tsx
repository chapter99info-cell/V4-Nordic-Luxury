import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Image as ImageIcon, 
  Upload,
  Check,
  AlertCircle,
  Clock,
  DollarSign,
  Tag,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Service } from '../types';
import { shopConfig } from '../config/shopConfig';

export const ServiceManagement: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Service>>({
    name: '',
    type: 'Massage',
    description: '',
    image: 'https://picsum.photos/seed/massage/800/600',
    rates: { 60: 0, 90: 0, 120: 0 },
    isActive: true
  });

  useEffect(() => {
    const q = query(collection(db, 'services'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
      setServices(docs);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, serviceId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const targetId = serviceId || 'new';
    setUploading(targetId);

    try {
      const storageRef = ref(storage, `services/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      if (serviceId) {
        await updateDoc(doc(db, 'services', serviceId), { image: url });
      } else {
        setFormData(prev => ({ ...prev, image: url }));
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image.");
    } finally {
      setUploading(null);
    }
  };

  const handleAddService = async () => {
    if (!formData.name) return;
    try {
      await addDoc(collection(db, 'services'), {
        ...formData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setIsAdding(false);
      setFormData({
        name: '',
        type: 'Massage',
        description: '',
        image: 'https://picsum.photos/seed/massage/800/600',
        rates: { 60: 0, 90: 0, 120: 0 },
        isActive: true
      });
    } catch (error) {
      console.error("Error adding service:", error);
    }
  };

  const handleUpdateService = async (id: string, data: Partial<Service>) => {
    try {
      await updateDoc(doc(db, 'services', id), {
        ...data,
        updatedAt: serverTimestamp()
      });
      setEditingId(null);
    } catch (error) {
      console.error("Error updating service:", error);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    try {
      await deleteDoc(doc(db, 'services', id));
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };

  const syncFromStatic = async () => {
    if (!window.confirm("This will import all services from static config. Continue?")) return;
    try {
      for (const service of shopConfig.services) {
        const exists = services.find(s => s.name === service.name);
        if (!exists) {
          await addDoc(collection(db, 'services'), {
            ...service,
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      }
      alert("Sync complete!");
    } catch (error) {
      console.error("Error syncing services:", error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-serif font-bold text-primary">Service Management</h3>
          <p className="text-earth/50 text-sm">Manage your massage treatments and pricing.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={syncFromStatic}
            className="px-4 py-2 rounded-xl border border-primary/20 text-primary text-xs font-bold hover:bg-primary/5 transition-all"
          >
            SYNC FROM CONFIG
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-xs hover:bg-sage transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={18} /> ADD NEW SERVICE
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-earth/40 text-sm">Loading services...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {isAdding && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-[2.5rem] border-2 border-dashed border-primary/30 p-6 flex flex-col gap-4"
              >
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-section group">
                  <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                  <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer">
                    <Upload size={24} className="mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Upload Image</span>
                    <input type="file" className="hidden" onChange={(e) => handleImageUpload(e)} accept="image/*" />
                  </label>
                  {uploading === 'new' && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="Service Name"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-section rounded-xl text-sm font-bold focus:outline-none focus:ring-2 ring-primary/20"
                  />
                  <select 
                    value={formData.type}
                    onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-4 py-3 bg-section rounded-xl text-sm focus:outline-none"
                  >
                    <option value="Massage">Massage</option>
                    <option value="Treatment">Treatment</option>
                    <option value="Spa">Spa</option>
                  </select>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {[60, 90, 120].map(dur => (
                      <div key={dur} className="space-y-1">
                        <label className="text-[9px] font-bold text-earth/40 uppercase tracking-widest ml-2">{dur}m Price</label>
                        <div className="relative">
                          <DollarSign size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth/30" />
                          <input 
                            type="number" 
                            value={formData.rates?.[dur] || 0}
                            onChange={e => setFormData(prev => ({ 
                              ...prev, 
                              rates: { ...prev.rates, [dur]: Number(e.target.value) } 
                            }))}
                            className="w-full pl-7 pr-3 py-2 bg-section rounded-lg text-xs font-bold focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 mt-auto">
                  <button 
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-3 rounded-xl border border-beige/20 text-earth/60 font-bold text-xs hover:bg-section transition-all"
                  >
                    CANCEL
                  </button>
                  <button 
                    onClick={handleAddService}
                    className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-xs hover:bg-sage transition-all shadow-lg shadow-primary/20"
                  >
                    CREATE
                  </button>
                </div>
              </motion.div>
            )}

            {services.map((service) => (
              <motion.div
                key={service.id}
                layout
                className={`bg-white rounded-[2.5rem] border border-beige/20 overflow-hidden shadow-sm hover:shadow-md transition-all ${!service.isActive ? 'opacity-60 grayscale' : ''}`}
              >
                <div className="relative aspect-video group">
                  <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                      onClick={() => handleUpdateService(service.id, { isActive: !service.isActive })}
                      className="p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-all"
                    >
                      {service.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button 
                      onClick={() => setEditingId(editingId === service.id ? null : service.id)}
                      className="p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>

                  <div className="absolute bottom-4 left-6">
                    <span className="text-[9px] font-bold text-white/70 uppercase tracking-[0.2em]">{service.type}</span>
                    <h4 className="text-lg font-serif font-bold text-white">{service.name}</h4>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {editingId === service.id ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-earth/40 uppercase tracking-widest">Rates & Durations</label>
                        <div className="grid grid-cols-3 gap-2">
                          {Object.entries(service.rates || {}).map(([dur, price]) => (
                            <div key={dur} className="relative">
                              <span className="absolute -top-2 left-2 bg-white px-1 text-[8px] font-bold text-primary">{dur}m</span>
                              <input 
                                type="number" 
                                defaultValue={price as number}
                                onBlur={(e) => {
                                  const newRates = { ...service.rates, [dur]: Number(e.target.value) };
                                  handleUpdateService(service.id, { rates: newRates });
                                }}
                                className="w-full px-3 py-2 bg-section rounded-lg text-xs font-bold focus:outline-none border border-beige/10"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2">
                        <button 
                          onClick={() => handleDeleteService(service.id)}
                          className="flex items-center gap-2 text-rose-500 text-[10px] font-bold uppercase tracking-widest hover:text-rose-600"
                        >
                          <Trash2 size={14} /> Delete Service
                        </button>
                        <button 
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 bg-primary text-white rounded-lg text-[10px] font-bold uppercase tracking-widest"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-3">
                          {Object.entries(service.rates || {}).map(([dur, price]) => (
                            <div key={dur} className="text-center">
                              <p className="text-[8px] font-bold text-earth/30 uppercase">{dur}m</p>
                              <p className="text-xs font-bold text-primary">${price}</p>
                            </div>
                          ))}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${service.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-earth/10 text-earth/40'}`}>
                          {service.isActive ? 'Active' : 'Hidden'}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
