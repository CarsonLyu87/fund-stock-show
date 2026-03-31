# Vercel 部署问题解决方案

## 问题描述
在Vercel部署时出现错误：
```
Error: Function Runtimes must have a valid version, for example `now-php@1.0.0`.
```

## 问题原因
Vercel检测到项目中有JavaScript文件（如`proxy-server.js`），误以为这些是服务器端函数，但没有指定运行时版本。

## 解决方案

### 1. 创建明确的Vercel配置
更新`vercel.json`文件，明确指定：
- 这是一个Vite静态网站
- 如果有API函数，使用Node.js 18.x运行时
- 设置最大执行时间为10秒

### 2. 创建.vercelignore文件
告诉Vercel忽略开发服务器文件和其他不需要的文件：
```
proxy-server.js
node_modules/
dist/
.env
```

### 3. 创建简单的API函数（可选）
如果Vercel仍然要求函数运行时，可以创建一个简单的健康检查API函数：
- 在`api/`目录下创建`health.js`
- 指定Node.js 18.x运行时
- 返回简单的JSON响应

### 4. 更新后的vercel.json配置
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "api/*.js": {
      "runtime": "nodejs18.x",
      "maxDuration": 10
    }
  },
  "github": {
    "silent": true
  },
  "public": true
}
```

## 部署步骤

### 方法1：通过Vercel Dashboard
1. 访问 [vercel.com](https://vercel.com)
2. 点击"New Project"
3. 导入GitHub仓库 `CarsonLyu87/fund-stock-show`
4. Vercel会自动检测配置并部署

### 方法2：使用Vercel CLI
```bash
# 安装Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel

# 生产环境部署
vercel --prod
```

### 方法3：GitHub集成
1. 在Vercel中连接GitHub账户
2. 授权访问仓库
3. 启用自动部署（每次push到main分支自动部署）

## 验证部署
部署成功后，访问：
- 健康检查API: `https://your-project.vercel.app/api/health`
- 主应用: `https://your-project.vercel.app`

## 故障排除

### 如果仍然出现运行时错误
1. 检查`api/`目录下的文件是否有正确的导出
2. 确保`vercel.json`中的函数配置正确
3. 尝试删除`api/`目录，如果不需要服务器端函数

### 构建失败
1. 检查构建日志中的具体错误
2. 确保所有依赖都已正确安装
3. 检查Node.js版本兼容性

### 静态文件服务问题
1. 确保`dist/`目录包含正确的文件
2. 检查`rewrites`配置是否正确
3. 验证`outputDirectory`设置

## 替代方案
如果Vercel部署仍然有问题，可以考虑：
1. **GitHub Pages**: 免费静态托管
2. **Netlify**: 类似的静态网站托管服务
3. **Cloudflare Pages**: 快速CDN加速

## 项目状态
- ✅ 本地构建成功
- ✅ Vercel配置已修复
- ✅ API函数已创建
- ✅ 忽略文件配置完成
- 🔄 等待Vercel部署测试