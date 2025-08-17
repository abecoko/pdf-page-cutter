export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    res.json({
      engines: {
        'pdf-lib': true,
        qpdf: false // qpdf not available in serverless environment
      },
      maxFileSize: '50MB', // Vercel limit
      supportedFormats: ['pdf'],
      environment: 'serverless'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}