import { PDFInfo, ProcessingOptions, ValidationResult } from '../types';

const API_BASE = '/api';

export class APIError extends Error {
  constructor(message: string, public status?: number, public type?: string) {
    super(message);
    this.name = 'APIError';
  }
}

export const api = {
  async uploadPDF(file: File): Promise<PDFInfo> {
    const formData = new FormData();
    formData.append('pdf', file);

    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(error.error || 'Upload failed', response.status);
    }

    return response.json();
  },

  async processPDF(file: File, options: ProcessingOptions): Promise<Blob> {
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('pageSpec', options.pageSpec);
    formData.append('mode', options.mode);
    if (options.engine) {
      formData.append('engine', options.engine);
    }

    const response = await fetch(`${API_BASE}/process`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(
        error.error || 'Processing failed', 
        response.status, 
        error.type
      );
    }

    return response.blob();
  },

  async validatePages(file: File, pageSpec: string): Promise<ValidationResult> {
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('pageSpec', pageSpec);

    const response = await fetch(`${API_BASE}/validate-pages`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(error.error || 'Validation failed', response.status);
    }

    return response.json();
  },

  async getCapabilities() {
    const response = await fetch(`${API_BASE}/capabilities`);
    
    if (!response.ok) {
      throw new APIError('Failed to get capabilities', response.status);
    }

    return response.json();
  }
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};