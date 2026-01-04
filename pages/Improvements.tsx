import React, { useState, useEffect } from 'react';
import { 
    getInstitutions, getEvaluations, getResponses, getIndicators, 
    getImprovements, saveImprovement, deleteImprovement, 
    getRisks, getComplianceByInstAndYear, generateId 
} from '../services/db';
import { Institution, ImprovementItem } from '../types';
import { CURRENT_YEAR } from '../constants';
import { 
    Clock, CheckCircle, AlertTriangle, Building, 
    ArrowRight, ArrowLeft, Trash2, Layout, Activity, ShieldAlert, Scale,
    Save, Download, Printer
} from 'lucide-react';
import { useUi } from '../contexts/UiContext';

// Declare html2pdf for TypeScript
declare const html2pdf: any;

type ColumnType = 'ToDo' | 'Doing' | 'Done';

const Improvements: React.FC = () => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const { currentWaqfId, showToast } = useUi();
  const [institutionName, setInstitutionName] = useState('');
  
  // Kanban State
  const [columns, setColumns] = useState<{ [key in ColumnType]: ImprovementItem[] }>({
      ToDo: [],
      Doing: [],
      Done: []
  });

  useEffect(() => {
    setInstitutions(getInstitutions());
  }, []);

  // Main Data Loading & Auto-Generation Logic
  useEffect(() => {
    if (!currentWaqfId) {
        setColumns({ ToDo: [], Doing: [], Done: [] });
        return;
    }
    
    const inst = institutions.find(i => i.id === currentWaqfId);
    setInstitutionName(inst?.name || '');

    // Get Evaluation ID (Create dummy if missing to group items)
    const ev = getEvaluations().find(e => e.institution_id === currentWaqfId && e.cycle_year === CURRENT_YEAR);
    const evalId = ev?.id || `TEMP_EVAL_${currentWaqfId}`; 

    // 1. Fetch Existing Improvements
    const existingItems = getImprovements(evalId);

    if (existingItems.length > 0) {
        // Sort into columns
        setColumns({
            ToDo: existingItems.filter(i => i.status === 'ToDo'),
            Doing: existingItems.filter(i => i.status === 'Doing'),
            Done: existingItems.filter(i => i.status === 'Done'),
        });
    } else {
        // 2. Auto-Generate from 3 Sources
        const newItems: ImprovementItem[] = [];
        const indicators = getIndicators();

        // Source A: Performance Weaknesses (Score < 3)
        if (ev) {
            const responses = getResponses(ev.id);
            responses.filter(r => r.score < 3).forEach(r => {
                const ind = indicators.find(i => i.id === r.indicator_id);
                if (ind) {
                    newItems.push({
                        id: generateId(),
                        evaluation_id: evalId,
                        indicator_id: `PERF-${ind.id}`, // Prefix to identify source
                        priority: 'Medium',
                        issue_summary: `ضعف الأداء: ${ind.text.substring(0, 50)}...`,
                        recommended_action: 'تحليل أسباب الانخفاض ووضع خطة تصحيحية.',
                        owner: 'مدير العمليات',
                        due_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
                        status: 'ToDo',
                        notes: 'تم استيراده تلقائياً من التقييم'
                    });
                }
            });
        }

        // Source B: High Risks (Prob * Impact >= 15)
        const risks = getRisks(currentWaqfId);
        risks.filter(r => (r.probability * r.impact) >= 15).forEach(r => {
            newItems.push({
                id: generateId(),
                evaluation_id: evalId,
                indicator_id: `RISK-${r.id}`,
                priority: 'High',
                issue_summary: `خطر حرج: ${r.risk_title}`,
                recommended_action: r.mitigation_plan || 'تفعيل خطة طوارئ عاجلة.',
                owner: 'لجنة المخاطر',
                due_date: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0], // 2 weeks
                status: 'ToDo',
                notes: 'تم استيراده تلقائياً من سجل المخاطر'
            });
        });

        // Source C: Compliance Gaps (False/Not Met)
        const comp = getComplianceByInstAndYear(currentWaqfId, CURRENT_YEAR);
        if (comp) {
            const gaps = [];
            if (comp.institution_status !== 'فاعلة') gaps.push('حالة المؤسسة غير فاعلة');
            if (comp.board_status !== 'قائم') gaps.push('مجلس الإدارة غير قائم');
            if (!comp.has_executive_management) gaps.push('غياب الإدارة التنفيذية');
            if (!comp.has_auditor_company) gaps.push('لم يتم تعيين مدقق خارجي');
            
            gaps.forEach((gap, idx) => {
                newItems.push({
                    id: generateId(),
                    evaluation_id: evalId,
                    indicator_id: `COMP-${idx}`,
                    priority: 'High',
                    issue_summary: `قصور امتثال: ${gap}`,
                    recommended_action: 'استيفاء المتطلب النظامي فوراً.',
                    owner: 'أمين السر / المدير',
                    due_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
                    status: 'ToDo',
                    notes: 'تم استيراده تلقائياً من سجل الامتثال'
                });
            });
        }

        // Save & Set State
        if (newItems.length > 0) {
            newItems.forEach(saveImprovement);
            setColumns(prev => ({ ...prev, ToDo: newItems }));
            showToast(`تم إنشاء ${newItems.length} مهام تحسين تلقائياً`, 'info');
        }
    }

  }, [currentWaqfId, institutions]);

  // Actions
  const moveItem = (item: ImprovementItem, direction: 'forward' | 'backward') => {
      let newStatus: ColumnType = item.status;
      
      if (direction === 'forward') {
          if (item.status === 'ToDo') newStatus = 'Doing';
          else if (item.status === 'Doing') newStatus = 'Done';
      } else {
          if (item.status === 'Done') newStatus = 'Doing';
          else if (item.status === 'Doing') newStatus = 'ToDo';
      }

      if (newStatus !== item.status) {
          const updatedItem = { ...item, status: newStatus };
          saveImprovement(updatedItem); // Persist
          
          // Optimistic UI Update
          setColumns(prev => {
              const sourceList = prev[item.status].filter(i => i.id !== item.id);
              const targetList = [updatedItem, ...prev[newStatus]];
              return { ...prev, [item.status as ColumnType]: sourceList, [newStatus]: targetList };
          });
      }
  };

  const handleDelete = (id: string, status: ColumnType) => {
      if(confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
          deleteImprovement(id);
          setColumns(prev => ({
              ...prev,
              [status]: prev[status].filter(i => i.id !== id)
          }));
          showToast('تم حذف المهمة', 'info');
      }
  };
  
  const handleManualSave = () => {
      // Re-save all items (redundant but gives user peace of mind)
      const allItems = [...columns.ToDo, ...columns.Doing, ...columns.Done];
      if (allItems.length > 0) {
          allItems.forEach(saveImprovement);
          showToast('تم حفظ كافة التغييرات بنجاح', 'success');
      } else {
          showToast('لا توجد مهام للحفظ', 'info');
      }
  };

  const handleDownloadPDF = () => {
      const element = document.getElementById('kanban-board');
      if (!element) return;
      
      const opt = {
        margin:       5,
        filename:     `Improvement-Plan-${institutionName}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' } // Landscape for Kanban
      };
      
      html2pdf().from(element).set(opt).save();
  };

  const getSourceBadge = (indicatorId: string) => {
      if (indicatorId.startsWith('RISK-')) return { label: 'مخاطر', color: 'bg-red-100 text-red-800', icon: ShieldAlert };
      if (indicatorId.startsWith('COMP-')) return { label: 'امتثال', color: 'bg-purple-100 text-purple-800', icon: Scale };
      return { label: 'أداء', color: 'bg-orange-100 text-orange-800', icon: Activity };
  };

  return (
    <div className="space-y-6 min-h-screen">
      <div className="flex justify-between items-center no-print">
        <h2 className="text-2xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
            <Layout className="text-teal-600"/> لوحة متابعة التحسين
        </h2>
        {currentWaqfId && (
            <div className="flex gap-2">
                <button 
                    onClick={handleManualSave} 
                    className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700 shadow-md transition-colors font-bold text-sm"
                >
                    <Save size={18} /> حفظ
                </button>
                <button 
                    onClick={handleDownloadPDF} 
                    className="bg-navy-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-navy-900 shadow-md transition-colors font-bold text-sm"
                >
                    <Download size={18} /> تصدير PDF
                </button>
            </div>
        )}
      </div>

       {/* Banner */}
      {currentWaqfId ? (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center justify-between text-blue-900 animate-fadeIn no-print mb-8">
              <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg"><Building size={20} className="text-blue-700"/></div>
                  <div>
                      <div className="text-xs text-blue-600 uppercase font-bold tracking-wider">خطة المؤسسة:</div>
                      <div className="text-lg font-bold">{institutionName}</div>
                  </div>
              </div>
          </div>
      ) : (
          <div className="bg-orange-50 border border-orange-200 p-6 rounded-xl text-center no-print">
              <p className="text-orange-800 font-bold mb-2">لم يتم اختيار مؤسسة</p>
              <p className="text-sm text-orange-600">يرجى اختيار مؤسسة لعرض مهام التحسين الخاصة بها.</p>
          </div>
      )}

      {currentWaqfId && (
        <div id="kanban-board" className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start overflow-x-auto pb-10 bg-white/50 p-4 rounded-xl">
            {/* Column 1: To Do */}
            <KanbanColumn 
                title="مهام جديدة" 
                count={columns.ToDo.length} 
                color="border-red-400 bg-red-50 dark:bg-red-900/10"
                icon={<AlertTriangle size={18} className="text-red-600"/>}
            >
                {columns.ToDo.map(item => (
                    <KanbanCard 
                        key={item.id} 
                        item={item} 
                        onMoveForward={() => moveItem(item, 'forward')}
                        onDelete={() => handleDelete(item.id, 'ToDo')}
                        badge={getSourceBadge(item.indicator_id)}
                    />
                ))}
            </KanbanColumn>

            {/* Column 2: Doing */}
            <KanbanColumn 
                title="جاري المعالجة" 
                count={columns.Doing.length} 
                color="border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10"
                icon={<Clock size={18} className="text-yellow-600"/>}
            >
                {columns.Doing.map(item => (
                    <KanbanCard 
                        key={item.id} 
                        item={item} 
                        onMoveBack={() => moveItem(item, 'backward')}
                        onMoveForward={() => moveItem(item, 'forward')}
                        onDelete={() => handleDelete(item.id, 'Doing')}
                        badge={getSourceBadge(item.indicator_id)}
                    />
                ))}
            </KanbanColumn>

            {/* Column 3: Done */}
            <KanbanColumn 
                title="تم الإنجاز" 
                count={columns.Done.length} 
                color="border-green-400 bg-green-50 dark:bg-green-900/10"
                icon={<CheckCircle size={18} className="text-green-600"/>}
            >
                {columns.Done.map(item => (
                    <KanbanCard 
                        key={item.id} 
                        item={item} 
                        onMoveBack={() => moveItem(item, 'backward')}
                        onDelete={() => handleDelete(item.id, 'Done')}
                        badge={getSourceBadge(item.indicator_id)}
                        isDone
                    />
                ))}
            </KanbanColumn>
        </div>
      )}
    </div>
  );
};

// --- Sub Components ---

const KanbanColumn = ({ title, count, children, color, icon }: any) => (
    <div className={`flex flex-col h-full min-h-[500px] rounded-xl border-t-4 ${color} bg-gray-50/50 dark:bg-gray-800 shadow-sm`}>
        <div className="p-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-xl">
            <h3 className="font-bold text-navy-900 dark:text-white flex items-center gap-2">{icon} {title}</h3>
            <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs px-2 py-1 rounded-full font-bold">{count}</span>
        </div>
        <div className="p-3 space-y-3 flex-1">
            {children}
            {count === 0 && <div className="text-center py-10 text-gray-400 text-sm italic">لا توجد مهام</div>}
        </div>
    </div>
);

const KanbanCard = ({ item, onMoveBack, onMoveForward, onDelete, badge, isDone }: any) => {
    const Icon = badge.icon;
    return (
        <div className={`bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600 hover:shadow-md transition-shadow relative group ${isDone ? 'opacity-75' : ''}`}>
            {/* Delete Button (Hidden until hover) */}
            <button 
                onClick={onDelete}
                className="absolute top-2 left-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity no-print"
            >
                <Trash2 size={16} />
            </button>

            {/* Badge */}
            <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${badge.color}`}>
                    <Icon size={12} /> {badge.label}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded border ${item.priority === 'High' ? 'text-red-600 border-red-200 bg-red-50' : 'text-gray-500 border-gray-200'}`}>
                    {item.priority === 'High' ? 'أولوية قصوى' : 'عادية'}
                </span>
            </div>

            {/* Content */}
            <h4 className={`font-bold text-sm text-navy-900 dark:text-white mb-2 ${isDone ? 'line-through text-gray-500' : ''}`}>
                {item.issue_summary}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-300 mb-3 leading-relaxed bg-gray-50 dark:bg-gray-800 p-2 rounded">
                {item.recommended_action}
            </p>
            
            <div className="flex justify-between items-center text-xs text-gray-400 border-t border-gray-100 dark:border-gray-600 pt-2 mb-3">
                <span>{item.owner}</span>
                <span>{item.due_date}</span>
            </div>

            {/* Controls */}
            <div className="flex justify-between items-center gap-2 no-print">
                {onMoveForward ? (
                    <button onClick={onMoveForward} className="flex-1 bg-navy-50 text-navy-800 hover:bg-navy-100 dark:bg-navy-900 dark:text-blue-200 dark:hover:bg-navy-800 py-1.5 rounded text-xs font-bold flex justify-center items-center gap-1 transition-colors">
                        نقل للمرحلة التالية <ArrowLeft size={14} />
                    </button>
                ) : <div className="flex-1"></div>}
                
                {onMoveBack && (
                     <button onClick={onMoveBack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 transition-colors" title="عودة للسابق">
                         <ArrowRight size={16} />
                     </button>
                )}
            </div>
        </div>
    );
};

export default Improvements;