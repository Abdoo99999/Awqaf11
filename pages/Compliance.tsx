import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, FileText, CheckCircle2, XCircle, Settings } from 'lucide-react';
import { useUi } from '../contexts/UiContext';

const RiskCompliance: React.FC = () => {
  const { role } = useUi(); 
  const [activeTab, setActiveTab] = useState<'compliance' | 'risks'>('compliance');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-navy-900 dark:text-white">المخاطر والامتثال</h2>
           <p className="text-gray-500 text-sm">مراقبة الالتزام باللوائح وتحليل المخاطر التشغيلية</p>
        </div>
        
        {/* زر المدير فقط */}
        {role === 'admin' && (
             <button className="flex items-center gap-2 bg-navy-800 text-white px-4 py-2 rounded-lg hover:bg-navy-900 shadow-sm transition-colors text-sm">
                <Settings size={16} />
                تعديل معايير المؤشرات
             </button>
        )}
      </div>

      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
          <button 
            onClick={() => setActiveTab('compliance')}
            className={`pb-3 px-4 font-medium transition-colors border-b-2 ${activeTab === 'compliance' ? 'border-navy-800 text-navy-900 dark:text-white dark:border-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            الامتثال التشريعي
          </button>
          <button 
            onClick={() => setActiveTab('risks')}
            className={`pb-3 px-4 font-medium transition-colors border-b-2 ${activeTab === 'risks' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            سجل المخاطر
          </button>
      </div>

      {activeTab === 'compliance' ? (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="space-y-4">
                  {[
                      { title: "وجود لائحة تنظيمية داخلية معتمدة", status: "met" },
                      { title: "الالتزام بقانون الأوقاف العماني ولائحته التنفيذية", status: "met" },
                      { title: "تقديم التقارير المالية السنوية في موعدها", status: "partially" },
                      { title: "عدم وجود مخالفات قانونية مسجلة", status: "met" },
                      { title: "توثيق اجتماعات مجلس الإدارة بشكل دوري", status: "unmet" }
                  ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                          <div className="flex items-center gap-3">
                              <ShieldCheck className="text-teal-600" size={20} />
                              <span className="font-medium text-gray-800 dark:text-gray-200">{item.title}</span>
                          </div>
                          <div>
                              {item.status === 'met' && <span className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold border border-green-100"><CheckCircle2 size={14}/> ممتثل</span>}
                              {item.status === 'partially' && <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-3 py-1 rounded-full text-xs font-bold border border-orange-100"><AlertTriangle size={14}/> جزئي</span>}
                              {item.status === 'unmet' && <span className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full text-xs font-bold border border-red-100"><XCircle size={14}/> غير ممتثل</span>}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-100 dark:border-red-900/50">
                   <h3 className="font-bold text-red-800 dark:text-red-300 mb-4 flex items-center gap-2"><AlertTriangle size={20}/> مخاطر عالية</h3>
                   <ul className="space-y-3">
                       <li className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm text-sm text-gray-700 dark:text-gray-300 border-r-4 border-red-500">عدم تنوع المحفظة الاستثمارية (تركز في العقار فقط)</li>
                       <li className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm text-sm text-gray-700 dark:text-gray-300 border-r-4 border-red-500">ضعف في إجراءات الأمن السيبراني للبيانات</li>
                   </ul>
               </div>
               <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-xl border border-yellow-100 dark:border-yellow-900/50">
                   <h3 className="font-bold text-yellow-800 dark:text-yellow-300 mb-4 flex items-center gap-2"><AlertTriangle size={20}/> مخاطر متوسطة</h3>
                   <ul className="space-y-3">
                       <li className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm text-sm text-gray-700 dark:text-gray-300 border-r-4 border-yellow-500">تأخر في تحصيل الإيجارات لبعض الوحدات</li>
                   </ul>
               </div>
          </div>
      )}
    </div>
  );
};

export default RiskCompliance;