// Vercel Serverless Function for health check
// This is required to avoid "Function Runtimes must have a valid version" error

export default function handler(request, response) {
  response.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'fund-stock-show-static',
    message: 'This is a static site with no server-side functions',
    note: 'All API calls are handled client-side via CORS proxies'
  });
}