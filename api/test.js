// 简单的测试API端点
export default function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // 只处理GET请求
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  // 返回简单的JSON响应
  res.status(200).json({
    success: true,
    message: 'Vercel API is working!',
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method,
    note: 'This is a test endpoint to verify Vercel serverless functions'
  });
}