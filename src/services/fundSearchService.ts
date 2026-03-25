/**
 * 基金搜索服务
 * 提供基金搜索、添加、管理功能
 */

import axios from 'axios'

// 代理服务器配置
const PROXY_BASE_URL = import.meta.env.VITE_PROXY_URL || 'http://localhost:3001'

// 基金搜索结果接口
export interface FundSearchResult {
  code: string
  name: string
  type: string
  company: string
  netValue?: number
  changePercent?: number
  isAdded: boolean
}

// 用户基金配置接口
export interface UserFundConfig {
  code: string
  name: string
  addedAt: number
  weight?: number // 用户自定义权重
  notes?: string // 用户备注
}

// 基金搜索API配置
const FUND_SEARCH_APIS = {
  /**
   * 东方财富基金搜索
   * 格式: https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?m=1&key=易方达
   */
  eastmoneySearch: (keyword: string) => {
    return `https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?m=1&key=${encodeURIComponent(keyword)}`
  },
  
  /**
   * 天天基金搜索
   * 格式: https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?m=0&key=易方达
   */
  tiantianSearch: (keyword: string) => {
    return `https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?m=0&key=${encodeURIComponent(keyword)}`
  },
  
  /**
   * 基金详情信息
   * 格式: https://fundgz.1234567.com.cn/js/005827.js?rt=timestamp
   */
  fundDetail: (code: string) => {
    return `https://fundgz.1234567.com.cn/js/${code}.js?rt=${Date.now()}`
  }
}

// 请求头配置
const REQUEST_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://fund.eastmoney.com/',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  'Connection': 'keep-alive'
}

// 本地存储键名
const STORAGE_KEYS = {
  USER_FUNDS: 'fund_stock_show_user_funds',
  FUND_SEARCH_HISTORY: 'fund_stock_show_search_history'
}

/**
 * 按基金代码搜索基金
 */
export async function searchFunds(keyword: string): Promise<FundSearchResult[]> {
  if (!keyword.trim()) {
    return []
  }
  
  console.log(`🔍 按代码搜索基金: ${keyword}`)
  
  try {
    // 获取用户已添加的基金列表
    const userFunds = getUserFunds()
    const userFundCodes = new Set(userFunds.map(fund => fund.code))
    
    // 清理输入：移除空格，只保留数字
    const cleanCode = keyword.trim().replace(/\s+/g, '')
    
    // 如果是6位数字代码，直接获取基金详情
    if (/^\d{6}$/.test(cleanCode)) {
      console.log(`📊 按基金代码 ${cleanCode} 获取详情`)
      const fundDetail = await getFundDetail(cleanCode)
      
      if (fundDetail) {
        // 保存搜索历史
        saveSearchHistory(cleanCode)
        
        return [{
          ...fundDetail,
          isAdded: userFundCodes.has(cleanCode)
        }]
      }
    }
    
    // 如果直接获取详情失败，尝试搜索API
    console.log(`🔍 尝试搜索基金: ${cleanCode}`)
    const url = FUND_SEARCH_APIS.eastmoneySearch(cleanCode)
    
    const response = await axios.get(url, {
      timeout: 8000,
      headers: REQUEST_HEADERS
    })
    
    const results = parseSearchResults(response.data, userFundCodes)
    
    // 保存搜索历史
    saveSearchHistory(cleanCode)
    
    return results
    
  } catch (error) {
    console.error('基金搜索失败:', error)
    // 返回模拟数据作为降级
    return generateMockSearchResults(keyword)
  }
}

/**
 * 解析搜索结果
 */
function parseSearchResults(data: any, userFundCodes: Set<string>): FundSearchResult[] {
  const results: FundSearchResult[] = []
  
  try {
    if (data && data.Datas && Array.isArray(data.Datas)) {
      data.Datas.forEach((item: any) => {
        if (item.CODE && item.NAME) {
          results.push({
            code: item.CODE,
            name: item.NAME,
            type: item.FUNDTYPE || '混合型',
            company: item.JJGS || '未知基金公司',
            netValue: item.DWJZ ? parseFloat(item.DWJZ) : undefined,
            changePercent: item.RZDF ? parseFloat(item.RZDF) : undefined,
            isAdded: userFundCodes.has(item.CODE)
          })
        }
      })
    }
  } catch (error) {
    console.error('解析搜索结果失败:', error)
  }
  
  // 限制返回数量
  return results.slice(0, 20)
}

