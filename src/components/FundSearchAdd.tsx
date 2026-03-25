import React, { useState, useEffect } from 'react'
import { 
  Input, Button, Space, List, Card, Tag, Modal, 
  message, Popover, Divider, Empty, Spin, Tooltip,
  Typography, Alert
} from 'antd'
import { 
  SearchOutlined, PlusOutlined, DeleteOutlined, 
  HistoryOutlined, ExportOutlined, ImportOutlined,
  StarOutlined, StarFilled, InfoCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import type { FundSearchResult } from '../services/fundSearchService'
import { 
  searchFunds, addFundToUserList, removeFundFromUserList, 
  getUserFunds, getSearchHistory, clearSearchHistory,
  exportUserFunds, importUserFunds
} from '../services/fundSearchService'

const { Text } = Typography

interface FundSearchAddProps {
  onFundsUpdated?: () => void
  onFundAdded?: (fundCode: string) => void
  onFundRemoved?: (fundCode: string) => void
}

const FundSearchAdd: React.FC<FundSearchAddProps> = ({
  onFundsUpdated,
  onFundAdded,
  onFundRemoved
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FundSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [userFunds, setUserFunds] = useState(getUserFunds())
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [importModalVisible, setImportModalVisible] = useState(false)
  const [importText, setImportText] = useState('')
  const [importLoading, setImportLoading] = useState(false)

  // 加载搜索历史
  useEffect(() => {
    setSearchHistory(getSearchHistory())
  }, [])

  // 处理搜索
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      message.warning('请输入搜索关键词')
      return
    }

    setLoading(true)
    try {
      const results = await searchFunds(searchQuery)
      setSearchResults(results)
      
      if (results.length === 0) {
        message.info('未找到相关基金')
      }
    } catch (error) {
      message.error('搜索失败，请稍后重试')
      console.error('搜索失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 处理添加基金
  const handleAddFund = (fund: FundSearchResult) => {
    const success = addFundToUserList(fund)
    
    if (success) {
      message.success(`已添加基金: ${fund.name}`)
      setUserFunds(getUserFunds())
      setSearchResults(prev => 
        prev.map(item => 
          item.code === fund.code ? { ...item, isAdded: true } : item
        )
      )
      
      // 触发回调
      onFundsUpdated?.()
      onFundAdded?.(fund.code)
    } else {
      message.warning('该基金已添加')
    }
  }

  // 处理移除基金
  const handleRemoveFund = (fundCode: string, fundName: string) => {
    Modal.confirm({
      title: '确认移除',
      content: `确定要移除基金 "${fundName}" 吗？`,
      okText: '移除',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => {
        const success = removeFundFromUserList(fundCode)
        
        if (success) {
          message.success(`已移除基金: ${fundName}`)
          setUserFunds(getUserFunds())
          setSearchResults(prev => 
            prev.map(item => 
              item.code === fundCode ? { ...item, isAdded: false } : item
            )
          )
          
          // 触发回调
          onFundsUpdated?.()
          onFundRemoved?.(fundCode)
        }
      }
    })
  }

  // 处理历史搜索点击
  const handleHistoryClick = (historyItem: string) => {
    setSearchQuery(historyItem)
    // 延迟执行搜索，让输入框先更新
    setTimeout(() => {
      handleSearch()
    }, 100)
  }

  // 清空搜索历史
  const handleClearHistory = () => {
    Modal.confirm({
      title: '确认清空',
      content: '确定要清空搜索历史吗？',
      okText: '清空',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => {
        clearSearchHistory()
        setSearchHistory([])
        message.success('搜索历史已清空')
      }
    })
  }

  // 导出基金配置
  const handleExport = () => {
    const config = exportUserFunds()
    
    // 创建下载链接
    const blob = new Blob([config], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fund-stock-show-config-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    message.success('基金配置已导出')
  }

  // 导入基金配置
  const handleImport = () => {
    if (!importText.trim()) {
      message.warning('请输入要导入的配置JSON')
      return
    }

    setImportLoading(true)
    try {
      const success = importUserFunds(importText)
      
      if (success) {
        message.success('基金配置导入成功')
        setUserFunds(getUserFunds())
        setImportModalVisible(false)
        setImportText('')
        
        // 触发回调
        onFundsUpdated?.()
      } else {
        message.error('导入失败，请检查JSON格式')
      }
    } catch (error) {
      message.error('导入失败，请检查JSON格式')
    } finally {
      setImportLoading(false)
    }
  }

  // 渲染基金类型标签
  const renderFundTypeTag = (type: string) => {
    const typeColors: Record<string, string> = {
      '股票型': 'red',
      '混合型': 'blue',
      '指数型': 'green',
      '债券型': 'orange',
      '货币型': 'purple',
      'QDII': 'cyan'
    }
    
    return (
      <Tag color={typeColors[type] || 'default'} style={{ marginRight: 4 }}>
        {type}
      </Tag>
    )
  }

  // 渲染搜索结果项
  const renderSearchResultItem = (fund: FundSearchResult) => (
    <List.Item
      actions={[
        fund.isAdded ? (
          <Tooltip title="已添加">
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />}
              onClick={() => handleRemoveFund(fund.code, fund.name)}
            >
              移除
            </Button>
          </Tooltip>
        ) : (
          <Tooltip title="添加到我的基金">
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => handleAddFund(fund)}
            >
              添加
            </Button>
          </Tooltip>
        )
      ]}
    >
      <List.Item.Meta
        avatar={
          <div style={{ textAlign: 'center', minWidth: 80 }}>
            <div style={{ fontSize: 16, fontWeight: 'bold', color: '#1890ff' }}>
              {fund.code}
            </div>
            {fund.changePercent !== undefined && (
              <div style={{ 
                fontSize: 12, 
                color: fund.changePercent >= 0 ? '#f5222d' : '#52c41a',
                fontWeight: 'bold'
              }}>
                {fund.changePercent >= 0 ? '+' : ''}{fund.changePercent.toFixed(2)}%
              </div>
            )}
          </div>
        }
        title={
          <Space>
            <Text strong>{fund.name}</Text>
            {fund.isAdded && <StarFilled style={{ color: '#faad14' }} />}
          </Space>
        }
        description={
          <Space direction="vertical" size={2} style={{ width: '100%' }}>
            <Space wrap>
              {renderFundTypeTag(fund.type)}
              <Tag color="geekblue">{fund.company}</Tag>
            </Space>
            {fund.netValue !== undefined && (
              <Text type="secondary">
                净值: <Text strong>¥{fund.netValue.toFixed(4)}</Text>
              </Text>
            )}
          </Space>
        }
      />
    </List.Item>
  )

  // 搜索历史内容
  const historyContent = searchHistory.length > 0 ? (
    <div style={{ maxWidth: 300 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text strong>搜索历史</Text>
        <Button 
          type="link" 
          size="small" 
          danger 
          onClick={handleClearHistory}
        >
          清空
        </Button>
      </div>
      <List
        size="small"
        dataSource={searchHistory}
        renderItem={(item) => (
          <List.Item>
            <Button 
              type="text" 
              block 
              style={{ textAlign: 'left' }}
              onClick={() => handleHistoryClick(item)}
            >
              {item}
            </Button>
          </List.Item>
        )}
      />
    </div>
  ) : (
    <div style={{ padding: '8px 0', textAlign: 'center' }}>
      <Text type="secondary">暂无搜索历史</Text>
    </div>
  )

  return (
    <Card 
      title="基金搜索与添加" 
      extra={
        <Space>
          <Popover content={historyContent} title={null} trigger="click">
            <Button icon={<HistoryOutlined />} size="small">
              历史
            </Button>
          </Popover>
          <Button 
            icon={<ExportOutlined />} 
            size="small"
            onClick={handleExport}
          >
            导出
          </Button>
          <Button 
            icon={<ImportOutlined />} 
            size="small"
            onClick={() => setImportModalVisible(true)}
          >
            导入
          </Button>
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      {/* 搜索框 */}
      <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
        <Input
          placeholder="输入基金代码、名称或公司..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onPressEnter={handleSearch}
          size="large"
          allowClear
        />
        <Button 
          type="primary" 
          icon={<SearchOutlined />} 
          onClick={handleSearch}
          size="large"
          loading={loading}
        >
          搜索
        </Button>
      </Space.Compact>

      {/* 用户基金统计 */}
      <Alert
        message={
          <Space>
            <Text strong>我的基金</Text>
            <Tag color="blue">{userFunds.length} 只</Tag>
            <Button 
              type="link" 
              size="small" 
              icon={<ReloadOutlined />}
              onClick={() => {
                setUserFunds(getUserFunds())
                message.success('基金列表已刷新')
              }}
            >
              刷新
            </Button>
          </Space>
        }
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 16 }}
      />

      {/* 搜索结果 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">正在搜索基金...</Text>
          </div>
        </div>
      ) : searchResults.length > 0 ? (
        <>
          <Divider orientation="left">
            <Text strong>搜索结果 ({searchResults.length})</Text>
          </Divider>
          <List
            dataSource={searchResults}
            renderItem={renderSearchResultItem}
            rowKey="code"
            style={{ maxHeight: 400, overflow: 'auto' }}
          />
        </>
      ) : searchQuery ? (
        <Empty
          description={
            <div>
              <div>未找到相关基金</div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                请尝试其他关键词，如：易方达、白酒、医疗等
              </Text>
            </div>
          }
          style={{ padding: '40px 0' }}
        />
      ) : (
        <Empty
          description="输入关键词搜索基金"
          style={{ padding: '40px 0' }}
        />
      )}

      {/* 导入模态框 */}
      <Modal
        title="导入基金配置"
        open={importModalVisible}
        onOk={handleImport}
        onCancel={() => {
          setImportModalVisible(false)
          setImportText('')
        }}
        okText="导入"
        cancelText="取消"
        confirmLoading={importLoading}
      >
        <Alert
          message="导入说明"
          description="请粘贴之前导出的JSON配置。导入会替换当前所有基金配置。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Input.TextArea
          placeholder="粘贴JSON配置..."
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          rows={8}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        />
      </Modal>
    </Card>
  )
}

export default FundSearchAdd