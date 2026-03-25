import axios from 'axios'
import type { Fund, StockData } from '../types'

// 真实基金数据 - 基于天天基金等网站的真实基金
const realFunds: Fund[] = [
  { id: '1', name: '中欧医疗创新股票A', code: '006228', currentPrice: 2.45, changePercent: 2.16, changeAmount: 0.05, volume: 15000000, timestamp: new Date().toISOString() },
  { id: '2', name: '南方纳斯达克100指数', code: '040046', currentPrice: 3.82, changePercent: -1.43, changeAmount: -0.06, volume: 8000000, timestamp: new Date().toISOString() },
  { id: '3', name: '广发全球精选股票(QDII)', code: '270023', currentPrice: 1.68, changePercent: -0.58, changeAmount: -0.01, volume: 5000000, timestamp: new Date().toISOString() },
  { id: '4', name: '易方达消费行业股票', code: '110022', currentPrice: 3.25, changePercent: 1.25, changeAmount: 0.04, volume: 12000000, timestamp: new Date().toISOString() },
  { id: '5', name: '华夏上证50ETF', code: '510050', currentPrice: 2.58, changePercent: 0.78, changeAmount: 0.02, volume: 25000000, timestamp: new Date().toISOString() },
  { id: '6', name: '招商中证白酒指数', code: '161725', currentPrice: 0.85, changePercent: 1.89, changeAmount: 0.02, volume: 18000000, timestamp: new Date().toISOString() },
  { id: '7', name: '富国天惠成长混合', code: '161005', currentPrice: 3.12, changePercent: 0.96, changeAmount: 0.03, volume: 9000000, timestamp: new Date().toISOString() },
  { id: '8', name: '汇添富消费行业混合', code: '000083', currentPrice: 4.56, changePercent: 0.88, changeAmount: 0.04, volume: 7500000, timestamp: new Date().toISOString() },
  { id: '9', name: '嘉实沪深300ETF联接', code: '160706', currentPrice: 1.23, changePercent: 0.41, changeAmount: 0.01, volume: 35000000, timestamp: new Date().toISOString() },
  { id: '10', name: '工银瑞信前沿医疗股票', code: '001717', currentPrice: 2.89, changePercent: 1.75, changeAmount: 0.05, volume: 11000000, timestamp: new Date().toISOString() },
]

// 真实股票数据 - 基于A股和美股真实数据
const realStocks: StockData[] = [
  { 
    symbol: '000001.SS', 
    name: '上证指数', 
    price: 3068.46, 
    change: 12.35, 
    changePercent: 0.40, 
    volume: 280000000000,
    timestamp: new Date().toISOString(),
    history: Array.from({ length: 24 }, (_, i) => ({
      time: `${i.toString().padStart(2, '0')}:00`,
      price: 3050 + Math.random() * 40
    }))
  },
  { 
    symbol: '399001.SZ', 
    name: '深证成指', 
    price: 9625.28, 
    change: 45.62, 
    changePercent: 0.48, 
    volume: 320000000000,
    timestamp: new Date().toISOString(),
    history: Array.from({ length: 24 }, (_, i) => ({
      time: `${i.toString().padStart(2, '0')}:00`,
      price: 9580 + Math.random() * 100
    }))
  },
  { 
    symbol: '000300.SS', 
    name: '沪深300', 
    price: 3589.15, 
    change: 18.24, 
    changePercent: 0.51, 
    volume: 180000000000,
    timestamp: new Date().toISOString(),
    history: Array.from({ length: 24 }, (_, i) => ({
      time: `${i.toString().padStart(2, '0')}:00`,
      price: 3570 + Math.random() * 40
    }))
  },
  { 
    symbol: 'AAPL', 
    name: '苹果公司', 
    price: 182.63, 
    change: 1.25, 
    changePercent: 0.69, 
    volume: 45000000,
    timestamp: new Date().toISOString(),
    history: Array.from({ length: 24 }, (_, i) => ({
      time: `${i.toString().padStart(2, '0')}:00`,
      price: 180 + Math.random() * 5
    }))
  },
  { 
    symbol: 'MSFT', 
    name: '微软公司', 
    price: 415.86, 
    change: 3.42, 
    changePercent: 0.83, 
    volume: 28000000,
    timestamp: new Date().toISOString(),
    history: Array.from({ length: 24 }, (_, i) => ({
      time: `${i.toString().padStart(2, '0')}:00`,
      price: 410 + Math.random() * 10
    }))
  },
  { 
    symbol: 'TSLA', 
    name: '特斯拉', 
    price: 175.34, 
    change: -2.15, 
    changePercent: -1.21, 
    volume: 95000000,
    timestamp: new Date().toISOString(),
    history: Array.from({ length: 24 }, (_, i) => ({
      time: `${i.toString().padStart(2, '0')}:00`,
      price: 170 + Math.random() * 10
    }))
  },
]

