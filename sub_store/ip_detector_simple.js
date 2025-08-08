/**
 * IP地理位置检测脚本 - 适用于Sub-Store (纯API版本)
 * 仅通过真实API查询IP地址的地理位置，其他情况一律报错
 * 
 * 支持参数：
 * - api: 使用的IP查询服务 (ip-api, ipapi, freeipapi, ipinfo)
 * - format: 输出格式 (flag, zh, en, code)  
 * - timeout: 请求超时时间（毫秒）
 * - prefix: 节点名前缀
 * - fallback: 检测失败时是否保留原节点
 * 
 * 使用示例：
 * script.js#api=ip-api&format=flag&timeout=5000&prefix=✅
 * 
 * 作者: Assistant
 * 版本: 4.1 (Sub-Store远程兼容版本)
 */

// 避免变量冲突，使用不同的变量名
const scriptArgs = typeof $arguments !== 'undefined' ? $arguments : {};

// 配置参数
const config = {
  api: scriptArgs.api || 'ip-api',
  format: scriptArgs.format || 'flag',
  timeout: parseInt(scriptArgs.timeout) || 5000,
  prefix: scriptArgs.prefix || '✅',
  fallback: scriptArgs.fallback !== 'false',
  retries: parseInt(scriptArgs.retries) || 2
};

// 免费IP查询API配置
const ipServices = {
  'ip-api': {
    name: 'IP-API.com',
    url: 'http://ip-api.com/json/',
    limit: '45 requests/minute',
    parseResponse: (data) => ({
      ip: data.query,
      country: data.country,
      countryCode: data.countryCode,
      region: data.regionName,
      city: data.city,
      isp: data.isp,
      timezone: data.timezone
    })
  },
  'freeipapi': {
    name: 'FreeIPAPI.com',
    url: 'https://freeipapi.com/api/json/',
    limit: '60 requests/minute',
    parseResponse: (data) => ({
      ip: data.ipAddress,
      country: data.countryName,
      countryCode: data.countryCode,
      region: data.regionName,
      city: data.cityName,
      isp: data.isP,
      timezone: data.timeZone
    })
  },
  'ipapi': {
    name: 'IPAPI.co',
    url: 'https://ipapi.co/',
    limit: '1000 requests/day (free)',
    parseResponse: (data) => ({
      ip: data.ip,
      country: data.country_name,
      countryCode: data.country_code,
      region: data.region,
      city: data.city,
      isp: data.org,
      timezone: data.timezone
    })
  },
  'ipinfo': {
    name: 'IPinfo.io',
    url: 'https://ipinfo.io/',
    limit: '50000 requests/month (free)',
    parseResponse: (data) => ({
      ip: data.ip,
      country: data.country,
      countryCode: data.country,
      region: data.region,
      city: data.city,
      isp: data.org,
      timezone: data.timezone
    })
  }
};

