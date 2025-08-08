/**
 * IP地理位置检测脚本 - 适用于Sub-Store
 * 通过查询已知IP地址的地理位置信息来判断代理节点的真实位置
 * 
 * 支持参数：
 * - api: 使用的IP查询服务 (ip-api, ipapi, freeipapi, ipinfo)
 * - format: 输出格式 (flag, zh, en, code)
 * - timeout: 请求超时时间（毫秒）
 * - concurrent: 并发请求数量
 * - prefix: 节点名前缀
 * - fallback: 检测失败时是否保留原节点
 * 
 * 使用示例：
 * script.js#api=ip-api&format=flag&timeout=5000&concurrent=3&prefix=✅
 */

const inArg = $arguments || {};

// 配置参数
const config = {
  api: inArg.api || 'ip-api',
  format: inArg.format || 'flag',
  timeout: parseInt(inArg.timeout) || 5000,
  concurrent: parseInt(inArg.concurrent) || 3,
  prefix: inArg.prefix || '',
  fallback: inArg.fallback !== 'false',
  retries: parseInt(inArg.retries) || 2
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
  
  // 如果是域名，需要进行DNS解析（这里返回null，表示需要其他方式处理）
  return null;
}

/**
 * 通过IP查询API获取地理位置信息
 * @param {string} ip IP地址
 * @param {number} retryCount 重试次数
 * @returns {Promise<Object|null>} 地理位置信息
 */
