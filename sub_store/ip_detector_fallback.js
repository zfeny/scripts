/**
 * IP地理位置检测脚本 - 适用于Sub-Store (简化版本)
 * 由于Sub-Store环境限制，暂时使用硬编码IP范围进行检测
 * 
 * 支持参数：
 * - format: 输出格式 (flag, zh, en, code)  
 * - prefix: 节点名前缀
 * - fallback: 检测失败时是否保留原节点
 * 
 * 使用示例：
 * script.js#format=flag&prefix=✅
 * 
 * 作者: Assistant
 * 版本: 4.1 (Sub-Store兼容版本)
 */

const inArg = $arguments || {};

// 配置参数
const config = {
  format: inArg.format || 'flag',
  prefix: inArg.prefix || '✅',
  fallback: inArg.fallback !== 'false'
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

// 常见IP地址段映射（临时解决方案）
const ipRanges = {
  // 中国大陆
  'CN': [
    '1.0.0.0/8', '14.0.0.0/8', '27.0.0.0/8', '36.0.0.0/8',
    '39.0.0.0/8', '42.0.0.0/8', '49.0.0.0/8', '58.0.0.0/8',
    '59.0.0.0/8', '60.0.0.0/8', '61.0.0.0/8', '110.0.0.0/8',
    '111.0.0.0/8', '112.0.0.0/8', '113.0.0.0/8', '114.0.0.0/8',
    '115.0.0.0/8', '116.0.0.0/8', '117.0.0.0/8', '118.0.0.0/8',
    '119.0.0.0/8', '120.0.0.0/8', '121.0.0.0/8', '122.0.0.0/8',
    '123.0.0.0/8', '124.0.0.0/8', '125.0.0.0/8'
  ],
  // 香港
  'HK': [
    '103.0.0.0/8', '202.0.0.0/8', '203.0.0.0/8'
  ],
  // 台湾
  'TW': [
    '140.0.0.0/8', '163.0.0.0/8', '168.0.0.0/8'
  ],
  // 新加坡
  'SG': [
    '152.0.0.0/8', '165.0.0.0/8'
  ],
  // 日本
  'JP': [
    '126.0.0.0/8', '133.0.0.0/8', '153.0.0.0/8', '210.0.0.0/8'
  ],
  // 韩国
  'KR': [
    '211.0.0.0/8', '175.0.0.0/8'
  ],
  // 美国
  'US': [
    '8.0.0.0/8', '23.0.0.0/8', '35.0.0.0/8', '50.0.0.0/8',
    '63.0.0.0/8', '64.0.0.0/8', '65.0.0.0/8', '66.0.0.0/8',
    '67.0.0.0/8', '68.0.0.0/8', '69.0.0.0/8', '70.0.0.0/8',
    '71.0.0.0/8', '72.0.0.0/8', '73.0.0.0/8', '74.0.0.0/8',
    '75.0.0.0/8', '76.0.0.0/8', '98.0.0.0/8', '99.0.0.0/8',
    '173.0.0.0/8', '174.0.0.0/8', '184.0.0.0/8', '204.0.0.0/8'
  ]
};

/**
 * 从节点配置中提取IP地址
 * @param {Object} proxy 代理节点配置
 * @returns {string|null} IP地址或null
 */
function extractIPFromProxy(proxy) {
  const server = proxy.server || proxy.hostname || proxy.host;
  
  if (!server) return null;
  
  // 检查是否为IP地址（IPv4）
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(server)) {
    return server;
  }
  
  return null; // 不处理域名和IPv6
}

/**
 * 检查IP是否在指定的CIDR范围内
 * @param {string} ip IP地址
 * @param {string} cidr CIDR格式的网络地址
 * @returns {boolean} 是否在范围内
 */
function isIPInCIDR(ip, cidr) {
  const [network, prefixLength] = cidr.split('/');
  const prefix = parseInt(prefixLength);
  
  // 将IP地址转换为32位整数
  function ipToInt(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
  }
  
  const ipInt = ipToInt(ip);
  const networkInt = ipToInt(network);
  const mask = (0xFFFFFFFF << (32 - prefix)) >>> 0;
  
  return (ipInt & mask) === (networkInt & mask);
}

/**
 * 根据IP地址查找国家代码
 * @param {string} ip IP地址
 * @returns {Object|null} 地理位置信息
 */
function detectLocationFromIP(ip) {
  console.log(`🔍 检查IP ${ip} 的地理位置...`);
  
  for (const [countryCode, ranges] of Object.entries(ipRanges)) {
    for (const range of ranges) {
      if (isIPInCIDR(ip, range)) {
        console.log(`✅ IP ${ip} 匹配到 ${countryCode} 范围: ${range}`);
        return {
          ip: ip,
          countryCode: countryCode,
          country: countryMaps.english[countryCode] || countryCode,
          method: 'ip-range'
        };
      }
    }
  }
  
  console.log(`❌ IP ${ip} 未匹配到任何已知范围`);
  return null;
}

/**
 * 根据域名推测地理位置
 * @param {string} domain 域名
 * @returns {Object|null} 地理位置信息
 */