/**
 * 获取基金详情（多源API）
 */
export async function getFundDetail(code: string): Promise<FundSearchResult | null> {
  if (!/^\d{6}$/.test(code)) {
    console.error(`无效的基金代码: ${code}`)
    return null
  }
  
  console.log(`📊 获取基金 ${code} 详情...`)
  
  // 尝试的API顺序
  const apiAttempts = [
    { name: '代理服务器API', fetch: fetchFundDetailFromProxy },
    { name: '天天基金API', fetch: fetchFundDetailFromTiantian },
    { name: '东方财富API', fetch: fetchFundDetailFromEastmoney }
  ]
  
  for (const attempt of apiAttempts) {
    try {
      console.log(`🔍 尝试 ${attempt.name}...`)
      const fundDetail = await attempt.fetch(code)
      
      if (fundDetail) {
        console.log(`✅ ${attempt.name} 成功获取基金 ${code} 详情`)
        return fundDetail
      }
    } catch (error) {
      console.warn(`⚠️ ${attempt.name} 失败:`, error.message)
    }
    
    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 300))
  }
  
  console.error(`❌ 所有API都无法获取基金 ${code} 详情`)
  return null
}

/**
 * 通过代理服务器获取基金详情
 */
async function fetchFundDetailFromProxy(code: string): Promise<FundSearchResult | null> {
  try {
    const proxyUrl = `${PROXY_BASE_URL}/api/fund/estimate/${code}`
    
    const response = await axios.get(proxyUrl, {
      timeout: 5000
    })
    
    if (response.data && response.data.fundcode) {
      const userFunds = getUserFunds()
      const isAdded = userFunds.some(fund => fund.code === code)
      
      return {
        code: response.data.fundcode,
        name: response.data.name,
        type: '基金',
        company: '基金公司',
        netValue: response.data.dwjz ? parseFloat(response.data.dwjz) : undefined,
        changePercent: response.data.gszzl ? parseFloat(response.data.gszzl) : undefined,
        isAdded
      }
    }
    
  } catch (error) {
    throw new Error(`代理服务器API失败: ${error.message}`)
  }
  
  return null
}

/**
 * 通过天天基金API获取基金详情
 */
async function fetchFundDetailFromTiantian(code: string): Promise<FundSearchResult | null> {
  try {
    const url = `https://fundgz.1234567.com.cn/js/${code}.js?rt=${Date.now()}`
    
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'Referer': 'https://fund.eastmoney.com/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      responseType: 'text'
    })
    
    // 解析JSONP格式
    const jsonStr = response.data.replace(/^jsonpgz\(/, '').replace(/\);$/, '')
    const data = JSON.parse(jsonStr)
    
    if (data && data.fundcode) {
      const userFunds = getUserFunds()
      const isAdded = userFunds.some(fund => fund.code === code)
      
      return {
        code: data.fundcode,
        name: data.name,
        type: '基金',
        company: '基金公司',
        netValue: data.dwjz ? parseFloat(data.dwjz) : undefined,
        changePercent: data.gszzl ? parseFloat(data.gszzl) : undefined,
        isAdded
      }
    }
    
  } catch (error) {
    throw new Error(`天天基金API失败: ${error.message}`)
  }
  
  return null
}

/**
 * 通过东方财富API获取基金详情
 */
