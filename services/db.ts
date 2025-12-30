import { Institution, Indicator, Evaluation, Response, ComplianceRecord, ImprovementItem, RiskRegisterItem } from '../types';
import { DEFAULT_INDICATORS, SEEDED_INSTITUTIONS } from '../constants';

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const DB_KEYS = {
  INSTITUTIONS: 'waqf_institutions',
  INDICATORS: 'waqf_indicators',
  EVALUATIONS: 'waqf_evaluations',
  RESPONSES: 'waqf_responses',
  COMPLIANCE: 'waqf_compliance',
  IMPROVEMENTS: 'waqf_improvements',
  RISKS: 'waqf_risks',
  SETTINGS: 'waqf_settings'
};

// --- Generic Helper ---
const data = <T>(key: string): T[] => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
};

const save = <T>(key: string, items: T[]) => {
  localStorage.setItem(key, JSON.stringify(items));
};

// --- Settings ---
export const getSettings = () => {
    const stored = localStorage.getItem(DB_KEYS.SETTINGS);
    return stored ? JSON.parse(stored) : { 
        managerName: 'د. عبدالرحمن النوفلي', 
        darkMode: false,
        orgName: 'وزارة الأوقاف والشؤون الدينية'
    };
};

export const saveSettings = (settings: any) => {
    localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(settings));
    window.dispatchEvent(new Event('settingsChanged'));
};

// --- Institutions ---
export const getInstitutions = (): Institution[] => {
    let stored = data<Institution>(DB_KEYS.INSTITUTIONS);
    if (stored.length === 0) {
        // Seed default institutions
        stored = SEEDED_INSTITUTIONS.map((inst, idx) => ({
            id: `INST-SEED-${idx+1}`,
            name: inst.name!,
            type: inst.type as any,
            capital_omr: 0,
            employees_omani: 0,
            employees_non_omani: 0,
            contact_phone: '',
            created_at: new Date().toISOString()
        }));
        save(DB_KEYS.INSTITUTIONS, stored);
    }
    return stored;
};

export const saveInstitution = (inst: Institution) => {
  const list = getInstitutions();
  const index = list.findIndex(i => i.id === inst.id);
  if (index >= 0) list[index] = inst;
  else list.push(inst);
  save(DB_KEYS.INSTITUTIONS, list);
};
export const deleteInstitution = (id: string) => {
  const list = getInstitutions().filter(i => i.id !== id);
  save(DB_KEYS.INSTITUTIONS, list);
};

// --- Indicators (Imported from Excel or Defaults) ---
export const getIndicators = (): Indicator[] => {
  const stored = data<Indicator>(DB_KEYS.INDICATORS);
  if (stored.length === 0) {
    save(DB_KEYS.INDICATORS, DEFAULT_INDICATORS);
    return DEFAULT_INDICATORS;
  }
  return stored;
};

export const saveIndicators = (indicators: Indicator[]) => {
  save(DB_KEYS.INDICATORS, indicators);
};

// --- Evaluations ---
export const getEvaluations = (year?: number): Evaluation[] => {
  const evals = data<Evaluation>(DB_KEYS.EVALUATIONS);
  if (year) return evals.filter(e => e.cycle_year === year);
  return evals;
};
export const getEvaluationByInstAndYear = (instId: string, year: number) => {
  return getEvaluations().find(e => e.institution_id === instId && e.cycle_year === year);
};
export const saveEvaluation = (evalObj: Evaluation) => {
  const list = getEvaluations();
  const index = list.findIndex(e => e.id === evalObj.id);
  if (index >= 0) list[index] = evalObj;
  else list.push(evalObj);
  save(DB_KEYS.EVALUATIONS, list);
};