// 国家名称映射
const countryMaps = {
  flags: {
    'CN': '🇨🇳', 'HK': '🇭🇰', 'TW': '🇹🇼', 'MO': '🇲🇴',
    'JP': '🇯🇵', 'KR': '🇰🇷', 'SG': '🇸🇬', 'MY': '🇲🇾',
    'US': '🇺🇸', 'CA': '🇨🇦', 'MX': '🇲🇽', 'BR': '🇧🇷',
    'GB': '🇬🇧', 'FR': '🇫🇷', 'DE': '🇩🇪', 'IT': '🇮🇹',
    'ES': '🇪🇸', 'NL': '🇳🇱', 'SE': '🇸🇪', 'NO': '🇳🇴',
    'CH': '🇨🇭', 'AT': '🇦🇹', 'BE': '🇧🇪', 'DK': '🇩🇰',
    'FI': '🇫🇮', 'IE': '🇮🇪', 'PT': '🇵🇹', 'GR': '🇬🇷',
    'RU': '🇷🇺', 'UA': '🇺🇦', 'PL': '🇵🇱', 'CZ': '🇨🇿',
    'AU': '🇦🇺', 'NZ': '🇳🇿', 'IN': '🇮🇳', 'TH': '🇹🇭',
    'VN': '🇻🇳', 'ID': '🇮🇩', 'PH': '🇵🇭', 'TR': '🇹🇷',
    'AE': '🇦🇪', 'SA': '🇸🇦', 'IL': '🇮🇱', 'EG': '🇪🇬',
    'ZA': '🇿🇦', 'KE': '🇰🇪', 'NG': '🇳🇬', 'AR': '🇦🇷'
  },
  chinese: {
    'CN': '中国', 'HK': '香港', 'TW': '台湾', 'MO': '澳门',
    'JP': '日本', 'KR': '韩国', 'SG': '新加坡', 'MY': '马来西亚',
    'US': '美国', 'CA': '加拿大', 'MX': '墨西哥', 'BR': '巴西',
    'GB': '英国', 'FR': '法国', 'DE': '德国', 'IT': '意大利',
    'ES': '西班牙', 'NL': '荷兰', 'SE': '瑞典', 'NO': '挪威',
    'CH': '瑞士', 'AT': '奥地利', 'BE': '比利时', 'DK': '丹麦',
    'FI': '芬兰', 'IE': '爱尔兰', 'PT': '葡萄牙', 'GR': '希腊',
    'RU': '俄罗斯', 'UA': '乌克兰', 'PL': '波兰', 'CZ': '捷克',
    'AU': '澳大利亚', 'NZ': '新西兰', 'IN': '印度', 'TH': '泰国',
    'VN': '越南', 'ID': '印尼', 'PH': '菲律宾', 'TR': '土耳其',
    'AE': '阿联酋', 'SA': '沙特', 'IL': '以色列', 'EG': '埃及',
    'ZA': '南非', 'KE': '肯尼亚', 'NG': '尼日利亚', 'AR': '阿根廷'
  },
  english: {
    'CN': 'China', 'HK': 'Hong Kong', 'TW': 'Taiwan', 'MO': 'Macao',
    'JP': 'Japan', 'KR': 'Korea', 'SG': 'Singapore', 'MY': 'Malaysia',
    'US': 'United States', 'CA': 'Canada', 'MX': 'Mexico', 'BR': 'Brazil',
    'GB': 'United Kingdom', 'FR': 'France', 'DE': 'Germany', 'IT': 'Italy',
    'ES': 'Spain', 'NL': 'Netherlands', 'SE': 'Sweden', 'NO': 'Norway',
    'CH': 'Switzerland', 'AT': 'Austria', 'BE': 'Belgium', 'DK': 'Denmark',
    'FI': 'Finland', 'IE': 'Ireland', 'PT': 'Portugal', 'GR': 'Greece',
    'RU': 'Russia', 'UA': 'Ukraine', 'PL': 'Poland', 'CZ': 'Czech',
    'AU': 'Australia', 'NZ': 'New Zealand', 'IN': 'India', 'TH': 'Thailand',
    'VN': 'Vietnam', 'ID': 'Indonesia', 'PH': 'Philippines', 'TR': 'Turkey',
    'AE': 'UAE', 'SA': 'Saudi Arabia', 'IL': 'Israel', 'EG': 'Egypt',
    'ZA': 'South Africa', 'KE': 'Kenya', 'NG': 'Nigeria', 'AR': 'Argentina'
  }
};

/**
 * 从节点配置中提取IP地址
 * @param {Object} proxy 代理节点配置
 * @returns {string|null} IP地址或null
 */
function extractIPFromProxy(proxy) {
  // 从代理服务器地址提取IP
  const server = proxy.server || proxy.hostname || proxy.host;
  
  if (!server) return null;
  
  // 检查是否为IP地址（IPv4）
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(server)) {
    return server;
  }
  
  // 检查是否为IPv6地址
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  if (ipv6Regex.test(server)) {
    return server;
  }
  
  // 如果是域名，直接返回null（根据用户要求，不处理域名）
  return null;
}

/**
 * 通过IP查询API获取真实地理位置信息（Sub-Store远程脚本版本）
 * @param {string} ip IP地址
 * @returns {Object|null} 地理位置信息
 */
