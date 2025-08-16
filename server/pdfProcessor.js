import { PDFDocument } from 'pdf-lib';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';
import archiver from 'archiver';

export class PDFProcessor {
  constructor() {
    this.qpdfAvailable = null;
  }

  async checkQpdfAvailability() {
    if (this.qpdfAvailable !== null) {
      return this.qpdfAvailable;
    }

    try {
      await new Promise((resolve, reject) => {
        const process = spawn('qpdf', ['--version']);
        process.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error('qpdf not available'));
          }
        });
        process.on('error', reject);
      });
      this.qpdfAvailable = true;
    } catch {
      this.qpdfAvailable = false;
    }

    return this.qpdfAvailable;
  }

  async extractPages(pdfBuffer, pageNumbers, options = {}) {
    const { engine = 'auto', filename = 'extracted.pdf' } = options;
    
    const useQpdf = engine === 'qpdf' || (engine === 'auto' && await this.checkQpdfAvailability());
    
    if (useQpdf) {
      try {
        return await this.extractWithQpdf(pdfBuffer, pageNumbers, filename);
      } catch (error) {
        console.warn('qpdf extraction failed, falling back to pdf-lib:', error.message);
      }
    }

    return await this.extractWithPdfLib(pdfBuffer, pageNumbers, filename);
  }

  async extractWithPdfLib(pdfBuffer, pageNumbers, filename) {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const newPdfDoc = await PDFDocument.create();

    for (const pageNum of pageNumbers) {
      if (pageNum >= 1 && pageNum <= pdfDoc.getPageCount()) {
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageNum - 1]);
        newPdfDoc.addPage(copiedPage);
      }
    }

    const pdfBytes = await newPdfDoc.save();
    return {
      buffer: Buffer.from(pdfBytes),
      filename,
      engine: 'pdf-lib'
    };
  }

  async extractWithQpdf(pdfBuffer, pageNumbers, filename) {
    const tempDir = await fs.mkdtemp(path.join(process.cwd(), 'temp-'));
    const inputPath = path.join(tempDir, 'input.pdf');
    const outputPath = path.join(tempDir, 'output.pdf');

    try {
      await fs.writeFile(inputPath, pdfBuffer);

      const pageRange = pageNumbers.join(',');
      
      await new Promise((resolve, reject) => {
        const process = spawn('qpdf', [
          inputPath,
          '--pages',
          inputPath,
          pageRange,
          '--',
          outputPath
        ]);

        let stderr = '';
        process.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        process.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`qpdf failed: ${stderr}`));
          }
        });

        process.on('error', reject);
      });

      const outputBuffer = await fs.readFile(outputPath);
      
      return {
        buffer: outputBuffer,
        filename,
        engine: 'qpdf'
      };
    } finally {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (e) {
        console.warn('Failed to cleanup temp directory:', e.message);
      }
    }
  }

  async splitPages(pdfBuffer, segments, options = {}) {
    const { engine = 'auto', baseFilename = 'page' } = options;
    
    const results = [];
    let segmentIndex = 1;

    for (const segment of segments) {
      const filename = `${baseFilename}_${segmentIndex}.pdf`;
      const result = await this.extractPages(pdfBuffer, segment, { engine, filename });
      results.push({
        ...result,
        segment: segmentIndex,
        pages: segment
      });
      segmentIndex++;
    }

    return results;
  }

  async createZip(files) {
    return new Promise((resolve, reject) => {
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });

      const chunks = [];
      
      archive.on('data', (chunk) => {
        chunks.push(chunk);
      });

      archive.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      archive.on('error', reject);

      files.forEach(file => {
        archive.append(file.buffer, { name: file.filename });
      });

      archive.finalize();
    });
  }

  async deletePages(pdfBuffer, pageNumbers, options = {}) {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const totalPages = pdfDoc.getPageCount();
    
    const allPages = Array.from({ length: totalPages }, (_, i) => i + 1);
    const remainingPages = allPages.filter(page => !pageNumbers.includes(page));
    
    if (remainingPages.length === 0) {
      throw new Error('Cannot delete all pages');
    }

    return await this.extractPages(pdfBuffer, remainingPages, {
      ...options,
      filename: options.filename || 'deleted_pages.pdf'
    });
  }

  async getPdfInfo(pdfBuffer) {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      return {
        pageCount: pdfDoc.getPageCount(),
        title: pdfDoc.getTitle() || '',
        author: pdfDoc.getAuthor() || '',
        creator: pdfDoc.getCreator() || '',
        producer: pdfDoc.getProducer() || '',
        creationDate: pdfDoc.getCreationDate(),
        modificationDate: pdfDoc.getModificationDate()
      };
    } catch (error) {
      throw new Error(`Failed to read PDF: ${error.message}`);
    }
  }
}