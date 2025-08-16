import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { PDFProcessor } from './pdfProcessor.js';
import { PageParser } from './pageParser.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

const pdfProcessor = new PDFProcessor();

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/capabilities', async (req, res) => {
  try {
    const qpdfAvailable = await pdfProcessor.checkQpdfAvailability();
    res.json({
      engines: {
        'pdf-lib': true,
        qpdf: qpdfAvailable
      },
      maxFileSize: '200MB',
      supportedFormats: ['pdf']
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file provided' });
    }

    const pdfInfo = await pdfProcessor.getPdfInfo(req.file.buffer);
    
    res.json({
      filename: req.file.originalname,
      size: req.file.size,
      pageCount: pdfInfo.pageCount,
      title: pdfInfo.title,
      author: pdfInfo.author,
      presets: PageParser.getPresets(pdfInfo.pageCount)
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/process', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file provided' });
    }

    const { pageSpec, mode = 'extract', engine = 'auto' } = req.body;
    
    if (!pageSpec) {
      return res.status(400).json({ error: 'Page specification required' });
    }

    const pdfInfo = await pdfProcessor.getPdfInfo(req.file.buffer);
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

    const baseFilename = req.file.originalname.replace(/\.pdf$/i, '');

    let result;
    
    switch (mode) {
      case 'extract':
        result = await pdfProcessor.extractPages(req.file.buffer, pages, {
          engine,
          filename: `${baseFilename}_extracted.pdf`
        });
        
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${result.filename}"`,
          'X-Engine-Used': result.engine
        });
        res.send(result.buffer);
        break;

      case 'split':
        const segments = pages.map(page => [page]);
        const splitResults = await pdfProcessor.splitPages(req.file.buffer, segments, {
          engine,
          baseFilename: `${baseFilename}_page`
        });
        
        if (splitResults.length === 1) {
          const singleResult = splitResults[0];
          res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${singleResult.filename}"`,
            'X-Engine-Used': singleResult.engine
          });
          res.send(singleResult.buffer);
        } else {
          const zipBuffer = await pdfProcessor.createZip(splitResults);
          res.set({
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${baseFilename}_split.zip"`
          });
          res.send(zipBuffer);
        }
        break;

      case 'delete':
        result = await pdfProcessor.deletePages(req.file.buffer, pages, {
          engine,
          filename: `${baseFilename}_deleted.pdf`
        });
        
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${result.filename}"`,
          'X-Engine-Used': result.engine
        });
        res.send(result.buffer);
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
});

app.post('/validate-pages', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file provided' });
    }

    const { pageSpec } = req.body;
    
    if (!pageSpec) {
      return res.status(400).json({ error: 'Page specification required' });
    }

    const pdfInfo = await pdfProcessor.getPdfInfo(req.file.buffer);
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
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large (max 200MB)' });
    }
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`PDF Cutter Server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
});