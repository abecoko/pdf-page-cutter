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
    const { pdfData, pageSpec } = req.body;
    
    if (!pdfData) {
      return res.status(400).json({ error: 'No PDF data provided' });
    }
    
    if (!pageSpec) {
      return res.status(400).json({ error: 'Page specification required' });
    }

    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfData, 'base64');
    
    const pdfInfo = await pdfProcessor.getPdfInfo(pdfBuffer);
    const parser = new PageParser(pdfInfo.pageCount);
    
    try {
      const pages = parser.parse(pageSpec);
      res.json({
        valid: true,
        pages,
        count: pages.length,
        totalPages: pdfInfo.pageCount
      });
    } catch (parseError) {
      res.json({
        valid: false,
        error: parseError.message,
        suggestion: 'Examples: "1,3,5", "1-10", "odd", "all,!1"'
      });
    }
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ error: error.message });
  }
}