async function fetchFundDetailFromEastmoney(code: string): Promise<FundSearchResult | null> {
  try {
    // 东方财富基金详情API
    const url = `https://api.fund.eastmoney.com/f10/lsjz?fundCode=${code}&pageIndex=1&pageSize=1`
    
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'Referer': 'https://fund.eastmoney.com/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    })
    
    if (response.data && response.data.ErrCode === 0 && response.data.Data) {
      const userFunds = getUserFunds()
      const isAdded = userFunds.some(fund => fund.code === code)
      
      // 获取基金名称（需要另一个API）
      let fundName = `基金${code}`
      try {
        const infoUrl = `https://fund.eastmoney.com/pingzhongdata/${code}.js?v=${Date.now()}`
        const infoResponse = await axios.get(infoUrl, {
          timeout: 3000,
          headers: {
            'Referer': 'https://fund.eastmoney.com/',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          },
          responseType: 'text'
        })
        
        // 从JS文件中提取基金名称
        const nameMatch = infoResponse.data.match(/fS_name\s*=\s*"([^"]+)"/)
        if (nameMatch) {
          fundName = nameMatch[1]
        }
      } catch (nameError) {
        console.warn('获取基金名称失败:', nameError.message)
      }
      
      const lsjzList = response.data.Data.LSJZList
      const latestData = lsjzList && lsjzList[0]
      
      return {
        code,
        name: fundName,
        type: '基金',
        company: '基金公司',
        netValue: latestData ? parseFloat(latestData.DWJZ) : undefined,
        changePercent: latestData && latestData.JZZZL ? parseFloat(latestData.JZZZL) : undefined,
        isAdded
      }
    }
    
  } catch (error) {
    throw new Error(`东方财富API失败: ${error.message}`)
  }
  
  return null
}

/**
 * 添加基金到用户列表
 */
export function addFundToUserList(fund: FundSearchResult): boolean {
  try {
    const userFunds = getUserFunds()
    
    // 检查是否已添加
    if (userFunds.some(f => f.code === fund.code)) {
      console.log(`基金 ${fund.code} 已添加`)
      return false
    }
    
    // 添加新基金
    const newFund: UserFundConfig = {
      code: fund.code,
      name: fund.name,
      addedAt: Date.now()
    }
    
    userFunds.push(newFund)
    localStorage.setItem(STORAGE_KEYS.USER_FUNDS, JSON.stringify(userFunds))
    
    console.log(`✅ 添加基金: ${fund.name} (${fund.code})`)
    return true
    
  } catch (error) {
    console.error('添加基金失败:', error)
    return false
  }
}

/**
 * 从用户列表移除基金
 */
export function removeFundFromUserList(code: string): boolean {
  try {
    const userFunds = getUserFunds()
    const initialLength = userFunds.length
    
    const filteredFunds = userFunds.filter(fund => fund.code !== code)
    
    if (filteredFunds.length < initialLength) {
      localStorage.setItem(STORAGE_KEYS.USER_FUNDS, JSON.stringify(filteredFunds))
      console.log(`🗑️ 移除基金: ${code}`)
      return true
    }
    
    return false
    
  } catch (error) {
    console.error('移除基金失败:', error)
    return false
  }
}

/**
 * 获取用户基金列表
 */
export function getUserFunds(): UserFundConfig[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_FUNDS)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('获取用户基金列表失败:', error)
  }
  
  // 返回默认基金列表
  return getDefaultFunds()
}

/**
 * 获取默认基金列表
 */
function getDefaultFunds(): UserFundConfig[] {
  const defaultFunds = [
    { code: '005827', name: '易方达蓝筹精选混合', addedAt: Date.now() },
    { code: '161725', name: '招商中证白酒指数(LOF)A', addedAt: Date.now() },
    { code: '003095', name: '中欧医疗健康混合A', addedAt: Date.now() },
    { code: '110022', name: '易方达消费行业股票', addedAt: Date.now() },
    { code: '519674', name: '银河创新成长混合', addedAt: Date.now() },
    { code: '260108', name: '景顺长城新兴成长混合', addedAt: Date.now() },
    { code: '000404', name: '易方达新兴成长灵活配置', addedAt: Date.now() }
  ]
  
  // 保存默认列表
  localStorage.setItem(STORAGE_KEYS.USER_FUNDS, JSON.stringify(defaultFunds))
  
  return defaultFunds
}

/**
 * 保存搜索历史
 */
