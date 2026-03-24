import { useState, useEffect } from 'react'
import './App.css'
import FundTable from './components/FundTable'
import StockChart from './components/StockChart'
import Header from './components/Header'
import { fetchFundData, fetchStockData } from './utils/api'
import type { Fund, StockData } from './types'

function App() {
  const [funds, setFunds] = useState<Fund[]>([])
  const [stocks, setStocks] = useState<StockData[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [fundData, stockData] = await Promise.all([
          fetchFundData(),
          fetchStockData()
        ])
        setFunds(fundData)
        setStocks(stockData)
        setLastUpdated(new Date().toLocaleString('zh-CN'))
      } catch (error) {
        console.error('加载数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
    // 每30秒更新一次数据
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="app">
      <Header lastUpdated={lastUpdated} />
      
      <main className="main-content">
        <section className="overview-section">
          <div className="stats-card">
            <h3>📈 今日概览</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">监控基金</span>
                <span className="stat-value">{funds.length} 只</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">上涨基金</span>
                <span className="stat-value positive">
                  {funds.filter(f => f.changePercent > 0).length} 只
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">平均涨幅</span>
                <span className="stat-value">
                  {funds.length > 0 
                    ? (funds.reduce((sum, f) => sum + f.changePercent, 0) / funds.length).toFixed(2) + '%'
                    : '0.00%'
                  }
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="data-grid">
          <div className="fund-section">
            <h2>📊 基金实时行情</h2>
            {loading ? (
              <div className="loading">加载中...</div>
            ) : (
              <FundTable funds={funds} />
            )}
          </div>

          <div className="chart-section">
            <h2>📈 股票走势图</h2>
            {loading ? (
              <div className="loading">加载中...</div>
            ) : (
              <StockChart stocks={stocks} />
            )}
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>数据更新时间: {lastUpdated || '正在加载...'}</p>
        <p>© 2026 基金股票展示系统 | 数据仅供参考，投资需谨慎</p>
      </footer>
    </div>
  )
}

export default App