// 生成更真实的波动数据（基于市场规律）
function generateRealisticChange(basePrice: number, baseChangePercent: number): { price: number, changePercent: number, changeAmount: number } {
  // 市场波动通常在-3%到+3%之间
  const marketVolatility = (Math.random() - 0.5) * 0.6 // ±0.3%
  const newChangePercent = baseChangePercent + marketVolatility
  
  // 确保涨跌幅在合理范围内
  const clampedChangePercent = Math.max(-3, Math.min(3, newChangePercent))
  const changeAmount = basePrice * clampedChangePercent / 100
  const price = basePrice + changeAmount
  
  return {
    price: parseFloat(price.toFixed(2)),
    changePercent: parseFloat(clampedChangePercent.toFixed(2)),
    changeAmount: parseFloat(changeAmount.toFixed(2))
  }
}

// 生成真实的历史数据（基于时间序列）
function generateRealisticHistory(basePrice: number, volatility: number = 0.5) {
  const history = []
  let currentPrice = basePrice
  
  for (let i = 0; i < 24; i++) {
    // 模拟市场开盘和收盘的波动
    const hourFactor = i < 9 || i > 15 ? 0.3 : 1.0 // 非交易时间波动较小
    const change = (Math.random() - 0.5) * volatility * hourFactor
    currentPrice = currentPrice * (1 + change / 100)
    
    history.push({
      time: `${i.toString().padStart(2, '0')}:00`,
      price: parseFloat(currentPrice.toFixed(2))
    })
  }
  
  return history
}

// 获取基金数据 - 模拟真实API调用
export const fetchFundData = async (): Promise<Fund[]> => {
  // 模拟API延迟（真实网站通常有1-2秒延迟）
  await new Promise(resolve => setTimeout(resolve, 800))
  
  const now = new Date()
  const timestamp = now.toISOString()
  
  // 生成更真实的基金数据
  return realFunds.map(fund => {
    const { price, changePercent, changeAmount } = generateRealisticChange(
      fund.currentPrice,
      fund.changePercent
    )
    
    return {
      ...fund,
      currentPrice: price,
      changePercent,
      changeAmount,
      volume: Math.floor(fund.volume * (0.8 + Math.random() * 0.4)), // 成交量波动
      timestamp
    }
  })
}

// 获取股票数据 - 模拟真实API调用
export const fetchStockData = async (): Promise<StockData[]> => {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 800))
  
  const now = new Date()
  const timestamp = now.toISOString()
  
  // 生成更真实的股票数据
  return realStocks.map(stock => {
    const { price, changePercent, changeAmount } = generateRealisticChange(
      stock.price,
      stock.changePercent
    )
    
    return {
      ...stock,
      price,
      change: changeAmount,
      changePercent,
      volume: Math.floor(stock.volume * (0.7 + Math.random() * 0.6)),
      timestamp,
      history: generateRealisticHistory(price, stock.symbol.includes('.SS') || stock.symbol.includes('.SZ') ? 0.8 : 1.2)
    }
  })
}

// 获取最后一次更新时间
export const getLastUpdateTime = (): string => {
  const now = new Date()
  return now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

// 获取下一次更新时间（30分钟后）
export const getNextUpdateTime = (): string => {
  const next = new Date(Date.now() + 30 * 60 * 1000) // 30分钟后
  return next.toLocaleString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

// 实际API配置（用于连接真实数据源）
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 真实数据源API（示例）
export const realDataApis = {
  // 天天基金API（示例）
  tiantian: 'https://fundgz.1234567.com.cn/js/',
  
  // 东方财富API（示例）
  eastmoney: 'https://push2.eastmoney.com/api/',
  
  // 雪球API（示例）
  xueqiu: 'https://stock.xueqiu.com/v5/',
  
  // 雅虎财经API（示例）
  yahoo: 'https://query1.finance.yahoo.com/v8/finance/'
}

// 获取真实基金数据（示例函数）
export const fetchRealFundData = async (fundCodes: string[]): Promise<Fund[]> => {
  try {
    // 这里可以调用真实API，例如天天基金
    // const responses = await Promise.all(
    //   fundCodes.map(code => 
    //     axios.get(`${realDataApis.tiantian}${code}.js`)
    //   )
    // )
    
    // 暂时返回模拟数据
    return fetchFundData()
  } catch (error) {
    console.error('获取真实基金数据失败:', error)
    return fetchFundData() // 降级到模拟数据
  }
}

// 获取真实股票数据（示例函数）
export const fetchRealStockData = async (symbols: string[]): Promise<StockData[]> => {
  try {
    // 这里可以调用真实API，例如雅虎财经
    // const responses = await Promise.all(
    //   symbols.map(symbol => 
    //     axios.get(`${realDataApis.yahoo}chart/${symbol}?interval=1d&range=1d`)
    //   )
    // )
    
    // 暂时返回模拟数据
    return fetchStockData()
  } catch (error) {
    console.error('获取真实股票数据失败:', error)
    return fetchStockData() // 降级到模拟数据
  }
}