function detectLocationFromDomain(domain) {
  if (!domain) return null;
  
  const lowerDomain = domain.toLowerCase();
  
  // 常见地理标识域名
  const domainPatterns = {
    'SG': ['sg', 'singapore', 'sgp'],
    'HK': ['hk', 'hongkong', 'hong-kong'],
    'TW': ['tw', 'taiwan', 'taipei'],
    'JP': ['jp', 'japan', 'tokyo', 'osaka'],
    'KR': ['kr', 'korea', 'seoul'],
    'US': ['us', 'usa', 'america', 'ny', 'la', 'sf', 'miami'],
    'GB': ['uk', 'britain', 'london'],
    'DE': ['de', 'germany', 'frankfurt'],
    'CA': ['ca', 'canada', 'toronto'],
    'AU': ['au', 'australia', 'sydney']
  };
  
  for (const [countryCode, patterns] of Object.entries(domainPatterns)) {
    for (const pattern of patterns) {
      if (lowerDomain.includes(pattern)) {
        console.log(`🌐 域名 ${domain} 包含地理标识: ${pattern} -> ${countryCode}`);
        return {
          domain: domain,
          countryCode: countryCode,
          country: countryMaps.english[countryCode] || countryCode,
          method: 'domain'
        };
      }
    }
  }
  
  return null;
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
  
  console.log(`=== IP地理位置检测开始 (Sub-Store兼容版本) ===`);
  console.log(`输入节点数量: ${proxies.length}`);
  console.log(`配置: 格式=${config.format}, 前缀="${config.prefix}"`);
  console.log(`检测方法: IP范围匹配 + 域名推测`);
  
  const results = proxies.map((proxy, index) => {
    try {
      console.log(`处理节点 ${index + 1}: ${proxy.name}`);
      
      const server = proxy.server || proxy.hostname || proxy.host;
      if (!server) {
        console.log(`❌ 节点 ${proxy.name} 无服务器地址`);
        proxy.name = `❌ ${proxy.name}`;
        return proxy;
      }
      
      let locationInfo = null;
      
      // 首先尝试IP地址检测
      const ip = extractIPFromProxy(proxy);
      if (ip) {
        console.log(`📍 提取到IP: ${ip}`);
        locationInfo = detectLocationFromIP(ip);
        if (locationInfo) {
          locationInfo.detectionMethod = 'ip-range';
        }
      }
      
      // 如果IP检测失败，尝试域名检测
      if (!locationInfo) {
        console.log(`🌐 尝试域名检测: ${server}`);
        locationInfo = detectLocationFromDomain(server);
        if (locationInfo) {
          locationInfo.detectionMethod = 'domain';
        }
      }
      
      if (locationInfo) {
        const originalName = proxy.name;
        proxy.name = buildNewNodeName(originalName, locationInfo);
        proxy.realCountry = locationInfo.countryCode;
        proxy.realIP = ip || server;
        proxy.location = locationInfo;
        proxy.detectionMethod = locationInfo.detectionMethod;
        
        console.log(`🎯 检测成功: ${originalName} -> ${proxy.name} (${locationInfo.detectionMethod})`);
        return proxy;
      } else {
        console.log(`❌ 无法检测节点 ${proxy.name} 的地理位置`);
        proxy.name = `❌ ${proxy.name}`;
        return proxy;
      }
      
    } catch (error) {
      console.error(`❌ 处理节点 ${proxy.name} 时出错: ${error.message}`);
      proxy.name = `❌ ${proxy.name}`;
      return proxy;
    }
  });
  
  const successCount = results.filter(proxy => proxy.detectionMethod).length;
  const errorCount = results.length - successCount;
  const ipRangeCount = results.filter(proxy => proxy.detectionMethod === 'ip-range').length;
  const domainCount = results.filter(proxy => proxy.detectionMethod === 'domain').length;
  
  console.log(`=== 检测完成 ===`);
  console.log(`总计节点: ${results.length}`);
  console.log(`成功: ${successCount} (IP范围: ${ipRangeCount}, 域名: ${domainCount})`);
  console.log(`失败: ${errorCount}`);
  console.log(`成功率: ${(successCount / results.length * 100).toFixed(1)}%`);
  
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
  console.log('\n=== IP地理位置检测脚本配置 (Sub-Store兼容版本) ===');
  console.log(`输出格式: ${config.format}`);
  console.log(`失败保留: ${config.fallback}`);
  if (config.prefix) console.log(`节点前缀: "${config.prefix}"`);
  
  console.log('\n=== 检测方法 ===');
  console.log('✅ IP地址范围匹配 (hardcoded ranges)');
  console.log('✅ 域名地理标识推测');
  console.log('❌ 不支持实时API查询 (Sub-Store环境限制)');
  
  console.log('\n=== 使用示例 ===');
  console.log('基础使用: script.js');
  console.log('完整配置: script.js#format=flag&prefix=✅');
}

// 调试模式
if (inArg.debug || inArg.help) {
  showConfig();
}