async function queryIPLocation(ip, retryCount = 0) {
  const service = ipServices[config.api];
  if (!service) {
    console.error(`不支持的API服务: ${config.api}`);
    return null;
  }
  
  try {
    console.log(`正在查询IP ${ip} 的位置信息...`);
    
    let url;
    if (config.api === 'ipapi') {
      url = `${service.url}${ip}/json/`;
    } else if (config.api === 'ipinfo') {
      url = `${service.url}${ip}/json`;
    } else {
      url = `${service.url}${ip}`;
    }
    
    // 使用fetch或其他HTTP客户端
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Sub-Store-IP-Detector/1.0'
      },
      timeout: config.timeout
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // 检查API响应状态
    if (config.api === 'ip-api' && data.status === 'fail') {
      throw new Error(data.message || 'IP查询失败');
    }
    
    const locationInfo = service.parseResponse(data);
    console.log(`IP ${ip} 位置: ${locationInfo.country} (${locationInfo.countryCode})`);
    
    return locationInfo;
    
  } catch (error) {
    console.error(`查询IP ${ip} 失败: ${error.message}`);
    
    // 重试机制
    if (retryCount < config.retries) {
      console.log(`重试第 ${retryCount + 1} 次...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return queryIPLocation(ip, retryCount + 1);
    }
    
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
  
  // 移除原有的地理标识
  let cleanName = originalName
    .replace(/^(🇨🇳|🇭🇰|🇹🇼|🇲🇴|🇯🇵|🇰🇷|🇸🇬|🇺🇸|🇬🇧|🇫🇷|🇩🇪|🇦🇺|🇨🇦|🇷🇺|🇮🇳|🇧🇷|🇮🇹|🇪🇸|🇳🇱|🇸🇪|🇳🇴|🇨🇭|🇦🇹|🇧🇪|🇩🇰|🇫🇮|🇮🇪|🇵🇹|🇬🇷|🇺🇦|🇵🇱|🇨🇿|🇳🇿|🇹🇭|🇻🇳|🇮🇩|🇵🇭|🇹🇷|🇦🇪|🇸🇦|🇮🇱|🇪🇬|🇿🇦|🇰🇪|🇳🇬|🇦🇷|🇲🇾)\s*/, '')
    .replace(/^(中国|香港|台湾|澳门|日本|韩国|新加坡|美国|英国|法国|德国|澳大利亚|加拿大|俄罗斯|印度|巴西|意大利|西班牙|荷兰|瑞典|挪威|瑞士|奥地利|比利时|丹麦|芬兰|爱尔兰|葡萄牙|希腊|乌克兰|波兰|捷克|新西兰|泰国|越南|印尼|菲律宾|土耳其|阿联酋|沙特|以色列|埃及|南非|肯尼亚|尼日利亚|阿根廷|马来西亚)\s*/, '')
    .replace(/^(China|Hong Kong|Taiwan|Macao|Japan|Korea|Singapore|United States|United Kingdom|France|Germany|Australia|Canada|Russia|India|Brazil|Italy|Spain|Netherlands|Sweden|Norway|Switzerland|Austria|Belgium|Denmark|Finland|Ireland|Portugal|Greece|Ukraine|Poland|Czech|New Zealand|Thailand|Vietnam|Indonesia|Philippines|Turkey|UAE|Saudi Arabia|Israel|Egypt|South Africa|Kenya|Nigeria|Argentina|Malaysia)\s*/i, '')
    .replace(/^(CN|HK|TW|MO|JP|KR|SG|US|GB|FR|DE|AU|CA|RU|IN|BR|IT|ES|NL|SE|NO|CH|AT|BE|DK|FI|IE|PT|GR|UA|PL|CZ|NZ|TH|VN|ID|PH|TR|AE|SA|IL|EG|ZA|KE|NG|AR|MY)\s*/i, '');
  
  // 构建新名称
  const parts = [config.prefix, countryName, cleanName].filter(part => part && part.trim());
  return parts.join(' ').trim();
}

/**
 * 处理单个代理节点
 * @param {Object} proxy 代理节点配置
 * @returns {Promise<Object>} 处理后的代理节点
 */
async function processProxy(proxy) {
  try {
    const ip = extractIPFromProxy(proxy);
    
    if (!ip) {
      console.log(`节点 ${proxy.name} 无法提取IP地址（可能是域名）`);
      if (config.fallback) {
        proxy.name = `[域名] ${proxy.name}`;
        return proxy;
      } else {
        return null;
      }
    }
    
    const locationInfo = await queryIPLocation(ip);
    
    if (!locationInfo) {
      console.log(`节点 ${proxy.name} (${ip}) 查询失败`);
      if (config.fallback) {
        proxy.name = `[查询失败] ${proxy.name}`;
        return proxy;
      } else {
        return null;
      }
    }
    
    const originalName = proxy.name;
    proxy.name = buildNewNodeName(originalName, locationInfo);
    proxy.realCountry = locationInfo.countryCode;
    proxy.realIP = ip;
    proxy.location = locationInfo;
    
    console.log(`✅ ${originalName} -> ${proxy.name}`);
    return proxy;
    
  } catch (error) {
    console.error(`处理节点 ${proxy.name} 时出错: ${error.message}`);
    if (config.fallback) {
      proxy.name = `[错误] ${proxy.name}`;
      return proxy;
    } else {
      return null;
    }
  }
}

/**
 * 主处理函数 - Sub-Store入口点
 * @param {Array} proxies 代理节点列表
 * @returns {Promise<Array>} 处理后的代理节点列表
 */
async function operator(proxies) {
  if (!Array.isArray(proxies) || proxies.length === 0) {
    console.log('没有可处理的代理节点');
    return proxies;
  }
  
  console.log(`\n=== IP地理位置检测开始 ===`);
  console.log(`配置: API=${config.api}, 格式=${config.format}, 并发=${config.concurrent}`);
  
  try {
    const results = await processProxiesConcurrently(proxies);
    
    // 统计结果
    const successful = results.filter(p => p.realCountry);
    const failed = results.filter(p => !p.realCountry);
    
    console.log(`\n=== 检测完成 ===`);
    console.log(`总数: ${proxies.length}, 成功: ${successful.length}, 失败: ${failed.length}`);
    
    if (successful.length > 0) {
      const countryStats = {};
      successful.forEach(p => {
        const country = formatCountryName(p.realCountry, p.location?.country);
        countryStats[country] = (countryStats[country] || 0) + 1;
      });
      
      console.log('检测到的国家分布:', Object.entries(countryStats)
        .map(([country, count]) => `${country}: ${count}`)
        .join(', '));
    }
    
    if (failed.length > 0) {
      console.log('失败的节点:', failed.map(p => p.name).slice(0, 5).join(', ') + 
        (failed.length > 5 ? `... 等${failed.length}个` : ''));
    }
    
    return results;
    
  } catch (error) {
    console.error('批量处理过程中出错:', error);
    return config.fallback ? proxies : [];
  }
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
  console.log('\n=== IP地理位置检测脚本配置 ===');
  console.log(`API服务: ${config.api} (${ipServices[config.api]?.name})`);
  console.log(`请求限制: ${ipServices[config.api]?.limit}`);
  console.log(`输出格式: ${config.format}`);
  console.log(`超时时间: ${config.timeout}ms`);
  console.log(`并发数量: ${config.concurrent}`);
  console.log(`重试次数: ${config.retries}`);
  console.log(`失败保留: ${config.fallback}`);
  if (config.prefix) console.log(`节点前缀: "${config.prefix}"`);
  
  console.log('\n=== 支持的API服务 ===');
  Object.entries(ipServices).forEach(([key, service]) => {
    console.log(`${key}: ${service.name} - ${service.limit}`);
  });
  
  console.log('\n=== 使用示例 ===');
  console.log('基础使用: script.js');
  console.log('完整配置: script.js#api=ip-api&format=flag&timeout=5000&concurrent=3&prefix=✅');
}

// 调试模式
if (inArg.debug || inArg.help) {
  showConfig();
}
