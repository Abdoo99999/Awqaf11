export type InstitutionType = 'وقفية عامة' | 'وقفية خاصة';

export interface InstitutionDocument {
  id: string;
  name: string;
  type: string;
  size: string;
  upload_date: string;
}

export interface Institution {
  id: string;
  name: string;
  type: InstitutionType;
  capital_omr: number;
  employees_omani: number;
  employees_non_omani: number;
  contact_phone: string;
  email?: string;
  governorate?: string;
  wilayat?: string;
  
  // New Fields
  establishment_date?: string; // تاريخ التأسيس
  license_number?: string; // رقم السجل/الترخيص
  manager_name?: string; // مدير المؤسسة
  
  notes?: string;
  documents?: InstitutionDocument[];
  created_at: string;
}

export interface Indicator {
  id: string;
  axis: string; // المحور
  text: string; // وصف التقييم
  weight: number;
  active: boolean;
}

export interface Evaluation {
  id: string;
  institution_id: string;
  cycle_year: number;
  cycle_date: string;
  evaluator_name?: string;
  status: 'draft' | 'final';
  attachments?: InstitutionDocument[];
  created_at: string;
}

export interface Response {
  id: string;
  evaluation_id: string;
  indicator_id: string;
  score: number; // 1-5
  evidence_text?: string;
  updated_at: string;
}

export interface CustomRequirement {
    id: string;
    text: string;
    met: boolean;
}

export interface ComplianceRecord {
  id: string;
  institution_id: string;
  cycle_year: number;
  institution_status: 'فاعلة' | 'غير فاعلة' | 'قيد التصفية' | 'متوقفة' | 'أخرى';
  board_status: 'قائم' | 'منتهي' | 'غير موجود';
  board_end_date?: string;
  has_executive_management: boolean;
  has_auditor_company: boolean;
  has_minutes_prev_year: boolean; // e.g., 2023
  has_financial_report_prev_year: boolean; // e.g., 2023
  
  custom_requirements?: CustomRequirement[]; // Dynamic requirements

  followup_actions?: string;
  notes?: string;
  last_updated_at: string;
}

export interface RiskRegisterItem {
  id: string;
  institution_id: string;
  risk_title: string;
  category: 'Strategic' | 'Financial' | 'Operational' | 'Legal';
  probability: number; // 1-5
  impact: number; // 1-5
  mitigation_plan: string;
  status: 'Open' | 'Mitigated' | 'Closed';
}

export interface ImprovementItem {
  id: string;
  evaluation_id: string;
  indicator_id: string;
  priority: 'High' | 'Medium' | 'Low';
  issue_summary: string;
  recommended_action: string;
  owner: string;
  due_date: string;
  status: 'ToDo' | 'Doing' | 'Done';
  notes?: string;
}

// Helper types for charts
export interface ChartData {
  name: string;
  value: number;
  fill?: string;
}