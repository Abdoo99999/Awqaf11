import React, { useState, useEffect } from 'react';
import { getInstitutions, saveInstitution, deleteInstitution, generateId } from '../services/db';
import { Institution, InstitutionType, InstitutionDocument } from '../types';
import { GOVERNORATES, OMAN_LOCATIONS } from '../constants';
import { Plus, Search, Edit2, Trash2, X, FileText, UploadCloud, Calendar, Hash, User, CheckCircle2 } from 'lucide-react';
import { useUi } from '../contexts/UiContext';

const Institutions: React.FC = () => {
  const [list, setList] = useState<Institution[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Institution>>({});
  const { showToast, role, currentWaqfId, setWaqfContext } = useUi();

  useEffect(() => {
    setList(getInstitutions());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Strict Validation: All fields are mandatory
    if (
        !formData.name || 
        !formData.type || 
        formData.capital_omr === undefined || 
        !formData.contact_phone || 
        !formData.email || 
        !formData.governorate || 
        !formData.wilayat || 
        !formData.establishment_date || 
        !formData.license_number || 
        !formData.manager_name
    ) {
        showToast('عذراً، جميع الحقول إجبارية. يرجى تعبئة كافة البيانات المطلوبة.', 'error');
        return;
    }

    const newInst: Institution = {
      id: formData.id || generateId(),
      name: formData.name,
      type: (formData.type as InstitutionType),
      capital_omr: Number(formData.capital_omr),
      employees_omani: Number(formData.employees_omani) || 0,
      employees_non_omani: Number(formData.employees_non_omani) || 0,
      contact_phone: formData.contact_phone,
      email: formData.email,
      governorate: formData.governorate,
      wilayat: formData.wilayat,
      
      // New Fields
      establishment_date: formData.establishment_date,
      license_number: formData.license_number,
      manager_name: formData.manager_name,

      documents: formData.documents || [],
      created_at: formData.created_at || new Date().toISOString(),
    };

    saveInstitution(newInst);
    setList(getInstitutions());
    setShowForm(false);
    setFormData({});
    
    // Auto-set context for user if this is their first create or edit
    if (role === 'user') {
        setWaqfContext(newInst.id);
    }
    
    showToast('تم حفظ بيانات المؤسسة بنجاح', 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const newDoc: InstitutionDocument = {
              id: generateId(),
              name: file.name,
              type: file.type,
              size: (file.size / 1024).toFixed(1) + ' KB',
              upload_date: new Date().toLocaleDateString('ar-OM')
          };
          setFormData(prev => ({
              ...prev,
              documents: [...(prev.documents || []), newDoc]
          }));
          showToast('تم إرفاق الملف بنجاح', 'info');
      }
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه المؤسسة؟')) {
      deleteInstitution(id);
      setList(getInstitutions());
      if (currentWaqfId === id) setWaqfContext(''); // Clear context if deleted
      showToast('تم حذف المؤسسة', 'info');
    }
  };
  
  const handleSelectContext = (id: string) => {
      setWaqfContext(id);
      showToast('تم اختيار المؤسسة للعمل عليها', 'success');
  };

  // --- SECURITY FILTERING ---
  const filtered = list.filter(i => {
      // 1. Isolation: If User, only show own institution
      if (role === 'user') {
          return i.id === currentWaqfId;
      }
      // 2. Search
      return i.name.includes(search);
  });

  const availableWilayats = formData.governorate && OMAN_LOCATIONS[formData.governorate] 
    ? OMAN_LOCATIONS[formData.governorate] 
    : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-navy-900 dark:text-white">بيانات المؤسسات</h2>
        {/* ADD BUTTON: Render ONLY if Admin */}
        {role === 'admin' && (
            <button 
            onClick={() => { setFormData({}); setShowForm(true); }}
            className="bg-navy-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-navy-900"
            >
            <Plus size={18} /> إضافة مؤسسة
            </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="بحث عن مؤسسة..."
          className="w-full md:w-1/3 p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-800 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Search className="absolute top-3.5 right-3 text-gray-400" size={18} />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">
            <tr>
              <th className="p-4">المؤسسة</th>
              <th className="p-4">النوع</th>
              <th className="p-4">رأس المال (ر.ع)</th>
              <th className="p-4">مدير المؤسسة</th>
              <th className="p-4">المحافظة</th>
              <th className="p-4">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map(inst => (
              <tr key={inst.id} className={`transition-colors ${currentWaqfId === inst.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''} ${inst.type === 'وقفية خاصة' ? 'hover:bg-orange-50 dark:hover:bg-orange-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                <td className="p-4 font-medium text-navy-900 dark:text-gray-200">
                    <div className="flex items-center gap-2">
                        {currentWaqfId === inst.id && <CheckCircle2 size={16} className="text-teal-500" />}
                        <div>
                            <div>{inst.name}</div>
                            <div className="text-xs text-gray-400 font-normal">{inst.license_number}</div>
                        </div>
                    </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${inst.type === 'وقفية عامة' ? 'bg-teal-100 text-teal-800' : 'bg-gold-100 text-gold-800'}`}>
                    {inst.type}
                  </span>
                </td>
                <td className="p-4 font-mono dark:text-gray-300">{inst.capital_omr.toLocaleString()}</td>
                <td className="p-4 text-sm dark:text-gray-300">{inst.manager_name || '-'}</td>
                <td className="p-4">
                    <div className="text-sm dark:text-gray-300">{inst.governorate}</div>
                    <div className="text-xs text-gray-500">{inst.wilayat}</div>
                </td>
                <td className="p-4 flex gap-2 items-center">
                  {role === 'user' && currentWaqfId !== inst.id && (
                      <button onClick={() => handleSelectContext(inst.id)} className="text-xs bg-navy-100 text-navy-800 px-2 py-1 rounded hover:bg-navy-200">
                          اختيار
                      </button>
                  )}
                  {/* Edit - Visible to All */}
                  <button onClick={() => { setFormData(inst); setShowForm(true); }} className="text-blue-600 hover:text-blue-800">
                    <Edit2 size={18} />
                  </button>
                  
                  {/* DELETE: Render ONLY if Admin */}
                  {role === 'admin' && (
                    <button onClick={() => handleDelete(inst.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">لا توجد مؤسسات مطابقة</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold">{formData.id ? 'تعديل مؤسسة' : 'إضافة مؤسسة جديدة'}</h3>
              <button onClick={() => setShowForm(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Basic Info Section */}
              <div className="lg:col-span-3 pb-2 border-b mb-2">
                  <h4 className="text-navy-900 font-bold flex items-center gap-2"><FileText size={18}/> البيانات الأساسية</h4>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">اسم المؤسسة *</label>
                <input required className="w-full p-2 border rounded" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">النوع *</label>
                <select className="w-full p-2 border rounded" value={formData.type || 'وقفية عامة'} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                  <option value="وقفية عامة">وقفية عامة</option>
                  <option value="وقفية خاصة">وقفية خاصة</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">تاريخ التأسيس *</label>
                <div className="relative">
                    <Calendar className="absolute top-2.5 right-2 text-gray-400" size={16} />
                    <input required type="date" className="w-full p-2 pr-8 border rounded" value={formData.establishment_date || ''} onChange={e => setFormData({...formData, establishment_date: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">رقم السجل/الترخيص *</label>
                <div className="relative">
                    <Hash className="absolute top-2.5 right-2 text-gray-400" size={16} />
                    <input required type="text" className="w-full p-2 pr-8 border rounded" value={formData.license_number || ''} onChange={e => setFormData({...formData, license_number: e.target.value})} />
                </div>
              </div>

              {/* Management & Location */}
              <div className="lg:col-span-3 pb-2 border-b mb-2 mt-4">
                  <h4 className="text-navy-900 font-bold flex items-center gap-2"><User size={18}/> الإدارة والموقع</h4>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">مدير المؤسسة *</label>
                <input required type="text" className="w-full p-2 border rounded" value={formData.manager_name || ''} onChange={e => setFormData({...formData, manager_name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">رقم الهاتف *</label>
                <input required className="w-full p-2 border rounded" value={formData.contact_phone || ''} onChange={e => setFormData({...formData, contact_phone: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">البريد الإلكتروني *</label>
                <input required type="email" className="w-full p-2 border rounded" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
               <div>
                <label className="block text-sm font-medium mb-1">المحافظة *</label>
                <select required className="w-full p-2 border rounded" value={formData.governorate || ''} onChange={e => setFormData({...formData, governorate: e.target.value, wilayat: ''})}>
                  <option value="">اختر...</option>
                  {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الولاية *</label>
                <select required className="w-full p-2 border rounded" value={formData.wilayat || ''} onChange={e => setFormData({...formData, wilayat: e.target.value})} disabled={!formData.governorate}>
                  <option value="">اختر...</option>
                  {availableWilayats.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>

              {/* Financial & HR */}
              <div className="lg:col-span-3 pb-2 border-b mb-2 mt-4">
                  <h4 className="text-navy-900 font-bold flex items-center gap-2"><Hash size={18}/> البيانات المالية والبشرية</h4>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">رأس المال (ر.ع) *</label>
                <input type="number" required className="w-full p-2 border rounded" value={formData.capital_omr || ''} onChange={e => setFormData({...formData, capital_omr: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الموظفين العمانيين</label>
                <input type="number" className="w-full p-2 border rounded" value={formData.employees_omani || ''} onChange={e => setFormData({...formData, employees_omani: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الموظفين غير العمانيين</label>
                <input type="number" className="w-full p-2 border rounded" value={formData.employees_non_omani || ''} onChange={e => setFormData({...formData, employees_non_omani: Number(e.target.value)})} />
              </div>

              {/* Document Upload */}
              <div className="lg:col-span-3 border-t pt-4 mt-2">
                   <h4 className="font-bold text-sm mb-3">ملفات المؤسسة (السجل التجاري، الصكوك...)</h4>
                   <div className="flex gap-2 mb-3">
                       <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 text-sm border border-gray-300">
                           <UploadCloud size={16} /> رفع ملف
                           <input type="file" className="hidden" onChange={handleFileUpload} />
                       </label>
                   </div>
                   {formData.documents && formData.documents.length > 0 && (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                           {formData.documents.map((doc, idx) => (
                               <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded border">
                                   <div className="flex items-center gap-2">
                                       <FileText size={16} className="text-blue-500" />
                                       <span className="text-sm truncate max-w-[150px]">{doc.name}</span>
                                       <span className="text-xs text-gray-400">({doc.size})</span>
                                   </div>
                                   <button type="button" onClick={() => setFormData(p => ({...p, documents: p.documents?.filter((_, i) => i !== idx)}))} className="text-red-500 hover:text-red-700">
                                       <X size={16} />
                                   </button>
                               </div>
                           ))}
                       </div>
                   )}
              </div>

              <div className="lg:col-span-3 mt-4 flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">إلغاء</button>
                <button type="submit" className="px-6 py-2 bg-navy-800 text-white rounded hover:bg-navy-900 shadow-lg">حفظ المؤسسة</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Institutions;