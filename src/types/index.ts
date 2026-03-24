export interface Fund {
  id: string
  name: string
  code: string
  currentPrice: number
  changePercent: number
  changeAmount: number
  volume: number
  timestamp: string
}

export interface StockData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  timestamp: string
  history?: {
    time: string
    price: number
  }[]
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  timestamp: string
}