function queryIPLocationSync(ip) {
  const service = ipServices[config.api];
  if (!service) {
    console.error(`❌ 不支持的API服务: ${config.api}`);
    return null;
  }
  
  try {
    console.log(`📡 正在查询IP ${ip} 的位置信息，使用API: ${service.name}`);
    
    let url;
    if (config.api === 'ipapi') {
      url = `${service.url}${ip}/json/`;
    } else if (config.api === 'ipinfo') {
      url = `${service.url}${ip}/json`;
    } else {
      url = `${service.url}${ip}`;
    }
    
    let data;
    let requestSuccess = false;
    
    // 尝试Sub-Store环境的HTTP方法
    try {
      // 方法1: 尝试使用$httpClient (Surge/Loon环境)
      if (typeof $httpClient !== 'undefined') {
        console.log(`🔧 使用$httpClient进行请求`);
        const result = $httpClient.get({
          url: url,
          headers: {
            'User-Agent': 'Sub-Store-IP-Detector/4.1'
          },
          timeout: config.timeout / 1000
        });
        
        if (result && result.body) {
          data = JSON.parse(result.body);
          requestSuccess = true;
        }
      }
      
      // 方法2: 尝试使用$task.fetch (Quantumult X环境)
      if (!requestSuccess && typeof $task !== 'undefined' && $task.fetch) {
        console.log(`🔧 使用$task.fetch进行请求`);
        const result = $task.fetch({
          url: url,
          method: 'GET',
          headers: {
            'User-Agent': 'Sub-Store-IP-Detector/4.1'
          },
          timeout: config.timeout
        });
        
        if (result && result.body) {
          data = JSON.parse(result.body);
          requestSuccess = true;
        }
      }
      
      // 方法3: 尝试使用原生Node.js方法 (Docker环境)
      if (!requestSuccess && typeof require === 'function') {
        console.log(`🔧 使用Node.js请求方法`);
        
        try {
          // 尝试使用child_process执行curl
          const { execSync } = require('child_process');
          const curlCmd = `curl -s -H "User-Agent: Sub-Store-IP-Detector/4.1" --connect-timeout ${Math.ceil(config.timeout/1000)} "${url}"`;
          
          const result = execSync(curlCmd, { 
            encoding: 'utf8',
            timeout: config.timeout,
            maxBuffer: 1024 * 1024
          });
          
          if (result && result.trim()) {
            data = JSON.parse(result.trim());
            requestSuccess = true;
            console.log(`🌐 curl请求成功`);
          }
        } catch (curlError) {
          console.log(`curl失败，尝试Node.js http模块: ${curlError.message}`);
          
          // 如果curl失败，尝试Node.js http/https模块
          const https = require('https');
          const http = require('http');
          const urlObj = new URL(url);
          const client = urlObj.protocol === 'https:' ? https : http;
          
          return new Promise((resolve) => {
            const req = client.get({
              hostname: urlObj.hostname,
              port: urlObj.port,
              path: urlObj.pathname + urlObj.search,
              headers: {
                'User-Agent': 'Sub-Store-IP-Detector/4.1'
              },
              timeout: config.timeout
            }, (res) => {
              let responseData = '';
              res.on('data', (chunk) => {
                responseData += chunk;
              });
              res.on('end', () => {
                try {
                  const parsedData = JSON.parse(responseData);
                  resolve(parsedData);
                } catch (parseError) {
                  console.error(`JSON解析失败: ${parseError.message}`);
                  resolve(null);
                }
              });
            });
            
            req.on('error', (error) => {
              console.error(`HTTP请求错误: ${error.message}`);
              resolve(null);
            });
            
            req.on('timeout', () => {
              console.error('HTTP请求超时');
              req.destroy();
              resolve(null);
            });
            
            req.end();
          }).then(result => {
            if (result) {
              data = result;
              requestSuccess = true;
              console.log(`🌐 Node.js http请求成功`);
            }
            return result;
          });
        }
      }
      
    } catch (requestError) {
      console.error(`HTTP请求失败: ${requestError.message}`);
    }
    
    // 如果所有方法都失败
    if (!requestSuccess || !data) {
      throw new Error('所有HTTP请求方法都失败，可能是网络问题或API服务不可用');
    }
    
    // 检查API响应状态
    if (config.api === 'ip-api' && data.status === 'fail') {
      throw new Error(data.message || 'IP查询失败');
    }
    
    // 检查数据完整性
    if (!data || typeof data !== 'object') {
      throw new Error('API返回的数据格式无效');
    }
    
    const locationInfo = service.parseResponse(data);
    
    // 验证解析结果
    if (!locationInfo || !locationInfo.countryCode) {
      throw new Error('无法解析API返回的地理位置信息');
    }
    
    console.log(`✅ IP ${ip} 位置: ${locationInfo.country} (${locationInfo.countryCode})`);
    
    return locationInfo;
    
  } catch (error) {
    console.error(`❌ 查询IP ${ip} 失败: ${error.message}`);
    return null;
  }
}

/**
 * 格式化国家名称
 * @param {string} countryCode 国家代码
 * @param {string} countryName 国家名称
 * @returns {string} 格式化后的国家名称
 */
