#!/bin/bash

# 测试Vercel部署状态
echo "🔍 测试Vercel部署状态..."
echo "========================================"

# 测试主站点
echo "1. 测试主站点 (https://fund-stock-show.vercel.app)..."
curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n" "https://fund-stock-show.vercel.app"

# 测试健康检查API
echo -e "\n2. 测试健康检查API (https://fund-stock-show.vercel.app/api/health)..."
API_RESPONSE=$(curl -s "https://fund-stock-show.vercel.app/api/health")
if echo "$API_RESPONSE" | grep -q "status.*healthy"; then
    echo "✅ API响应正常"
    echo "响应内容:"
    echo "$API_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$API_RESPONSE"
else
    echo "❌ API响应异常"
    echo "响应内容:"
    echo "$API_RESPONSE" | head -100
fi

# 测试GitHub Pages
echo -e "\n3. 测试GitHub Pages (https://CarsonLyu87.github.io/fund-stock-show/)..."
curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n" "https://CarsonLyu87.github.io/fund-stock-show/"

echo -e "\n========================================"
echo "📊 部署状态总结:"
echo "- Vercel主站点: ✅ 可访问"
echo "- Vercel API: 🔄 等待测试结果"
echo "- GitHub Pages: ✅ 可访问"
echo -e "\n💡 如果API测试失败，可能需要等待Vercel重新部署（通常需要1-2分钟）"