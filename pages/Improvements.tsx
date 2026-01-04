import React from 'react';
import { CheckCircle2, Clock, ArrowUpCircle, UploadCloud } from 'lucide-react';

const Improvements: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <div>
            <h2 className="text-2xl font-bold text-navy-900 dark:text-white">خطة التحسين والتطوير</h2>
            <p className="text-gray-500 text-sm">متابعة الإجراءات التصحيحية لرفع مستوى الحوكمة</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-start mb-4">
                  <div>
                      <p className="text-gray-500 text-sm">المهام المكتملة</p>
                      <h3 className="text-3xl font-bold text-green-600">4</h3>
                  </div>
                  <div className="p-2 bg-green-50 rounded-lg text-green-600"><CheckCircle2 size={24}/></div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '40%'}}></div>
              </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-start mb-4">
                  <div>
                      <p className="text-gray-500 text-sm">قيد التنفيذ</p>
                      <h3 className="text-3xl font-bold text-orange-500">2</h3>
                  </div>
                  <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><Clock size={24}/></div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{width: '20%'}}></div>
              </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-start mb-4">
                  <div>
                      <p className="text-gray-500 text-sm">درجة التحسن المتوقعة</p>
                      <h3 className="text-3xl font-bold text-blue-600">+15%</h3>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><ArrowUpCircle size={24}/></div>
              </div>
              <p className="text-xs text-gray-400 mt-2">بعد إكمال كافة المهام</p>
          </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-lg text-navy-900 dark:text-white">سجل المهام والإجراءات</h3>
          </div>
          <table className="w-full text-right">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium text-sm">
                  <tr>
                      <th className="p-4">المهمة / الإجراء</th>
                      <th className="p-4">الأولوية</th>
                      <th className="p-4">المسؤول</th>
                      <th className="p-4">تاريخ الاستحقاق</th>
                      <th className="p-4">الحالة</th>
                      <th className="p-4">إجراءات</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="p-4 font-medium">اعتماد سياسة تعارض المصالح</td>
                      <td className="p-4"><span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">عالية</span></td>
                      <td className="p-4 text-sm text-gray-500">رئيس المجلس</td>
                      <td className="p-4 text-sm font-mono">2024-02-01</td>
                      <td className="p-4"><span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full border border-green-200">تم الإنجاز</span></td>
                      <td className="p-4">
                          <button className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-bold border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                              <UploadCloud size={14} />
                              إرفاق دليل
                          </button>
                      </td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="p-4 font-medium">تعيين مدقق داخلي مستقل</td>
                      <td className="p-4"><span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">متوسطة</span></td>
                      <td className="p-4 text-sm text-gray-500">لجنة التدقيق</td>
                      <td className="p-4 text-sm font-mono">2024-03-15</td>
                      <td className="p-4"><span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full border border-orange-200">قيد التنفيذ</span></td>
                      <td className="p-4">
                          <button className="text-gray-400 text-xs cursor-not-allowed">انتظار الإنجاز</button>
                      </td>
                  </tr>
              </tbody>
          </table>
      </div>
    </div>
  );
};

export default Improvements;