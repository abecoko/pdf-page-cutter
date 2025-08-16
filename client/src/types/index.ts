export interface PDFInfo {
  filename: string;
  size: number;
  pageCount: number;
  title?: string;
  author?: string;
  presets: Record<string, string>;
}

export interface ProcessingOptions {
  pageSpec: string;
  mode: 'extract' | 'split' | 'delete';
  engine?: 'auto' | 'pdf-lib' | 'qpdf';
}

export interface ValidationResult {
  valid: boolean;
  pages?: number[];
  count?: number;
  totalPages?: number;
  error?: string;
  suggestion?: string;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export type ProcessingMode = 'extract' | 'split' | 'delete';