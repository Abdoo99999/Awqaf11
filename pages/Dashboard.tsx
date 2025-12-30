import React, { useMemo, useEffect, useState } from 'react';
import { getInstitutions, getEvaluations, getComplianceRecords, getAllResponses, getRisks, getIndicators } from '../services/db';
import { Institution, Evaluation, Response, RiskRegisterItem, Indicator } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area, CartesianGrid, LineChart, Line, LabelList, ReferenceLine } from 'recharts';
import { calculateRiskScore, GOVERNORATES } from '../constants';
import { Building, AlertTriangle, CheckCircle, TrendingUp, MapPin, Shield, Wallet, Users, UserCheck, Target, Activity, Coins, Medal, Briefcase, Filter, Trophy, Star, BarChart2 } from 'lucide-react';
import { useUi } from '../contexts/UiContext';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'];
const GOV_COLORS = ['#3366cc', '#dc3912', '#ff9900', '#109618', '#990099', '#0099c6', '#dd4477', '#66aa00', '#b82e2e', '#316395', '#994499'];
const RANK_COLORS = ['#fbbf24', '#94a3b8', '#b45309', '#475569', '#475569']; // Gold, Silver, Bronze, others

const InfographicCard = ({ title, value, icon: Icon, gradient, subtext, footer }: any) => (
  <div className={`relative overflow-hidden rounded-2xl shadow-xl ${gradient} text-white p-6 transition-transform hover:scale-[1.02] duration-300`}>
    <div className="relative z-10 flex justify-between items-start">
        <div>
            <p className="text-blue-100 font-medium mb-1 text-lg">{title}</p>
            <h3 className="text-4xl font-extrabold tracking-tight my-3">{value}</h3>
            {subtext && <p className="text-sm text-white/80 font-light">{subtext}</p>}
        </div>
        <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm shadow-inner">
            <Icon size={32} className="text-white" />
        </div>
    </div>
    {footer && (
        <div className="relative z-10 mt-6 pt-4 border-t border-white/20 text-sm font-medium">
            {footer}
        </div>
    )}
    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
    <div className="absolute top-10 -left-10 w-20 h-20 bg-black/10 rounded-full blur-2xl"></div>
  </div>
);

// Custom Tick for Radar Chart (pushed outward)
const RadarCustomTick = ({ payload, x, y, cx, cy, textAnchor, stroke, radius }: any) => {
    const shiftX = x > cx ? 25 : x < cx ? -25 : 0;
    const shiftY = y > cy ? 15 : y < cy ? -15 : 0;

    return (
        <g className="recharts-layer recharts-polar-angle-axis-tick">
            <text
                radius={radius}
                stroke={stroke}
                x={x + shiftX}
                y={y + shiftY}
                className="recharts-text recharts-polar-angle-axis-tick-value"
                textAnchor={textAnchor}
                fill="#374151"
                fontSize="12px"
                fontWeight="bold"
            >
                <tspan x={x + shiftX} dy="0.355em">{payload.value}</tspan>
            </text>
        </g>
    );
};