function formatCountryName(countryCode, countryName) {
  const maps = {
    'flag': countryMaps.flags,
    'zh': countryMaps.chinese,
    'en': countryMaps.english,
    'code': null
  };
  
  const map = maps[config.format];
  
  if (config.format === 'code') {
    return countryCode || 'XX';
  }
  
  return map?.[countryCode] || countryName || countryCode || '未知';
}

/**
 * 构建新的节点名称
 * @param {string} originalName 原始名称
 * @param {Object} locationInfo 地理位置信息
 * @returns {string} 新的节点名称
 */
function buildNewNodeName(originalName, locationInfo) {
  const countryName = formatCountryName(locationInfo.countryCode, locationInfo.country);
  
  // 移除原有的地理标识和常见前缀
  let cleanName = originalName
    // 移除国旗
    .replace(/^(🇨🇳|🇭🇰|🇹🇼|🇲🇴|🇯🇵|🇰🇷|🇸🇬|🇺🇸|🇬🇧|🇫🇷|🇩🇪|🇦🇺|🇨🇦|🇷🇺|🇮🇳|🇧🇷|🇮🇹|🇪🇸|🇳🇱|🇸🇪|🇳🇴|🇨🇭|🇦🇹|🇧🇪|🇩🇰|🇫🇮|🇮🇪|🇵🇹|🇬🇷|🇺🇦|🇵🇱|🇨🇿|🇳🇿|🇹🇭|🇻🇳|🇮🇩|🇵🇭|🇹🇷|🇦🇪|🇸🇦|🇮🇱|🇪🇬|🇿🇦|🇰🇪|🇳🇬|🇦🇷|🇲🇾)\s*/, '')
    // 移除中文国家名
    .replace(/^(中国|香港|台湾|澳门|日本|韩国|新加坡|美国|英国|法国|德国|澳大利亚|加拿大|俄罗斯|印度|巴西|意大利|西班牙|荷兰|瑞典|挪威|瑞士|奥地利|比利时|丹麦|芬兰|爱尔兰|葡萄牙|希腊|乌克兰|波兰|捷克|新西兰|泰国|越南|印尼|菲律宾|土耳其|阿联酋|沙特|以色列|埃及|南非|肯尼亚|尼日利亚|阿根廷|马来西亚)\s*/, '')
    // 移除英文国家名
    .replace(/^(China|Hong Kong|Taiwan|Macao|Japan|Korea|Singapore|United States|United Kingdom|France|Germany|Australia|Canada|Russia|India|Brazil|Italy|Spain|Netherlands|Sweden|Norway|Switzerland|Austria|Belgium|Denmark|Finland|Ireland|Portugal|Greece|Ukraine|Poland|Czech|New Zealand|Thailand|Vietnam|Indonesia|Philippines|Turkey|UAE|Saudi Arabia|Israel|Egypt|South Africa|Kenya|Nigeria|Argentina|Malaysia)\s*/i, '')
    // 移除国家代码
    .replace(/^(CN|HK|TW|MO|JP|KR|SG|US|GB|FR|DE|AU|CA|RU|IN|BR|IT|ES|NL|SE|NO|CH|AT|BE|DK|FI|IE|PT|GR|UA|PL|CZ|NZ|TH|VN|ID|PH|TR|AE|SA|IL|EG|ZA|KE|NG|AR|MY)\s*/i, '')
    // 移除常见前缀
    .replace(/^(✅\s*已检测\s*|✅\s*|❌\s*|已检测\s*)/, '')
    // 移除协议类型前缀
    .replace(/^(hysteria2\s*|vmess\s*|vless\s*|trojan\s*|ss\s*|ssr\s*)/i, '')
    .trim();
  
  // 如果清理后名称为空，使用原始名称的部分内容
  if (!cleanName) {
    cleanName = originalName.replace(/^(🇨🇳|🇭🇰|🇹🇼|🇲🇴|🇯🇵|🇰🇷|🇸🇬|🇺🇸|🇬🇧|🇫🇷|🇩🇪|🇦🇺|🇨🇦|🇷🇺|🇮🇳|🇧🇷|🇮🇹|🇪🇸|🇳🇱|🇸🇪|🇳🇴|🇨🇭|🇦🇹|🇧🇪|🇩🇰|🇫🇮|🇮🇪|🇵🇹|🇬🇷|🇺🇦|🇵🇱|🇨🇿|🇳🇿|🇹🇭|🇻🇳|🇮🇩|🇵🇭|🇹🇷|🇦🇪|🇸🇦|🇮🇱|🇪🇬|🇿🇦|🇰🇪|🇳🇬|🇦🇷|🇲🇾)\s*/, '').trim();
  }
  
  // 构建新名称
  const parts = [config.prefix, countryName, cleanName].filter(part => part && part.trim());
  return parts.join(' ').trim();
}

