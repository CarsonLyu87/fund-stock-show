// Vercel Serverless Function for health check
// This is required to avoid "Function Runtimes must have a valid version" error

export default function handler(request, response) {
  // 设置CORS头
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理OPTIONS预检请求
  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }
  
  // 只处理GET请求
  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  response.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'fund-stock-show-static',
    message: 'This is a static site with no server-side functions',
    note: 'All API calls are handled client-side via CORS proxies',
    deployment: 'vercel',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      main: '/',
      github: 'https://github.com/CarsonLyu87/fund-stock-show'
    }
  });
}