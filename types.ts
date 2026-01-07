export interface StudyItem {
  topic: string;
  action: string;
  priority: 'Yüksek' | 'Orta' | 'Düşük';
}

export interface AnalysisResult {
  summary: string;
  topics: string[];
  studyPlan: StudyItem[];
}

export interface AnalyzedFile {
  id: string;
  // Metadata for persistence and display
  fileName: string;
  fileSize: number;
  fileType: string;
  // The actual file object (only available in current session, not persisted)
  file?: File; 
  status: 'idle' | 'uploading' | 'analyzing' | 'completed' | 'error';
  result?: AnalysisResult;
  errorMessage?: string;
  timestamp: number;
}

export enum Priority {
  HIGH = 'Yüksek',
  MEDIUM = 'Orta',
  LOW = 'Düşük'
}