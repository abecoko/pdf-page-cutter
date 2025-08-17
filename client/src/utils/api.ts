import { PDFInfo, ProcessingOptions, ValidationResult } from '../types';

const API_BASE = '/api';

export class APIError extends Error {
  constructor(message: string, public status?: number, public type?: string) {
    super(message);
    this.name = 'APIError';
  }
}

// Convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data:application/pdf;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
};

export const api = {
  async uploadPDF(file: File): Promise<PDFInfo> {
    const pdfData = await fileToBase64(file);
    
    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfData,
        filename: file.name
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(error.error || 'Upload failed', response.status);
    }

    return response.json();
  },

  async processPDF(file: File, options: ProcessingOptions): Promise<Blob | { files: Blob[], zipFilename: string }> {
    const pdfData = await fileToBase64(file);
    
    const response = await fetch(`${API_BASE}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfData,
        filename: file.name,
        pageSpec: options.pageSpec,
        mode: options.mode,
        engine: options.engine
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(
        error.error || 'Processing failed', 
        response.status, 
        error.type
      );
    }

    const result = await response.json();
    
    if (result.multiple) {
      // Multiple files - return array of blobs
      const files = result.files.map((file: any) => {
        const binaryString = atob(file.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return new Blob([bytes], { type: 'application/pdf' });
      });
      
      return { files, zipFilename: result.zipFilename };
    } else {
      // Single file - convert base64 to blob
      const binaryString = atob(result.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new Blob([bytes], { type: 'application/pdf' });
    }
  },

  async validatePages(file: File, pageSpec: string): Promise<ValidationResult> {
    const pdfData = await fileToBase64(file);
    
    const response = await fetch(`${API_BASE}/validate-pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfData,
        pageSpec
      }),
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

// Create ZIP file from multiple blobs (client-side)
export const createZipFromBlobs = async (files: { blob: Blob, filename: string }[], zipFilename: string) => {
  // Simple ZIP creation - in a real app, you might want to use a library like JSZip
  // For now, we'll just download files individually
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  for (let i = 0; i < files.length; i++) {
    const { blob, filename } = files[i];
    downloadBlob(blob, filename);
    if (i < files.length - 1) {
      await delay(500); // Small delay between downloads
    }
  }
};