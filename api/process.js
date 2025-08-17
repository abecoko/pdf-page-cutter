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
    const { pdfData, filename, pageSpec, mode = 'extract' } = req.body;
    
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
    
    let pages;
    try {
      pages = parser.parse(pageSpec);
    } catch (parseError) {
      return res.status(400).json({ 
        error: `Invalid page specification: ${parseError.message}`,
        suggestion: 'Examples: "1,3,5", "1-10", "odd", "all,!1"'
      });
    }

    const baseFilename = (filename || 'document').replace(/\.pdf$/i, '');

    let result;
    
    switch (mode) {
      case 'extract':
        result = await pdfProcessor.extractPages(pdfBuffer, pages, {
          filename: `${baseFilename}_extracted.pdf`
        });
        
        res.setHeader('Content-Type', 'application/json');
        res.json({
          success: true,
          data: result.buffer.toString('base64'),
          filename: result.filename,
          engine: result.engine
        });
        break;

      case 'split':
        const segments = pages.map(page => [page]);
        const splitResults = await pdfProcessor.splitPages(pdfBuffer, segments, {
          baseFilename: `${baseFilename}_page`
        });
        
        if (splitResults.length === 1) {
          const singleResult = splitResults[0];
          res.json({
            success: true,
            data: singleResult.buffer.toString('base64'),
            filename: singleResult.filename,
            engine: singleResult.engine
          });
        } else {
          // Return multiple files for client-side ZIP creation
          const files = splitResults.map(item => ({
            data: item.buffer.toString('base64'),
            filename: item.filename
          }));
          
          res.json({
            success: true,
            multiple: true,
            files: files,
            zipFilename: `${baseFilename}_split.zip`
          });
        }
        break;

      case 'delete':
        result = await pdfProcessor.deletePages(pdfBuffer, pages, {
          filename: `${baseFilename}_deleted.pdf`
        });
        
        res.json({
          success: true,
          data: result.buffer.toString('base64'),
          filename: result.filename,
          engine: result.engine
        });
        break;

      default:
        return res.status(400).json({ 
          error: 'Invalid mode',
          validModes: ['extract', 'split', 'delete']
        });
    }

  } catch (error) {
    console.error('Process error:', error);
    
    if (error.message.includes('encrypted') || error.message.includes('password')) {
      return res.status(400).json({ 
        error: 'Password-protected PDF detected',
        type: 'password_required'
      });
    }
    
    res.status(500).json({ error: error.message });
  }
}