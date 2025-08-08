/**
 * 代理服务器真实IP国别检测脚本
 * 用于 Sub-Store 自动检测代理节点的真实出口IP所在国家
 * 
 * 使用方法：
 * 1. 在 Sub-Store 中添加此脚本作为节点操作
 * 2. 支持参数：
 *    - timeout=5000: 请求超时时间（毫秒）
 *    - concurrent=5: 并发检测数量
 *    - api=ipapi: IP查询API服务商
 *    - format=flag: 输出格式（flag/zh/en）
 *    - prefix=: 节点名前缀
 * 
 * 示例URL: script.js#timeout=10000&concurrent=3&format=zh&prefix=✅
 */

// 获取参数
const inArg = $arguments || {};
const timeout = parseInt(inArg.timeout) || 8000;
const concurrent = parseInt(inArg.concurrent) || 5;
const apiService = inArg.api || 'ipapi';
const outputFormat = inArg.format || 'flag';
const prefix = inArg.prefix || '';

// 国家代码映射
const countryMaps = {
  flags: {
    'CN': '🇨🇳', 'HK': '🇭🇰', 'TW': '🇹🇼', 'JP': '🇯🇵', 'KR': '🇰🇷',
    'SG': '🇸🇬', 'US': '🇺🇸', 'GB': '🇬🇧', 'FR': '🇫🇷', 'DE': '🇩🇪',
    'AU': '🇦🇺', 'CA': '🇨🇦', 'RU': '🇷🇺', 'IN': '🇮🇳', 'BR': '🇧🇷',
    'IT': '🇮🇹', 'ES': '🇪🇸', 'NL': '🇳🇱', 'SE': '🇸🇪', 'CH': '🇨🇭',
    'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮', 'BE': '🇧🇪', 'AT': '🇦🇹',
    'IE': '🇮🇪', 'PT': '🇵🇹', 'GR': '🇬🇷', 'CZ': '🇨🇿', 'PL': '🇵🇱'
  },
  chinese: {
    'CN': '中国', 'HK': '香港', 'TW': '台湾', 'JP': '日本', 'KR': '韩国',
    'SG': '新加坡', 'US': '美国', 'GB': '英国', 'FR': '法国', 'DE': '德国',
    'AU': '澳大利亚', 'CA': '加拿大', 'RU': '俄罗斯', 'IN': '印度', 'BR': '巴西',
    'IT': '意大利', 'ES': '西班牙', 'NL': '荷兰', 'SE': '瑞典', 'CH': '瑞士',
    'NO': '挪威', 'DK': '丹麦', 'FI': '芬兰', 'BE': '比利时', 'AT': '奥地利',
    'IE': '爱尔兰', 'PT': '葡萄牙', 'GR': '希腊', 'CZ': '捷克', 'PL': '波兰'
  },
  english: {
    'CN': 'China', 'HK': 'Hong Kong', 'TW': 'Taiwan', 'JP': 'Japan', 'KR': 'Korea',
    'SG': 'Singapore', 'US': 'United States', 'GB': 'United Kingdom', 'FR': 'France', 'DE': 'Germany',
    'AU': 'Australia', 'CA': 'Canada', 'RU': 'Russia', 'IN': 'India', 'BR': 'Brazil',
    'IT': 'Italy', 'ES': 'Spain', 'NL': 'Netherlands', 'SE': 'Sweden', 'CH': 'Switzerland',
    'NO': 'Norway', 'DK': 'Denmark', 'FI': 'Finland', 'BE': 'Belgium', 'AT': 'Austria',
    'IE': 'Ireland', 'PT': 'Portugal', 'GR': 'Greece', 'CZ': 'Czech', 'PL': 'Poland'
  }
};

// IP查询API配置
const ipApis = {
  ipapi: {
    url: 'http://ip-api.com/json/',
    parseResponse: (data) => ({
      country: data.country,
      countryCode: data.countryCode,
      region: data.regionName,
      city: data.city,
      isp: data.isp
    })
  },
  ipinfo: {
    url: 'https://ipinfo.io/',
    parseResponse: (data) => ({
      country: data.country_name || data.country,
      countryCode: data.country,
      region: data.region,
      city: data.city,
      isp: data.org
    })
  },
  ipgeolocation: {
    url: 'https://api.ipgeolocation.io/ipgeo',
    parseResponse: (data) => ({
      country: data.country_name,
      countryCode: data.country_code2,
      region: data.state_prov,
      city: data.city,
      isp: data.isp
    })
  }
};

/**
 * 检测单个代理的真实IP国别
 * @param {Object} proxy 代理配置对象
 * @returns {Promise<Object>} 包含检测结果的代理对象
 */
async function detectProxyCountry(proxy) {
  try {
    console.log(`开始检测节点: ${proxy.name}`);
    
    // 模拟通过代理获取IP信息
    // 注意：这里需要根据实际环境调整实现方式
    const ipInfo = await getProxyIP(proxy);
    
    if (!ipInfo || !ipInfo.countryCode) {
      console.log(`节点 ${proxy.name} 检测失败`);
      return { ...proxy, detectionFailed: true };
    }
    
    // 格式化国家名称
    const countryName = formatCountryName(ipInfo.countryCode, ipInfo.country);
    const originalName = proxy.name;
    
    // 更新节点名称
    proxy.name = buildNewNodeName(originalName, countryName, ipInfo);
    proxy.realCountry = ipInfo.countryCode;
    proxy.realCountryName = ipInfo.country;
    proxy.detectedIP = ipInfo.ip;
    
    console.log(`节点 ${originalName} 检测完成，真实位置: ${countryName}`);
    return proxy;
    
  } catch (error) {
    console.error(`检测节点 ${proxy.name} 时出错:`, error.message);
    return { ...proxy, detectionFailed: true, error: error.message };
  }
}