/**
 * 主处理函数 - Sub-Store入口点
 * @param {Array} proxies 代理节点列表
 * @returns {Array} 处理后的代理节点列表
 */
function operator(proxies) {
  if (!Array.isArray(proxies) || proxies.length === 0) {
    console.log('❌ 没有可处理的代理节点');
    return proxies;
  }
  
  console.log(`=== IP地理位置检测开始 (纯API版本) ===`);
  console.log(`输入节点数量: ${proxies.length}`);
  console.log(`配置: API=${config.api}, 格式=${config.format}, 前缀="${config.prefix}"`);
  console.log(`使用服务: ${ipServices[config.api]?.name} - ${ipServices[config.api]?.limit}`);
  
  // 同步处理，直接返回修改后的节点
  const results = proxies.map((proxy, index) => {
    try {
      console.log(`处理节点 ${index + 1}: ${proxy.name}`);
      
      const ip = extractIPFromProxy(proxy);
      
      if (!ip) {
        console.log(`❌ 节点 ${proxy.name} 无法提取IP地址（域名或无效地址）`);
        proxy.name = `❌ ${proxy.name}`;
        return proxy;
      }
      
      console.log(`📍 提取到IP: ${ip}`);
      
      // 使用真实API查询IP地理位置
      const locationInfo = queryIPLocationSync(ip);
      
      if (locationInfo) {
        const originalName = proxy.name;
        proxy.name = buildNewNodeName(originalName, locationInfo);
        proxy.realCountry = locationInfo.countryCode;
        proxy.realIP = ip;
        proxy.location = locationInfo;
        proxy.detectionMethod = 'api';
        
        console.log(`🎯 API检测成功: ${originalName} -> ${proxy.name} (${ip})`);
        return proxy;
      } else {
        console.log(`❌ IP ${ip} API查询失败`);
        proxy.name = `❌ ${proxy.name}`;
        return proxy;
      }
      
    } catch (error) {
      console.error(`❌ 处理节点 ${proxy.name} 时出错: ${error.message}`);
      proxy.name = `❌ ${proxy.name}`;
      return proxy;
    }
  });
  
  const successCount = results.filter(proxy => proxy.detectionMethod === 'api').length;
  const errorCount = results.length - successCount;
  
  console.log(`=== 检测完成 ===`);
  console.log(`总计节点: ${results.length}, 成功: ${successCount}, 失败: ${errorCount}`);
  console.log(`API检测率: ${(successCount / results.length * 100).toFixed(1)}%`);
  
  return results;
}

// 导出给Sub-Store使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { operator };
}

// 也支持全局函数形式
if (typeof global !== 'undefined') {
  global.operator = operator;
}

// 提供配置信息查看函数
function showConfig() {
  console.log('\n=== IP地理位置检测脚本配置 (纯API版本) ===');
  console.log(`API服务: ${config.api} (${ipServices[config.api]?.name})`);
  console.log(`请求限制: ${ipServices[config.api]?.limit}`);
  console.log(`输出格式: ${config.format}`);
  console.log(`超时时间: ${config.timeout}ms`);
  console.log(`重试次数: ${config.retries}`);
  console.log(`失败保留: ${config.fallback}`);
  if (config.prefix) console.log(`节点前缀: "${config.prefix}"`);
  
  console.log('\n=== 支持的API服务 ===');
  Object.entries(ipServices).forEach(([key, service]) => {
    console.log(`${key}: ${service.name} - ${service.limit}`);
  });
  
  console.log('\n=== 使用示例 ===');
  console.log('基础使用: script.js');
  console.log('完整配置: script.js#api=ip-api&format=flag&timeout=5000&prefix=✅');
  
  console.log('\n=== 版本特性 ===');
  console.log('✅ 仅使用真实API查询IP地理位置');
  console.log('❌ 不处理域名（域名节点直接标记为失败）');
  console.log('❌ 不使用硬编码IP范围');
  console.log('❌ 不进行域名推测');
  console.log('❌ 不进行节点名称推断');
}

// 调试模式
if (scriptArgs.debug || scriptArgs.help) {
  showConfig();
}