// Component for a single top-list item
const TopListItem = ({ rank, name, score, maxScore = 5 }: any) => {
    const percentage = (score / maxScore) * 100;
    const rankColor = RANK_COLORS[rank - 1] || RANK_COLORS[RANK_COLORS.length - 1];
    const Icon = rank <= 3 ? Trophy : Star;

    return (
        <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-700">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white shrink-0 shadow-sm`} style={{ backgroundColor: rankColor }}>
                {rank <= 3 ? <Icon size={18} /> : <span>{rank}</span>}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-1">
                    <span className="text-sm font-bold text-navy-900 dark:text-white truncate" title={name}>{name}</span>
                    <span className="text-sm font-extrabold text-teal-600 dark:text-teal-400">{score.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600 overflow-hidden">
                    <div className="bg-teal-500 h-2.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${percentage}%` }}></div>
                </div>
            </div>
        </div>
    );
};


// Mock Data for Strategy 2026-2030
const STRATEGY_DATA = [
    { year: '2025', actual: 3.2, target: 3.2 },
    { year: '2026', actual: null, target: 3.5 },
    { year: '2027', actual: null, target: 3.8 },
    { year: '2028', actual: null, target: 4.2 },
    { year: '2029', actual: null, target: 4.5 },
    { year: '2030', actual: null, target: 4.8 },
];

const Dashboard: React.FC = () => {
  const { currentWaqfId, setWaqfContext } = useUi();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [compliance, setCompliance] = useState<any[]>([]);
  const [risks, setRisks] = useState<RiskRegisterItem[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  
  useEffect(() => {
    setInstitutions(getInstitutions());
    setEvaluations(getEvaluations());
    setCompliance(getComplianceRecords());
    setRisks(getRisks());
    setResponses(getAllResponses());
    setIndicators(getIndicators());
  }, []);

  // Filtered Datasets using Global Context
  const filteredInstitutions = useMemo(() => {
      return currentWaqfId ? institutions.filter(i => i.id === currentWaqfId) : institutions;
  }, [currentWaqfId, institutions]);

  const filteredEvaluations = useMemo(() => {
      return currentWaqfId ? evaluations.filter(e => e.institution_id === currentWaqfId) : evaluations;
  }, [currentWaqfId, evaluations]);

  const filteredRisks = useMemo(() => {
      return currentWaqfId ? risks.filter(r => r.institution_id === currentWaqfId) : risks;
  }, [currentWaqfId, risks]);

  const filteredResponses = useMemo(() => {
      if (!currentWaqfId) return responses;
      const evalIds = filteredEvaluations.map(e => e.id);
      return responses.filter(r => evalIds.includes(r.evaluation_id));
  }, [currentWaqfId, responses, filteredEvaluations]);
  
  // 1. Institution Types Breakdown
  const typeStats = useMemo(() => {
      const general = filteredInstitutions.filter(i => i.type === 'وقفية عامة').length;
      const special = filteredInstitutions.filter(i => i.type === 'وقفية خاصة').length;
      return [
          { name: 'عامة', value: general, fill: '#0d9488' }, // Teal 600
          { name: 'خاصة', value: special, fill: '#f59e0b' } // Amber 500
      ];
  }, [filteredInstitutions]);

  // 1.b Total Capital (Sum only, no scaling)
  const totalCapital = useMemo(() => {
      return filteredInstitutions.reduce((acc, i) => acc + (i.capital_omr || 0), 0);
  }, [filteredInstitutions]);

  // 1.c Top 5 Performing Institutions (If specific selected, just show that one)
  const topInstitutions = useMemo(() => {
      const scores: Record<string, { total: number, count: number, name: string }> = {};
      
      const instMap = new Map<string, string>(filteredInstitutions.map(i => [i.id, i.name] as [string, string]));

      filteredResponses.forEach(r => {
          const evalRec = filteredEvaluations.find(e => e.id === r.evaluation_id);
          if(evalRec) {
              const instId = evalRec.institution_id;
              // Ensure we only process institutions in our filtered list
              if (instMap.has(instId)) {
                if(!scores[instId]) scores[instId] = { total: 0, count: 0, name: instMap.get(instId) || 'Unknown' };
                scores[instId].total += r.score;
                scores[instId].count++;
              }
          }
      });

      const avgScores = Object.values(scores).map(s => ({
          name: s.name,
          score: Number((s.total / s.count).toFixed(2))
      }));

      return avgScores.sort((a, b) => b.score - a.score).slice(0, 5);
  }, [filteredResponses, filteredInstitutions, filteredEvaluations]);

  // 1.d Employee Stats
  const employeeStats = useMemo(() => {
      const omani = filteredInstitutions.reduce((acc, i) => acc + (i.employees_omani || 0), 0);
      const nonOmani = filteredInstitutions.reduce((acc, i) => acc + (i.employees_non_omani || 0), 0);
      return [
          { name: 'عماني', value: omani, fill: '#10b981' }, // Emerald
          { name: 'غير عماني', value: nonOmani, fill: '#6366f1' } // Indigo
      ];
  }, [filteredInstitutions]);

  // 1.e Capital Size Classification (Corrected Logic: Exclude 0, Force Categories)
  const capitalStats = useMemo(() => {
      let lessThan1M = 0;
      let between1Mand5M = 0;
      let moreThan5M = 0;

      filteredInstitutions.forEach(i => {
          const cap = i.capital_omr || 0;
          
          // SKIP records with 0 or negative capital (unpopulated data)
          if (cap <= 0) return;

          if (cap < 1000000) {
              lessThan1M++;
          } else if (cap >= 1000000 && cap <= 5000000) {
              between1Mand5M++;
          } else if (cap > 5000000) {
              moreThan5M++;
          }
      });

      // Always return these 3 categories, even if values are 0, to maintain chart structure
      return [
          { name: 'أقل من مليون', value: lessThan1M, fill: '#3b82f6' },         // Blue
          { name: 'من مليون إلى 5 ملايين', value: between1Mand5M, fill: '#f97316' }, // Orange
          { name: 'أكثر من 5 ملايين', value: moreThan5M, fill: '#10b981' },     // Green
      ];
  }, [filteredInstitutions]);


  // 2. Risk Matrix
  const riskMatrix = useMemo(() => {
      let high = 0, med = 0, low = 0;
      filteredRisks.forEach(r => {
          const score = r.probability * r.impact;
          if (score >= 15) high++;
          else if (score >= 8) med++;
          else low++;
      });
      return { high, med, low, total: filteredRisks.length };
  }, [filteredRisks]);

  // 3. Gov Stats (Refactored to show ALL Governorates)
  const govStats = useMemo(() => {
      // Initialize counts for all Governorates with 0 to ensure X-Axis is fully populated
      const counts: Record<string, number> = {};
      GOVERNORATES.forEach(g => counts[g] = 0);

      // Count actual institutions
      filteredInstitutions.forEach(i => {
          if (i.governorate && counts[i.governorate] !== undefined) {
              counts[i.governorate]++;
          }
      });

      // Return mapped data maintaining the standard order of Governorates
      return GOVERNORATES.map((g, idx) => ({ 
          name: g, 
          value: counts[g], 
          fill: GOV_COLORS[idx % GOV_COLORS.length] 
      }));
  }, [filteredInstitutions]);

  const averageScore = useMemo(() => {
      if (filteredResponses.length === 0) return 0;
      const total = filteredResponses.reduce((acc, r) => acc + r.score, 0);
      return (total / filteredResponses.length).toFixed(1);
  }, [filteredResponses]);

  // New: System Benchmark Data
  const benchmarkData = useMemo(() => {
      // 1. Calculate System Global Average
      const allScoreTotal = responses.reduce((acc, r) => acc + r.score, 0);
      const systemAverage = responses.length > 0 ? (allScoreTotal / responses.length) : 0;

      // 2. Current Institution Score
      const currentScore = Number(averageScore);

      return [
          { name: 'المتوسط العام', value: Number(systemAverage.toFixed(2)), fill: '#94a3b8' }, // Slate/Gray
          { name: 'المؤسسة الحالية', value: currentScore, fill: '#3b82f6' } // Blue
      ];
  }, [responses, averageScore]);


  // Dynamic Radar Data
  const radarData = useMemo(() => {
      if (filteredResponses.length === 0 || indicators.length === 0) {
           // Default Empty Data Structure
           return [
            { id: 1, subject: 'الشرعي', A: 0, fullMark: 5 },
            { id: 2, subject: 'الإداري', A: 0, fullMark: 5 },
            { id: 3, subject: 'المالي', A: 0, fullMark: 5 },
            { id: 4, subject: 'الحوكمة', A: 0, fullMark: 5 },
            { id: 5, subject: 'الابتكار', A: 0, fullMark: 5 },
            { id: 6, subject: 'الاستدامة', A: 0, fullMark: 5 },
          ];
      }

      const axisScores: Record<string, { total: number, count: number }> = {};
      
      filteredResponses.forEach(r => {
          const ind = indicators.find(i => i.id === r.indicator_id);
          if (ind) {
              if (!axisScores[ind.axis]) axisScores[ind.axis] = { total: 0, count: 0 };
              axisScores[ind.axis].total += r.score;
              axisScores[ind.axis].count += 1;
          }
      });

      return Object.keys(axisScores).map((axis, index) => {
          const data = axisScores[axis];
          return {
              id: index,
              subject: axis,
              A: Number((data.total / data.count).toFixed(1)),
              fullMark: 5
          };
      });
  }, [filteredResponses, indicators]);


  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
         <div>
            <h2 className="text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight">لوحة القيادة الاستراتيجية</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">نظرة شاملة على الأصول البشرية، المالية، ومستويات الأداء</p>
         </div>

         {/* Institution Filter Dropdown (Global Context Setter) */}
         <div className="w-full md:w-auto min-w-[300px]">
             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                 <Filter size={16} /> تصفية البيانات حسب المؤسسة
             </label>
             <div className="relative">
                 <select 
                    className="w-full p-3 pl-10 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-navy-800 outline-none appearance-none bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                    value={currentWaqfId || ''}
                    onChange={(e) => setWaqfContext(e.target.value)}
                 >
                     <option value="">جميع المؤسسات (نظرة عامة)</option>
                     {institutions.map(inst => (
                         <option key={inst.id} value={inst.id}>{inst.name}</option>
                     ))}
                 </select>
                 <div className="absolute left-3 top-3.5 pointer-events-none text-gray-500">
                     <Building size={18} />
                 </div>
             </div>
             {currentWaqfId && (
                 <p className="text-xs text-teal-600 mt-1">تم تثبيت العرض على المؤسسة المختارة لكافة الصفحات</p>
             )}
         </div>
      </div>

      {/* Hero Financial & HR KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Capital Size Card (FIXED: Raw calculation, basic toLocaleString) */}
        <InfographicCard 
          title="حجم رأس المال الوقفي" 
          value={`${totalCapital.toLocaleString()} ر.ع.`} 
          icon={Coins} 
          gradient="bg-gradient-to-br from-indigo-900 to-navy-900"
          subtext="القيمة السوقية التقديرية"
          footer={<span className="text-blue-200">النمو السنوي: +4.2%</span>}
        />
        
        {/* Public vs Private Visual Indicator - Colorized */}
        <div className="relative overflow-hidden rounded-2xl shadow-xl bg-white dark:bg-gray-800 p-6 border border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="w-1/2">
                <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">توزيع المؤسسات</p>
                <div className="space-y-4 mt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-teal-600"></div>
                        <span className="text-navy-900 dark:text-white font-bold text-xl">{typeStats[0].value}</span>
                        <span className="text-xs text-gray-500">عامة</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <span className="text-navy-900 dark:text-white font-bold text-xl">{typeStats[1].value}</span>
                        <span className="text-xs text-gray-500">خاصة</span>
                    </div>
                </div>
            </div>
            <div className="w-1/2 h-32">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={typeStats} innerRadius={25} outerRadius={40} dataKey="value" paddingAngle={5}>
                            {typeStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

        <InfographicCard 
          title="متوسط الأداء" 
          value={averageScore} 
          icon={Activity} 
          gradient="bg-gradient-to-br from-purple-700 to-purple-900"
          subtext="من 5.0"
        />
        
        {/* Critical Risks Card - Prominent Number */}
        <div className="relative overflow-hidden rounded-2xl shadow-xl bg-gradient-to-br from-red-600 to-red-800 text-white p-6">
            <div className="relative z-10">
                <div className="flex justify-between items-start">
                    <p className="text-red-100 font-medium text-lg">المخاطر الحرجة</p>
                    <div className="bg-white/20 p-2 rounded-lg"><AlertTriangle size={24} /></div>
                </div>
                <div className="flex items-baseline mt-4">
                    <h3 className="text-6xl font-extrabold tracking-tight">{riskMatrix.high}</h3>
                    <span className="mr-2 text-red-200 font-medium">حالة</span>
                </div>
                <p className="text-xs text-red-100 mt-2 opacity-80">تتطلب تدخلاً فورياً</p>
            </div>
             <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>
        </div>
      </div>
      
      {/* --- ROW 1: Geographic + Top 5 --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Geographic Distribution (FIXED: All Governorates & Y-Axis Scale) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
                    <MapPin className="text-teal-600" /> التوزيع الجغرافي (حسب المحافظة)
                </h3>
            </div>
            <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={govStats} margin={{ top: 20, right: 30, left: 20, bottom: 120 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            interval={0} 
                            tick={{fontSize: 12, fill: '#4b5563', dy: 10}}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            allowDecimals={false}
                            domain={[0, (dataMax: number) => Math.max(dataMax, 10)]}
                        />
                        <Tooltip cursor={{fill: '#f0f4f8'}} contentStyle={{borderRadius: '10px'}} />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                            {govStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                            <LabelList dataKey="value" position="top" fill="#374151" fontSize={14} fontWeight="bold" />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* REDESIGNED Top 5 Institutions (Leaderboard List) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold text-navy-900 dark:text-white mb-6 flex items-center gap-2">
             <Medal className="text-gold-500" /> الأعلى أداءً (التوب 5)
          </h3>
          <div className="h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
             {topInstitutions.length > 0 ? (
                 <div className="space-y-3">
                     {topInstitutions.map((inst, index) => (
                         <TopListItem 
                            key={inst.name} 
                            rank={index + 1} 
                            name={inst.name} 
                            score={inst.score} 
                         />
                     ))}
                 </div>
             ) : (
                 <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-full mb-4 border border-gray-100 dark:border-gray-600">
                        <Trophy size={48} className="text-gray-300 dark:text-gray-500" />
                    </div>
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400">لا توجد بيانات كافية للتصنيف حالياً</p>
                </div>
             )}
          </div>
        </div>
      </div>
      
      {/* --- ROW 2: Capital (Donut) & Radar (Resized) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Capital Size Distribution (UPDATED: Donut Chart, Taller) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
             <h3 className="text-xl font-bold text-navy-900 dark:text-white mb-6 flex items-center gap-2">
                <Briefcase className="text-blue-600" /> تصنيف المؤسسات حسب رأس المال
             </h3>
             <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={capitalStats}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={120}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {capitalStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{borderRadius: '10px'}} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
             </div>
        </div>

         {/* Radar Chart (UPDATED: Resized Container & Radius) */}
         <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold text-navy-900 dark:text-white mb-6 flex items-center gap-2">
                <Shield className="text-blue-600" /> توازن الأداء المؤسسي
            </h3>
            <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <defs>
                            <linearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                            </linearGradient>
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>
                        <PolarGrid gridType="polygon" stroke="#e5e7eb" />
                        <PolarAngleAxis 
                            dataKey="subject" 
                            tick={RadarCustomTick} 
                        />
                        <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                        <Radar 
                            name="الأداء الحالي" 
                            dataKey="A" 
                            stroke="#2563eb" 
                            strokeWidth={3}
                            fill="url(#radarFill)" 
                            fillOpacity={0.6} 
                            filter="url(#glow)"
                            activeDot={{ r: 6, fill: '#1d4ed8', stroke: '#fff', strokeWidth: 2 }}
                        />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                            itemStyle={{ color: '#1e40af', fontWeight: 'bold' }}
                            formatter={(value) => [value, 'النتيجة']}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
          </div>
      </div>

      {/* --- ROW 3: Employees & Benchmarking --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
        {/* Employee Stats Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold text-navy-900 dark:text-white mb-6 flex items-center gap-2">
                <Users className="text-teal-600" /> إحصائيات الموظفين (عماني / غير عماني)
            </h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={employeeStats} barSize={60}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{fontSize: 14, fontWeight: 'bold', fill: '#4b5563'}} axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f0f4f8'}} contentStyle={{borderRadius: '10px'}} />
                        <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                            {employeeStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                            <LabelList dataKey="value" position="top" fill="#374151" fontSize={16} fontWeight="bold" />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Comparative Benchmarking (New) - RIGHT SIDE in RTL */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
             <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
                     <BarChart2 className="text-teal-600" /> مقارنة الأداء المعياري
                 </h3>
             </div>
             <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={benchmarkData} barSize={60}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                         <XAxis dataKey="name" tick={{fontSize: 14, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                         <YAxis domain={[0, 5]} axisLine={false} tickLine={false} />
                         <Tooltip cursor={{fill: '#f0f4f8'}} contentStyle={{borderRadius: '10px'}} />
                         <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                            {benchmarkData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                            <LabelList dataKey="value" position="top" fill="#374151" fontSize={16} fontWeight="bold" />
                         </Bar>
                     </BarChart>
                 </ResponsiveContainer>
             </div>
        </div>

      </div>

      {/* --- ROW 4: Strategic Maturity (Full Width) --- */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-navy-900 dark:text-white flex items-center gap-2">
                <Target className="text-red-600" /> مسار النضج الاستراتيجي
            </h3>
        </div>
        <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={STRATEGY_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="year" axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 5]} axisLine={false} tickLine={false} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <Tooltip contentStyle={{borderRadius: '10px'}} />
                    <Area type="monotone" dataKey="target" stroke="#8884d8" strokeWidth={3} fillOpacity={1} fill="url(#colorTarget)" name="المستهدف" />
                    <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={3} dot={{r: 6}} name="الفعلي" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    </div>
    </div>
  );
};

export default Dashboard;