/**
 * 通过代理获取出口IP信息
 * @param {Object} proxy 代理配置
 * @returns {Promise<Object>} IP地理信息
 */
async function getProxyIP(proxy) {
  const api = ipApis[apiService];
  if (!api) {
    throw new Error(`不支持的API服务: ${apiService}`);
  }
  
  // 这里是关键部分：需要通过代理发送请求
  // 在Sub-Store环境中，可能需要使用特定的方法来通过代理发送请求
  
  try {
    // 方案1: 使用Sub-Store的内置方法（如果支持）
    // const response = await $httpClient.get({
    //   url: api.url,
    //   proxy: proxy,
    //   timeout: timeout
    // });
    
    // 方案2: 构造代理URL（适用于HTTP代理）
    // const proxyUrl = buildProxyUrl(proxy);
    // const response = await fetch(api.url, {
    //   method: 'GET',
    //   proxy: proxyUrl,
    //   timeout: timeout
    // });
    
    // 方案3: 模拟实现（演示用）
    const response = await simulateProxyRequest(api.url, proxy);
    
    const data = typeof response === 'string' ? JSON.parse(response) : response;
    const ipInfo = api.parseResponse(data);
    
    return {
      ip: data.query || data.ip,
      ...ipInfo
    };
    
  } catch (error) {
    throw new Error(`IP查询失败: ${error.message}`);
  }
}

/**
 * 模拟通过代理请求（演示用）
 * 实际使用时需要替换为真实的代理请求实现
 */
async function simulateProxyRequest(url, proxy) {
  // 这里应该是真实的代理请求实现
  // 目前返回模拟数据
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 模拟不同的检测结果
      const mockResults = [
        { query: '1.1.1.1', country: 'United States', countryCode: 'US', city: 'Los Angeles' },
        { query: '8.8.8.8', country: 'Japan', countryCode: 'JP', city: 'Tokyo' },
        { query: '4.4.4.4', country: 'Singapore', countryCode: 'SG', city: 'Singapore' },
        { query: '2.2.2.2', country: 'Hong Kong', countryCode: 'HK', city: 'Hong Kong' }
      ];
      
      const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)];
      resolve(randomResult);
    }, Math.random() * 2000 + 1000); // 模拟1-3秒的检测时间
  });
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
  
  const map = maps[outputFormat];
  
  if (outputFormat === 'code') {
    return countryCode;
  }
  
  return map?.[countryCode] || countryName || countryCode;
}

/**
 * 构建新的节点名称
 * @param {string} originalName 原始名称
 * @param {string} countryName 国家名称
 * @param {Object} ipInfo IP信息
 * @returns {string} 新的节点名称
 */
function buildNewNodeName(originalName, countryName, ipInfo) {
  // 移除原有的国家标识
  let cleanName = originalName
    .replace(/^(🇨🇳|🇭🇰|🇹🇼|🇯🇵|🇰🇷|🇸🇬|🇺🇸|🇬🇧|🇫🇷|🇩🇪|🇦🇺|🇨🇦|🇷🇺|🇮🇳|🇧🇷)\s?/, '')
    .replace(/^(中国|香港|台湾|日本|韩国|新加坡|美国|英国|法国|德国|澳大利亚|加拿大|俄罗斯|印度|巴西)\s?/, '')
    .replace(/^(China|Hong Kong|Taiwan|Japan|Korea|Singapore|United States|United Kingdom|France|Germany|Australia|Canada|Russia|India|Brazil)\s?/i, '')
    .replace(/^(CN|HK|TW|JP|KR|SG|US|GB|FR|DE|AU|CA|RU|IN|BR)\s?/i, '');
  
  // 构建新名称
  const parts = [prefix, countryName, cleanName].filter(part => part && part.trim());
  return parts.join(' ').trim();
}

/**
 * 并发检测多个代理
 * @param {Array} proxies 代理列表
 * @returns {Promise<Array>} 检测结果
 */
async function detectProxiesConcurrently(proxies) {
  const results = [];
  const total = proxies.length;
  
  console.log(`开始检测 ${total} 个节点，并发数: ${concurrent}`);
  
  for (let i = 0; i < total; i += concurrent) {
    const batch = proxies.slice(i, i + concurrent);
    
    console.log(`正在检测第 ${i + 1}-${Math.min(i + concurrent, total)} 个节点...`);
    
    const batchPromises = batch.map(proxy => 
      detectProxyCountry(proxy).catch(error => ({
        ...proxy,
        detectionFailed: true,
        error: error.message
      }))
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // 避免请求过于频繁
    if (i + concurrent < total) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

/**
 * 主处理函数
 * @param {Array} proxies 代理列表
 * @returns {Array} 处理后的代理列表
 */
async function operator(proxies) {
  if (!Array.isArray(proxies) || proxies.length === 0) {
    console.log('没有可检测的节点');
    return proxies;
  }
  
  console.log(`开始IP国别检测，共 ${proxies.length} 个节点`);
  
  try {
    const results = await detectProxiesConcurrently(proxies);
    
    // 统计检测结果
    const successful = results.filter(p => !p.detectionFailed);
    const failed = results.filter(p => p.detectionFailed);
    
    console.log(`检测完成！成功: ${successful.length}, 失败: ${failed.length}`);
    
    if (failed.length > 0) {
      console.log('检测失败的节点:', failed.map(p => p.name).join(', '));
    }
    
    return results;
    
  } catch (error) {
    console.error('批量检测过程中出错:', error);
    return proxies;
  }
}

// 导出主函数（Sub-Store需要）
// 注意：实际使用时可能需要根据Sub-Store的要求调整导出方式
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { operator };
}
