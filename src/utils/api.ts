import axios from 'axios'
import type { Fund, StockData } from '../types'

// 模拟数据 - 实际项目中应该连接真实API
const mockFunds: Fund[] = [
  { id: '1', name: '中欧医疗创新股票A', code: '006228', currentPrice: 2.45, changePercent: 2.16, changeAmount: 0.05, volume: 15000000, timestamp: new Date().toISOString() },
  { id: '2', name: '南方纳斯达克100指数', code: '040046', currentPrice: 3.82, changePercent: -1.43, changeAmount: -0.06, volume: 8000000, timestamp: new Date().toISOString() },
  { id: '3', name: '广发全球精选股票(QDII)', code: '270023', currentPrice: 1.68, changePercent: -0.58, changeAmount: -0.01, volume: 5000000, timestamp: new Date().toISOString() },
  { id: '4', name: '易方达消费行业股票', code: '110022', currentPrice: 3.25, changePercent: 1.25, changeAmount: 0.04, volume: 12000000, timestamp: new Date().toISOString() },
  { id: '5', name: '华夏上证50ETF', code: '510050', currentPrice: 2.58, changePercent: 0.78, changeAmount: 0.02, volume: 25000000, timestamp: new Date().toISOString() },
  { id: '6', name: '招商中证白酒指数', code: '161725', currentPrice: 0.85, changePercent: 1.89, changeAmount: 0.02, volume: 18000000, timestamp: new Date().toISOString() },
  { id: '7', name: '富国天惠成长混合', code: '161005', currentPrice: 3.12, changePercent: 0.96, changeAmount: 0.03, volume: 9000000, timestamp: new Date().toISOString() },
]

const mockStocks: StockData[] = [
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
  { 
    symbol: 'NVDA', 
    name: '英伟达', 
    price: 950.02, 
    change: 12.45, 
    changePercent: 1.33, 
    volume: 65000000,
    timestamp: new Date().toISOString(),
    history: Array.from({ length: 24 }, (_, i) => ({
      time: `${i.toString().padStart(2, '0')}:00`,
      price: 920 + Math.random() * 40
    }))
  },
]

export const fetchFundData = async (): Promise<Fund[]> => {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // 在实际项目中，这里应该调用真实API
  // const response = await axios.get('/api/funds')
  // return response.data
  
  // 返回模拟数据，并添加一些随机变化
  return mockFunds.map(fund => ({
    ...fund,
    currentPrice: fund.currentPrice + (Math.random() - 0.5) * 0.02,
    changePercent: fund.changePercent + (Math.random() - 0.5) * 0.1,
    timestamp: new Date().toISOString()
  }))
}

export const fetchStockData = async (): Promise<StockData[]> => {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // 在实际项目中，这里应该调用真实API
  // const response = await axios.get('/api/stocks')
  // return response.data
  
  // 返回模拟数据，并添加一些随机变化
  return mockStocks.map(stock => ({
    ...stock,
    price: stock.price + (Math.random() - 0.5) * 0.5,
    change: stock.change + (Math.random() - 0.5) * 0.1,
    timestamp: new Date().toISOString()
  }))
}

// 实际API配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})