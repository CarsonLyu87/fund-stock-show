import axios from 'axios'
import type { Fund, StockData } from '../types'
import { fetchRealFundData, fetchRealStockData, initDataService, getUpdateInfo, clearCache } from '../services/realDataService'

// 重新导出真实数据服务函数
export { initDataService, getUpdateInfo, clearCache }

// 获取市场状态
export const getMarketStatus = () => {
  const now = new Date()
  const hour = now.getHours()
  const isWeekend = now.getDay() === 0 || now.getDay() === 6
  
  // A股交易时间：周一至周五 9:30-11:30, 13:00-15:00
  const isTradingHours = !isWeekend && (
    (hour >= 9 && hour < 11) || 
    (hour === 11 && now.getMinutes() < 30) ||
    (hour >= 13 && hour < 15)
  )
  
  return {
    isOpen: isTradingHours,
    openTime: '09:30',
    closeTime: '15:00',
    nextOpenTime: isWeekend ? '下周一 09:30' : '明日 09:30'
  }
}



// 获取基金数据 - 使用真实数据服务
export const fetchFundData = async (): Promise<Fund[]> => {
  console.log('获取基金数据（每15分钟更新）...')
  try {
    const funds = await fetchRealFundData()
    console.log(`成功获取 ${funds.length} 只基金数据`)
    return funds
  } catch (error) {
    console.error('获取基金数据失败:', error)
    // 降级到模拟数据
    return generateMockFunds()
  }
}

// 获取股票数据 - 使用真实数据服务
export const fetchStockData = async (): Promise<StockData[]> => {
  console.log('获取股票数据（每15分钟更新）...')
  try {
    const stocks = await fetchRealStockData()
    console.log(`成功获取 ${stocks.length} 只股票数据`)
    return stocks
  } catch (error) {
    console.error('获取股票数据失败:', error)
    // 降级到模拟数据
    return generateMockStocks()
  }
}

// 模拟数据生成（降级使用）
function generateMockFunds(): Fund[] {
  console.log('使用模拟基金数据（降级模式）')
  const popularFunds = [
    { code: '005827', name: '易方达蓝筹精选混合' },
    { code: '161725', name: '招商中证白酒指数' },
    { code: '003095', name: '中欧医疗健康混合' },
    { code: '110011', name: '易方达中小盘混合' },
    { code: '519674', name: '银河创新成长混合' },
    { code: '260108', name: '景顺长城新兴成长混合' },
    { code: '000404', name: '易方达新兴成长混合' },
    { code: '001717', name: '工银瑞信前沿医疗股票' },
    { code: '006228', name: '中欧医疗创新股票A' },
    { code: '040046', name: '南方纳斯达克100指数' }
  ]
  
  return popularFunds.map((fund, index) => {
    const basePrice = 1 + Math.random() * 4
    const changePercent = (Math.random() - 0.5) * 3 // -1.5% 到 +1.5%
    const changeAmount = basePrice * changePercent / 100
    
    return {
      id: `mock_fund_${index}`,
      name: fund.name,
      code: fund.code,
      currentPrice: parseFloat(basePrice.toFixed(3)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      changeAmount: parseFloat(changeAmount.toFixed(3)),
      volume: Math.floor(Math.random() * 10000000) + 5000000,
      timestamp: new Date().toISOString()
    }
  })
}

function generateMockStocks(): StockData[] {
  console.log('使用模拟股票数据（降级模式）')
  const stocks = [
    { symbol: 'sh000001', name: '上证指数' },
    { symbol: 'sz399001', name: '深证成指' },
    { symbol: 'sz399006', name: '创业板指' },
    { symbol: 'sh000300', name: '沪深300' },
    { symbol: 'sh000016', name: '上证50' },
    { symbol: 'sz399005', name: '中小板指' }
  ]
  
  return stocks.map((stock, index) => {
    const basePrice = stock.symbol.includes('sh000001') ? 3000 + Math.random() * 200 :
                     stock.symbol.includes('sz399001') ? 9000 + Math.random() * 1000 :
                     stock.symbol.includes('sz399006') ? 1800 + Math.random() * 200 :
                     stock.symbol.includes('sh000300') ? 3500 + Math.random() * 200 :
                     stock.symbol.includes('sh000016') ? 2500 + Math.random() * 100 :
                     stock.symbol.includes('sz399005') ? 6000 + Math.random() * 500 : 100
    
    const changePercent = (Math.random() - 0.5) * 2 // -1% 到 +1%
    const changeAmount = basePrice * changePercent / 100
    
    return {
      id: `mock_stock_${index}`,
      symbol: stock.symbol,
      name: stock.name,
      price: parseFloat(basePrice.toFixed(2)),
      change: parseFloat(changeAmount.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: Math.floor(Math.random() * 1000000000) + 500000000,
      timestamp: new Date().toISOString(),
      history: generateHourlyHistory(basePrice)
    }
  })
}

function generateHourlyHistory(basePrice: number) {
  const history = []
  let currentPrice = basePrice
  
  for (let i = 0; i < 24; i++) {
    const hourFactor = i < 9 || i > 15 ? 0.1 : 0.3
    const change = (Math.random() - 0.5) * hourFactor
    currentPrice = currentPrice * (1 + change / 100)
    
    history.push({
      time: `${i.toString().padStart(2, '0')}:00`,
      price: parseFloat(currentPrice.toFixed(2))
    })
  }
  
  return history
}

// 获取最后一次更新时间（格式化字符串）
export const getFormattedLastUpdateTime = (): string => {
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