// --- Responses ---
export const getResponses = (evalId: string): Response[] => {
  return data<Response>(DB_KEYS.RESPONSES).filter(r => r.evaluation_id === evalId);
};
export const getAllResponses = (): Response[] => {
  return data<Response>(DB_KEYS.RESPONSES);
};
export const saveResponse = (response: Response) => {
  const list = data<Response>(DB_KEYS.RESPONSES);
  const index = list.findIndex(r => r.evaluation_id === response.evaluation_id && r.indicator_id === response.indicator_id);
  if (index >= 0) {
    list[index] = { ...list[index], ...response, updated_at: new Date().toISOString() };
  } else {
    list.push({ ...response, id: generateId(), updated_at: new Date().toISOString() });
  }
  save(DB_KEYS.RESPONSES, list);
};

// --- Compliance ---
export const getComplianceRecords = (year?: number): ComplianceRecord[] => {
  const recs = data<ComplianceRecord>(DB_KEYS.COMPLIANCE);
  if (year) return recs.filter(r => r.cycle_year === year);
  return recs;
};
export const getComplianceByInstAndYear = (instId: string, year: number): ComplianceRecord | undefined => {
    return getComplianceRecords(year).find(r => r.institution_id === instId);
}
export const saveComplianceRecord = (record: ComplianceRecord) => {
  const list = data<ComplianceRecord>(DB_KEYS.COMPLIANCE);
  const index = list.findIndex(r => r.id === record.id);
  if (index >= 0) list[index] = record;
  else list.push(record);
  save(DB_KEYS.COMPLIANCE, list);
};

// --- Risks ---
export const getRisks = (instId?: string): RiskRegisterItem[] => {
    const all = data<RiskRegisterItem>(DB_KEYS.RISKS);
    if (instId) return all.filter(r => r.institution_id === instId);
    return all;
};
export const saveRisk = (risk: RiskRegisterItem) => {
    const list = data<RiskRegisterItem>(DB_KEYS.RISKS);
    const index = list.findIndex(r => r.id === risk.id);
    if (index >= 0) list[index] = risk;
    else list.push(risk);
    save(DB_KEYS.RISKS, list);
};
export const deleteRisk = (id: string) => {
    const list = data<RiskRegisterItem>(DB_KEYS.RISKS).filter(r => r.id !== id);
    save(DB_KEYS.RISKS, list);
};


// --- Improvements ---
export const getImprovements = (evalId: string): ImprovementItem[] => {
    return data<ImprovementItem>(DB_KEYS.IMPROVEMENTS).filter(i => i.evaluation_id === evalId);
};
export const saveImprovement = (item: ImprovementItem) => {
    const list = data<ImprovementItem>(DB_KEYS.IMPROVEMENTS);
    const index = list.findIndex(i => i.id === item.id);
    if (index >= 0) list[index] = item;
    else list.push(item);
    save(DB_KEYS.IMPROVEMENTS, list);
};
export const deleteImprovement = (id: string) => {
    const list = data<ImprovementItem>(DB_KEYS.IMPROVEMENTS).filter(i => i.id !== id);
    save(DB_KEYS.IMPROVEMENTS, list);
};
export const generateImprovementPlan = (evalId: string, responses: Response[], indicators: Indicator[]) => {
    // Legacy support wrapper
    const weak = responses.filter(r => r.score < 3.5);
    const existing = getImprovements(evalId);
    const newItems: ImprovementItem[] = [];
    weak.forEach(resp => {
        if (!existing.find(ex => ex.indicator_id === resp.indicator_id)) {
            const ind = indicators.find(i => i.id === resp.indicator_id);
            if (ind) {
                newItems.push({
                    id: generateId(),
                    evaluation_id: evalId,
                    indicator_id: ind.id,
                    priority: resp.score < 2.5 ? 'High' : 'Medium',
                    issue_summary: `انخفاض في المؤشر: ${ind.text}`,
                    recommended_action: 'مراجعة السياسات والإجراءات وتحديد خطة تصحيحية.',
                    owner: 'الإدارة التنفيذية',
                    due_date: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
                    status: 'ToDo',
                    notes: ''
                });
            }
        }
    });

    if (newItems.length > 0) {
        const fullList = data<ImprovementItem>(DB_KEYS.IMPROVEMENTS);
        fullList.push(...newItems);
        save(DB_KEYS.IMPROVEMENTS, fullList);
    }
};

export { generateId };