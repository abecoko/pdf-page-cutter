import { PDFProcessor } from './pdfProcessor.js';
import { PageParser } from './pageParser.js';

const pdfProcessor = new PDFProcessor();

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { pdfData, filename } = req.body;
    
    if (!pdfData) {
      return res.status(400).json({ error: 'No PDF data provided' });
    }

    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfData, 'base64');
    
    // Validate file size (50MB limit for Vercel)
    if (pdfBuffer.length > 50 * 1024 * 1024) {
      return res.status(400).json({ error: 'File too large (max 50MB)' });
    }

    const pdfInfo = await pdfProcessor.getPdfInfo(pdfBuffer);
    
    res.json({
      filename: filename || 'uploaded.pdf',
      size: pdfBuffer.length,
      pageCount: pdfInfo.pageCount,
      title: pdfInfo.title,
      author: pdfInfo.author,
      presets: PageParser.getPresets(pdfInfo.pageCount)
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(400).json({ error: error.message });
  }
}