function saveSearchHistory(keyword: string): void {
  try {
    const history = getSearchHistory()
    
    // 移除重复项
    const filteredHistory = history.filter(item => item !== keyword)
    
    // 添加到开头
    filteredHistory.unshift(keyword)
    
    // 限制历史记录数量
    const limitedHistory = filteredHistory.slice(0, 10)
    
    localStorage.setItem(STORAGE_KEYS.FUND_SEARCH_HISTORY, JSON.stringify(limitedHistory))
    
  } catch (error) {
    console.error('保存搜索历史失败:', error)
  }
}

/**
 * 获取搜索历史
 */
export function getSearchHistory(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.FUND_SEARCH_HISTORY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('获取搜索历史失败:', error)
  }
  
  return []
}

/**
 * 清空搜索历史
 */
export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.FUND_SEARCH_HISTORY)
  } catch (error) {
    console.error('清空搜索历史失败:', error)
  }
}

/**
 * 生成模拟搜索结果（降级方案）
 */
function generateMockSearchResults(keyword: string): FundSearchResult[] {
  console.log('🔄 生成模拟搜索结果...')
  
  const mockFunds = [
    { code: '005827', name: '易方达蓝筹精选混合', type: '混合型', company: '易方达基金' },
    { code: '161725', name: '招商中证白酒指数(LOF)A', type: '指数型', company: '招商基金' },
    { code: '003095', name: '中欧医疗健康混合A', type: '混合型', company: '中欧基金' },
    { code: '110022', name: '易方达消费行业股票', type: '股票型', company: '易方达基金' },
    { code: '519674', name: '银河创新成长混合', type: '混合型', company: '银河基金' },
    { code: '260108', name: '景顺长城新兴成长混合', type: '混合型', company: '景顺长城基金' },
    { code: '000404', name: '易方达新兴成长灵活配置', type: '混合型', company: '易方达基金' },
    { code: '001714', name: '工银瑞信文体产业股票A', type: '股票型', company: '工银瑞信基金' },
    { code: '002190', name: '农银汇理新能源主题', type: '混合型', company: '农银汇理基金' },
    { code: '519066', name: '汇添富蓝筹稳健混合', type: '混合型', company: '汇添富基金' }
  ]
  
  const userFunds = getUserFunds()
  const userFundCodes = new Set(userFunds.map(fund => fund.code))
  
  // 过滤和匹配关键词
  const filteredResults = mockFunds.filter(fund => {
    const searchLower = keyword.toLowerCase()
    return (
      fund.code.toLowerCase().includes(searchLower) ||
      fund.name.toLowerCase().includes(searchLower) ||
      fund.company.toLowerCase().includes(searchLower)
    )
  })
  
  return filteredResults.map(fund => ({
    ...fund,
    netValue: 1.0 + Math.random() * 3,
    changePercent: (Math.random() - 0.5) * 5,
    isAdded: userFundCodes.has(fund.code)
  }))
}

/**
 * 导出用户基金配置
 */
export function exportUserFunds(): string {
  const userFunds = getUserFunds()
  return JSON.stringify(userFunds, null, 2)
}

/**
 * 导入用户基金配置
 */
export function importUserFunds(jsonString: string): boolean {
  try {
    const importedFunds = JSON.parse(jsonString)
    
    if (Array.isArray(importedFunds)) {
      // 验证数据结构
      const validFunds = importedFunds.filter(fund => 
        fund && typeof fund.code === 'string' && typeof fund.name === 'string'
      )
      
      localStorage.setItem(STORAGE_KEYS.USER_FUNDS, JSON.stringify(validFunds))
      console.log(`✅ 导入 ${validFunds.length} 只基金`)
      return true
    }
    
  } catch (error) {
    console.error('导入基金配置失败:', error)
  }
  
  return false
}

export default {
  searchFunds,
  getFundDetail,
  addFundToUserList,
  removeFundFromUserList,
  getUserFunds,
  getSearchHistory,
  clearSearchHistory,
  exportUserFunds,
  importUserFunds
}