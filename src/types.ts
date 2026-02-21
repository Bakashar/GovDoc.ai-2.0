export type Language = 'en' | 'ru' | 'kz';

export interface Risk {
  clause: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  violation: string;
  recommendation: string;
}

export interface AnalysisResult {
  summary: string;
  risks: Risk[];
  verdict: 'Safe' | 'Needs Review' | 'Dangerous';
}

export interface FileData {
  name: string;
  type: string;
  data: string | ArrayBuffer; // base64 string or ArrayBuffer for mammoth
}
