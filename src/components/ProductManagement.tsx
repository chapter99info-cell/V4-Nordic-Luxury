import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Package, 
  DollarSign,
  CheckCircle2,
  Info,
  XCircle
} from 'lucide-react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Product } from '../types';

export const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: ''
  });

  useEffect(() => {
    const path = 'products';
    const q = query(collection(db, path));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, []);

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price) return;
    
    const path = 'products';
    try {
      await addDoc(collection(db, path), {
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        timestamp: serverTimestamp()
      });
      
      setShowAddModal(false);
      setNewProduct({ name: '', price: '' });
      alert("บันทึกข้อมูลสำเร็จ!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      alert("บันทึกไม่สำเร็จ ลองดูใน Console ครับ");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const path = 'products';
    try {
      await deleteDoc(doc(db, path, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  return (
    <div className="bg-white rounded-[3rem] border border-beige/20 p-8 shadow-sm mt-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h4 className="text-xl font-serif font-bold text-primary">Product Management</h4>
          <p className="text-xs text-earth/40">Manage clinic products (oils, balms, etc.)</p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-sage transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <motion.div 
            key={product.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-[2rem] border border-beige/10 bg-section relative group"
          >
            <button 
              onClick={() => handleDeleteProduct(product.id)}
              className="absolute top-4 right-4 p-2 text-earth/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={16} />
            </button>
            
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-white text-primary shadow-sm">
                <Package size={20} />
              </div>
              <div>
                <h5 className="text-sm font-bold text-primary">{product.name}</h5>
                <p className="text-lg font-serif font-bold text-sage mt-1">${product.price}</p>
              </div>
            </div>
          </motion.div>
        ))}
        
        {products.length === 0 && (
          <div className="md:col-span-3 py-12 text-center bg-section rounded-[2rem] border border-dashed border-beige/20">
            <Info size={32} className="text-earth/10 mx-auto mb-4" />
            <p className="text-earth/30 text-sm italic">No products found. Add your first product above.</p>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-primary/20 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[3rem] p-10 shadow-2xl max-w-md w-full space-y-8 border border-beige/20"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-serif font-bold text-primary">Add New Product</h3>
              <button onClick={() => setShowAddModal(false)} className="text-earth/30 hover:text-primary">
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-earth/40 ml-2">Product Name</label>
                <input 
                  id="productName"
                  type="text" 
                  placeholder="e.g., Organic Massage Oil"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full bg-section border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-earth/40 ml-2">Price ($)</label>
                <input 
                  id="productPrice"
                  type="number" 
                  placeholder="0.00"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  className="w-full bg-section border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest text-earth/40 hover:bg-section transition-all"
                >
                  Cancel
                </button>
                <button 
                  id="saveBtn"
                  onClick={handleAddProduct}
                  className="flex-1 bg-primary text-white py-4 rounded-2xl text-sm font-bold uppercase tracking-widest hover:bg-sage transition-all shadow-lg shadow-primary/20"
                >
                  Save Product
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
