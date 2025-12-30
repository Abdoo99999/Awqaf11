import React, { useState, useEffect } from 'react';
import { getInstitutions, getIndicators, saveIndicators, getEvaluationByInstAndYear, saveEvaluation, getResponses, saveResponse, generateId } from '../services/db';
import { Institution, Indicator, Evaluation, Response, InstitutionDocument } from '../types';
import { CURRENT_YEAR, RATING_COLORS } from '../constants';
import { Upload, Save, ChevronDown, ChevronUp, Paperclip, FileText, X, PlusCircle, PieChart as PieIcon, Trash2, MinusCircle, Building, SaveAll } from 'lucide-react';
import { useUi } from '../contexts/UiContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

declare const XLSX: any; // SheetJS global

const EvaluationPage: React.FC = () => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  // Use Global Context instead of local state for selection
  const { showToast, currentWaqfId, role } = useUi();
  
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [responses, setResponses] = useState<Record<string, Response>>({});
  
  // New Indicator Modal State
  const [showAddInd, setShowAddInd] = useState(false);
  const [newIndAxis, setNewIndAxis] = useState('');
  const [customAxis, setCustomAxis] = useState('');
  const [newIndText, setNewIndText] = useState('');
  
  // Delete Indicator Modal State
  const [showDeleteInd, setShowDeleteInd] = useState(false);
  const [deleteAxis, setDeleteAxis] = useState('');
  const [deleteIndId, setDeleteIndId] = useState('');

  // UI State
  const [openAxis, setOpenAxis] = useState<string | null>(null);

  useEffect(() => {
    setInstitutions(getInstitutions());
    // Auto load default indicators
    const inds = getIndicators();
    setIndicators(inds);
    // Open first axis by default
    if (inds.length > 0) {
        setOpenAxis(inds[0].axis);
    }
  }, []);

  useEffect(() => {
    // Check if global context is set
    if (currentWaqfId && indicators.length > 0) {
      // Find or Create Evaluation for the current global institution
      let ev = getEvaluationByInstAndYear(currentWaqfId, CURRENT_YEAR);
      if (!ev) {
        ev = {
          id: generateId(),
          institution_id: currentWaqfId,
          cycle_year: CURRENT_YEAR,
          cycle_date: new Date().toISOString(),
          status: 'draft',
          attachments: [],
          created_at: new Date().toISOString()
        };
        saveEvaluation(ev);
      }
      setEvaluation(ev);
      
      // Load Responses
      const resps = getResponses(ev.id);
      const respMap: Record<string, Response> = {};
      resps.forEach(r => respMap[r.indicator_id] = r);
      setResponses(respMap);
    } else {
      setEvaluation(null);
    }
  }, [currentWaqfId, indicators.length]);

  const handleScore = (indicatorId: string, score: number) => {
    if (!evaluation) return;
    const newResp: Response = {
      id: responses[indicatorId]?.id || generateId(),
      evaluation_id: evaluation.id,
      indicator_id: indicatorId,
      score,
      updated_at: new Date().toISOString()
    };
    
    setResponses(prev => ({ ...prev, [indicatorId]: newResp }));
    saveResponse(newResp);
  };

  const handleAddIndicator = () => {
      const finalAxis = newIndAxis === 'NEW_AXIS_CUSTOM_VALUE' ? customAxis : newIndAxis;
      
      if(!newIndText || !finalAxis) {
          showToast('يرجى تعبئة جميع الحقول', 'error');
          return;
      }
      
      const indicator: Indicator = {
          id: `IND-MANUAL-${generateId().substring(0,6)}`,
          axis: finalAxis,
          text: newIndText,
          weight: 1,
          active: true
      };
      
      const updatedList = [...indicators, indicator];
      setIndicators(updatedList);
      saveIndicators(updatedList);
      
      setShowAddInd(false);
      setNewIndAxis('');
      setCustomAxis('');
      setNewIndText('');
      showToast('تم إضافة المؤشر الجديد بنجاح', 'success');
  };

  const handleDeleteIndicator = () => {
      if (!deleteIndId) {
          showToast('يرجى اختيار المؤشر للحذف', 'error');
          return;
      }
      
      if(confirm('هل أنت متأكد من حذف هذا المؤشر؟ سيتم حذفه من القائمة.')) {
          const updatedList = indicators.filter(i => i.id !== deleteIndId);
          setIndicators(updatedList);
          saveIndicators(updatedList);
          
          setShowDeleteInd(false);
          setDeleteIndId('');
          setDeleteAxis('');
          showToast('تم حذف المؤشر', 'info');
      }
  };

  const openDeleteModal = () => {
      setDeleteAxis('');
      setDeleteIndId('');
      setShowDeleteInd(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0] && evaluation) {
          const file = e.target.files[0];
          const newDoc: InstitutionDocument = {
              id: generateId(),
              name: file.name,
              type: file.type,
              size: (file.size / 1024).toFixed(1) + ' KB',
              upload_date: new Date().toLocaleDateString('ar-OM')
          };
          
          const updatedEval = { 
              ...evaluation, 
              attachments: [...(evaluation.attachments || []), newDoc] 
          };
          setEvaluation(updatedEval);
          saveEvaluation(updatedEval);
          showToast('تم إرفاق الدليل بنجاح', 'success');
      }
  };

  const removeAttachment = (docId: string) => {
      if (!evaluation) return;
      const updatedEval = {
          ...evaluation,
          attachments: evaluation.attachments?.filter(d => d.id !== docId) || []
      };
      setEvaluation(updatedEval);
      saveEvaluation(updatedEval);
      showToast('تم حذف المرفق', 'info');
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data: any[] = XLSX.utils.sheet_to_json(ws);

      if (confirm('سيتم استبدال المؤشرات الحالية بالمؤشرات الجديدة من الملف. هل أنت متأكد؟')) {
          const newIndicators: Indicator[] = data.map((row, idx) => ({
            id: `IND-${idx + 1}`,
            axis: row['المحور'] || 'عام',
            text: row['وصف التقييم'] || row['Indicator'] || 'بدون نص',
            weight: 1,
            active: true
          })).filter(i => i.text !== 'بدون نص');
    
          if(newIndicators.length > 0) {
              saveIndicators(newIndicators);
              setIndicators(newIndicators);
              showToast(`تم استيراد ${newIndicators.length} مؤشر بنجاح`, 'success');
          } else {
              showToast('لم يتم العثور على بيانات صالحة في الملف.', 'error');
          }
      }
    };
    reader.readAsBinaryString(file);
  };

  // Group by Axis
  const grouped = indicators.reduce((acc, curr) => {
    if (!acc[curr.axis]) acc[curr.axis] = [];
    acc[curr.axis].push(curr);
    return acc;
  }, {} as Record<string, Indicator[]>);
  
  // Available Axes for Dropdowns
  const availableAxes = Object.keys(grouped);

  // Performance Pie Data
  const responseValues = Object.values(responses) as Response[];
  const performanceData = [
      { name: 'منخفض (1-2)', value: responseValues.filter(r => r.score <= 2).length, fill: '#ef4444' },
      { name: 'متوسط (3)', value: responseValues.filter(r => r.score === 3).length, fill: '#f59e0b' },
      { name: 'مرتفع (4-5)', value: responseValues.filter(r => r.score >= 4).length, fill: '#10b981' },
  ].filter(d => d.value > 0);

  const currentInstitutionName = institutions.find(i => i.id === currentWaqfId)?.name;

  // Save Handlers
  const handleDraftSave = () => {
      // Logic handled in handleScore automatically to LS, but this gives feedback
      showToast('تم حفظ التغييرات كمسودة', 'info');
  };

  const handleFinalSave = () => {
      const totalIndicators = indicators.length;
      const scoredCount = Object.keys(responses).length;
      const remaining = totalIndicators - scoredCount;

      if (remaining > 0) {
          showToast(`عذراً، لا يمكن الاعتماد النهائي. متبقي ${remaining} مؤشر لم يتم تقييمه.`, 'error');
          return;
      }

      if (evaluation) {
          const updatedEval = { ...evaluation, status: 'final' as const };
          setEvaluation(updatedEval);
          saveEvaluation(updatedEval);
          showToast('تم اعتماد التقييم النهائي بنجاح', 'success');
      }
  };

  return (
    <div className="space-y-6 relative pb-24">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h2 className="text-2xl font-bold text-navy-900">نموذج التقييم</h2>
        
        {role === 'admin' && (
          <div className="flex gap-2">
              <button onClick={() => { setNewIndAxis(availableAxes[0] || 'عام'); setShowAddInd(true); }} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 shadow-sm">
                  <PlusCircle size={18} /> إضافة مؤشر
              </button>
              <button onClick={openDeleteModal} className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-50 shadow-sm">
                  <MinusCircle size={18} /> حذف مؤشر
              </button>
              <label className="bg-navy-800 text-white px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 hover:bg-navy-900 shadow-md">
                  <Upload size={18} /> تحديث (Excel)
                  <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleExcelImport} />
              </label>
          </div>
        )}
      </div>

      {/* Currently Viewing Banner - Replaces Selector */}
      {currentWaqfId ? (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center justify-between text-blue-900 animate-fadeIn">
              <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg"><Building size={20} className="text-blue-700"/></div>
                  <div>
                      <div className="text-xs text-blue-600 uppercase font-bold tracking-wider">جاري عرض بيانات تقييم:</div>
                      <div className="text-lg font-bold">{currentInstitutionName} ({CURRENT_YEAR})</div>
                  </div>
              </div>
          </div>
      ) : (
          <div className="bg-orange-50 border border-orange-200 p-6 rounded-xl text-center">
              <p className="text-orange-800 font-bold mb-2">لم يتم اختيار مؤسسة</p>
              <p className="text-sm text-orange-600">يرجى الذهاب إلى لوحة القيادة (Dashboard) أو صفحة المؤسسات لاختيار المؤسسة التي تود العمل عليها.</p>
          </div>
      )}

      {/* Add Indicator Modal */}
      {showAddInd && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold">إضافة مؤشر جديد</h3>
                      <button onClick={() => setShowAddInd(false)}><X size={20}/></button>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium mb-1">المحور</label>
                          <select 
                            className="w-full border p-2 rounded" 
                            value={newIndAxis} 
                            onChange={e => setNewIndAxis(e.target.value)}
                          >
                              {availableAxes.map(a => <option key={a} value={a}>{a}</option>)}
                              <option value="NEW_AXIS_CUSTOM_VALUE">محور جديد (اكتب أدناه)</option>
                          </select>
                          {newIndAxis === 'NEW_AXIS_CUSTOM_VALUE' && (
                              <input 
                                type="text" 
                                placeholder="اكتب اسم المحور الجديد" 
                                className="w-full border p-2 rounded mt-2" 
                                value={customAxis}
                                onChange={e => setCustomAxis(e.target.value)} 
                              />
                          )}
                      </div>
                      <div>
                          <label className="block text-sm font-medium mb-1">نص المؤشر</label>
                          <textarea 
                            className="w-full border p-2 rounded h-24" 
                            value={newIndText} 
                            onChange={e => setNewIndText(e.target.value)}
                          ></textarea>
                      </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                      <button onClick={() => setShowAddInd(false)} className="px-4 py-2 text-gray-600">إلغاء</button>
                      <button onClick={handleAddIndicator} className="px-4 py-2 bg-navy-800 text-white rounded">إضافة</button>
                  </div>
              </div>
          </div>
      )}

      {/* Delete Indicator Modal */}
      {showDeleteInd && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-red-600">حذف مؤشر</h3>
                      <button onClick={() => setShowDeleteInd(false)}><X size={20}/></button>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium mb-1">اختر المحور</label>
                          <select 
                            className="w-full border p-2 rounded" 
                            value={deleteAxis} 
                            onChange={e => { setDeleteAxis(e.target.value); setDeleteIndId(''); }}
                          >
                              <option value="">-- اختر --</option>
                              {availableAxes.map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                      </div>
                      {deleteAxis && (
                          <div>
                              <label className="block text-sm font-medium mb-1">اختر المؤشر للحذف</label>
                              <select 
                                className="w-full border p-2 rounded" 
                                value={deleteIndId} 
                                onChange={e => setDeleteIndId(e.target.value)}
                              >
                                  <option value="">-- اختر --</option>
                                  {grouped[deleteAxis]?.map(ind => (
                                      <option key={ind.id} value={ind.id}>{ind.text.substring(0, 60)}...</option>
                                  ))}
                              </select>
                          </div>
                      )}
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                      <button onClick={() => setShowDeleteInd(false)} className="px-4 py-2 text-gray-600">إلغاء</button>
                      <button 
                        onClick={handleDeleteIndicator} 
                        disabled={!deleteIndId}
                        className={`px-4 py-2 text-white rounded ${!deleteIndId ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                      >
                          حذف
                      </button>
                  </div>
              </div>
          </div>
      )}

      {currentWaqfId && indicators.length > 0 && (
        <div className="space-y-4 animate-fadeIn">
          {Object.keys(grouped).map((axis, idx) => (
            <div key={axis} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300">
              <button 
                className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${openAxis === axis ? 'bg-navy-50' : ''}`}
                onClick={() => setOpenAxis(openAxis === axis ? null : axis)}
              >
                <div className="flex items-center gap-3">
                   <span className="w-8 h-8 rounded-full bg-navy-800 text-white flex items-center justify-center font-bold text-sm">{idx + 1}</span>
                   <h3 className="font-bold text-navy-900 text-lg">{axis}</h3>
                   <span className="text-sm text-gray-500">({grouped[axis].length} مؤشر)</span>
                </div>
                {openAxis === axis ? <ChevronUp className="text-navy-800" /> : <ChevronDown className="text-gray-400" />}
              </button>
              
              {openAxis === axis && (
                <div className="p-4 space-y-6 bg-white border-t border-gray-100">
                  {grouped[axis].map(ind => (
                    <div key={ind.id} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex gap-3 flex-1">
                            <p className="text-gray-700 font-medium leading-relaxed">{ind.text}</p>
                        </div>
                        
                        <div className="flex gap-2 shrink-0">
                            {[1, 2, 3, 4, 5].map(score => (
                            <button
                                key={score}
                                onClick={() => handleScore(ind.id, score)}
                                className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold border-2 transition-all shadow-sm ${
                                responses[ind.id]?.score === score
                                    ? `${RATING_COLORS[score]} scale-110 shadow-md ring-2 ring-offset-2 ring-gray-300`
                                    : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
                                }`}
                            >
                                {score}
                            </button>
                            ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {/* Action Bar & Stats Footer */}
          <div className="fixed bottom-0 left-0 right-0 lg:right-64 bg-white border-t shadow-[0_-4px_10px_rgba(0,0,0,0.1)] p-4 flex flex-col md:flex-row justify-between items-center z-40 gap-4">
             <div className="flex items-center gap-6">
                <div>
                    <span className="text-sm text-gray-500 block">تقدم التقييم</span>
                    <span className="font-bold text-navy-900">{Object.keys(responses).length} / {indicators.length}</span>
                </div>
                
                {/* Mini Pie Chart for Score Breakdown */}
                {performanceData.length > 0 && (
                    <div className="flex items-center gap-3 border-r pr-6 mr-2">
                         <div className="w-10 h-10 relative">
                             <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={performanceData} dataKey="value" innerRadius={10} outerRadius={20} stroke="none">
                                        {performanceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                </PieChart>
                             </ResponsiveContainer>
                         </div>
                         <div className="text-xs space-y-0.5">
                             {performanceData.map(d => (
                                 <div key={d.name} className="flex items-center gap-1">
                                     <span className="w-2 h-2 rounded-full" style={{backgroundColor: d.fill}}></span>
                                     <span className="text-gray-600">{d.value}</span>
                                 </div>
                             ))}
                         </div>
                    </div>
                )}
             </div>

             <div className="flex items-center gap-4">
                 <div className="relative">
                     <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors">
                         <Paperclip size={16} /> إرفاق أدلة
                         <input type="file" className="hidden" onChange={handleFileUpload} />
                     </label>
                 </div>

                 {/* NEW: Draft Save Button */}
                 <button onClick={handleDraftSave} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-300 shadow-sm font-bold text-sm">
                    <SaveAll size={18} /> حفظ التغييرات
                 </button>

                 {/* FINAL SAVE: Checks for completion */}
                 <button onClick={handleFinalSave} className="bg-teal-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700 shadow-lg font-bold">
                    <Save size={18} /> حفظ نهائي
                 </button>
             </div>
          </div>
          
          {/* Attachments List */}
          {evaluation?.attachments && evaluation.attachments.length > 0 && (
             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-20">
                 <h4 className="font-bold text-gray-700 mb-3 text-sm flex items-center gap-2"><Paperclip size={16}/> المرفقات والأدلة ({evaluation.attachments.length})</h4>
                 <div className="flex flex-wrap gap-2">
                     {evaluation.attachments.map(doc => (
                         <div key={doc.id} className="bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg flex items-center gap-2 text-sm">
                             <FileText size={14} className="text-blue-500" />
                             <span className="truncate max-w-[150px]">{doc.name}</span>
                             <button onClick={() => removeAttachment(doc.id)} className="text-gray-400 hover:text-red-500"><X size={14}/></button>
                         </div>
                     ))}
                 </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EvaluationPage;