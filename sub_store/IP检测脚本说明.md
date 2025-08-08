# IP地理位置检测脚本说明

## 概述
这个脚本用于Sub-Store，可以通过查询代理节点IP地址的地理位置信息，自动判断节点的真实位置，并更新节点名称。

## 免费IP查询服务对比

### 1. IP-API.com ⭐⭐⭐⭐⭐ （推荐）
- **限制**: 45 requests/minute
- **特点**: 
  - 完全免费，无需注册
  - 响应速度快（<50ms）
  - 数据准确度高
  - 支持批量查询
- **URL**: `http://ip-api.com/json/`
- **响应格式**: JSON, XML, CSV等
- **商业使用**: 需要付费版本

### 2. FreeIPAPI.com ⭐⭐⭐⭐
- **限制**: 60 requests/minute  
- **特点**:
  - 允许商业使用
  - 支持IPv4和IPv6
  - 数据库定期更新
  - 支持HTTPS
- **URL**: `https://freeipapi.com/api/json/`
- **付费版**: €9.90/月 无限制

### 3. IPinfo.io ⭐⭐⭐⭐
- **限制**: 50,000 requests/month（免费）
- **特点**:
  - 企业级服务质量
  - 数据准确度高
  - 详细的地理信息
  - 强大的企业支持
- **URL**: `https://ipinfo.io/`
- **付费版**: 从$12/月开始

### 4. IPAPI.co ⭐⭐⭐
- **限制**: 1,000 requests/day（免费）
- **特点**:
  - 无需注册
  - 支持HTTPS
  - 响应详细
- **URL**: `https://ipapi.co/`
- **付费版**: 从$12/月开始

## 脚本功能特点

### 1. 智能IP提取
- 自动从代理配置中提取IP地址
- 支持IPv4和IPv6格式
- 识别域名（标记为需要DNS解析）

### 2. 多格式输出
- `flag`: 国旗表情符号 🇺🇸🇭🇰🇯🇵
- `zh`: 中文名称（美国、香港、日本）
- `en`: 英文名称（United States、Hong Kong、Japan）
- `code`: 国家代码（US、HK、JP）

### 3. 智能节点名处理
- 自动移除原有的国家标识
- 支持自定义前缀
- 保留原始节点标识信息

### 4. 错误处理与重试
- 自动重试机制
- API限制保护
- 详细的错误日志

### 5. 并发控制
- 可配置并发数量
- 自动延迟避免超限
- 批量处理优化

## 使用方法

### 基础使用
```
https://你的域名/ip_detector_simple.js
```

### 带参数使用
```
https://你的域名/ip_detector_simple.js#api=ip-api&format=flag&concurrent=3&prefix=✅
```

### 参数说明
- `api`: API服务商 (`ip-api`, `freeipapi`, `ipinfo`, `ipapi`)
- `format`: 输出格式 (`flag`, `zh`, `en`, `code`) 
- `timeout`: 超时时间（毫秒，默认5000）
- `concurrent`: 并发数量（默认3）
- `retries`: 重试次数（默认2）
- `prefix`: 节点名前缀
- `fallback`: 失败时是否保留节点（默认true）
- `debug`: 显示详细配置信息

### 配置示例
```javascript
// 使用国旗格式，3个并发
script.js#api=ip-api&format=flag&concurrent=3

// 中文格式，带前缀
script.js#format=zh&prefix=✅&api=freeipapi

// 调试模式
script.js#debug=true
```

## 实际效果示例

### 原始节点名
```
US-Los Angeles-01
Tokyo-Premium-02
HK-BGP-03
Singapore-Game-01
```

### 检测后（flag格式）
```
🇺🇸 Los Angeles-01
🇯🇵 Premium-02  
🇭🇰 BGP-03
🇸🇬 Game-01
```

### 检测后（中文格式）
```
美国 Los Angeles-01
日本 Premium-02
香港 BGP-03
新加坡 Game-01
```

## 注意事项

### 1. API限制
- 严格遵守各服务商的请求限制
- 建议使用较低的并发数（2-3个）
- 大批量检测时分批处理

### 2. 网络环境
- 确保Sub-Store环境可以访问外部API
- 某些网络可能阻止IP查询服务
- HTTPS/HTTP协议支持情况

### 3. 检测准确性
- IP地理位置数据并非100%准确
- 部分代理可能使用CDN或负载均衡
- 域名节点需要额外DNS解析

### 4. 性能考虑
- 大量节点检测需要时间
- 网络请求可能失败，需要重试
- 建议在非高峰时段进行批量检测

## 错误处理

### 常见错误类型
1. **网络超时**: 增加timeout参数
2. **API限制**: 降低concurrent参数，增加延迟
3. **无效IP**: 节点使用域名，需要DNS解析
4. **查询失败**: API服务暂时不可用

### 错误标记
- `[域名]`: 节点使用域名而非IP
- `[查询失败]`: API查询失败
- `[错误]`: 处理过程中发生错误

## 最佳实践

### 1. API选择建议
- **小规模使用**: ip-api (45 requests/min)
- **中等规模**: freeipapi (60 requests/min)
- **大规模商用**: ipinfo 付费版

### 2. 参数配置建议
```javascript
// 保守配置（适合大部分情况）
api=ip-api&format=flag&concurrent=2&timeout=8000&retries=3

// 快速配置（网络良好时）
api=freeipapi&format=zh&concurrent=5&timeout=3000

// 稳定配置（网络不稳定时）
api=ip-api&format=flag&concurrent=1&timeout=10000&retries=5
```

### 3. 使用建议
- 首次使用建议先用debug模式查看配置
- 小批量测试确认效果后再大规模使用
- 定期检查API服务状态
- 根据实际效果调整参数

这个脚本完全可行，主要依赖免费的IP地理位置查询API，无需连接代理即可获得位置信息！
