/**
 * IP地理位置检测脚本 - Sub-Store远程脚本专用版本
 * 由于远程脚本环境限制，使用简化的检测方法
 * 
 * 支持参数：
 * - format: 输出格式 (flag, zh, en, code)  
 * - prefix: 节点名前缀
 * 
 * 使用示例：
 * script.js#format=flag&prefix=✅
 * 
 * 作者: Assistant
 * 版本: 4.2 (远程脚本简化版本)
 */

// 获取参数，避免变量冲突
const scriptParameters = (function() {
  try {
    return typeof $arguments !== 'undefined' ? $arguments : {};
  } catch (e) {
    return {};
  }
})();

// 配置参数
const scriptConfig = {
  format: scriptParameters.format || 'flag',
  prefix: scriptParameters.prefix || '✅',
  fallback: scriptParameters.fallback !== 'false'
};

// 国家名称映射
const countryMapping = {
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

// 简化的IP范围检测（常见地区）
const ipRangeDetection = {
  // 中国大陆常见IP段
  'CN': ['1.', '14.', '27.', '36.', '39.', '42.', '49.', '58.', '59.', '60.', '61.', '110.', '111.', '112.', '113.', '114.', '115.', '116.', '117.', '118.', '119.', '120.', '121.', '122.', '123.', '124.', '125.'],
  // 香港常见IP段
  'HK': ['103.', '202.', '203.'],
  // 台湾常见IP段  
  'TW': ['140.', '163.', '168.'],
  // 新加坡常见IP段
  'SG': ['152.', '165.'],
  // 日本常见IP段
  'JP': ['126.', '133.', '153.', '210.'],
  // 韩国常见IP段
  'KR': ['211.', '175.'],
  // 美国常见IP段
  'US': ['8.', '23.', '35.', '50.', '63.', '64.', '65.', '66.', '67.', '68.', '69.', '70.', '71.', '72.', '73.', '74.', '75.', '76.', '98.', '99.', '173.', '174.', '184.', '204.']
};

/**
 * 从节点配置中提取IP地址
 */
function getServerIP(proxy) {
  const server = proxy.server || proxy.hostname || proxy.host;
  if (!server) return null;
  
  // 检查是否为IPv4地址
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Pattern.test(server)) {
    return server;
  }
  
  return null; // 不处理域名
}

/**
 * 简单的IP地理位置检测
 */
function detectIPLocation(ip) {
  if (!ip) return null;
  
  console.log(`🔍 检测IP ${ip} 的地理位置...`);
  
  // 检查IP前缀
  for (const [countryCode, prefixes] of Object.entries(ipRangeDetection)) {
    for (const prefix of prefixes) {
      if (ip.startsWith(prefix)) {
        console.log(`✅ IP ${ip} 匹配到 ${countryCode} (前缀: ${prefix})`);
        return {
          ip: ip,
          countryCode: countryCode,
          country: countryMapping.english[countryCode] || countryCode,
          method: 'ip-prefix'
        };
      }
    }
  }
  
  console.log(`❌ IP ${ip} 未匹配到任何已知地区`);
  return null;
}

/**
 * 域名地理位置推测
 */
function detectDomainLocation(domain) {
  if (!domain) return null;
  
  const lowerDomain = domain.toLowerCase();
  
  // 常见地理标识
  const geoPatterns = {
    'SG': ['sg', 'singapore'],
    'HK': ['hk', 'hongkong', 'hong-kong'], 
    'TW': ['tw', 'taiwan', 'taipei'],
    'JP': ['jp', 'japan', 'tokyo', 'osaka'],
    'KR': ['kr', 'korea', 'seoul'],
    'US': ['us', 'usa', 'america', 'ny', 'la', 'sf'],
    'GB': ['uk', 'britain', 'london'],
    'DE': ['de', 'germany', 'frankfurt'],
    'CA': ['ca', 'canada', 'toronto'],
    'AU': ['au', 'australia', 'sydney']
  };
  
  for (const [countryCode, patterns] of Object.entries(geoPatterns)) {
    for (const pattern of patterns) {
      if (lowerDomain.includes(pattern)) {
        console.log(`🌐 域名 ${domain} 包含地理标识: ${pattern} -> ${countryCode}`);
        return {
          domain: domain,
          countryCode: countryCode,
          country: countryMapping.english[countryCode] || countryCode,
          method: 'domain'
        };
      }
    }
  }
  
  return null;
}

/**
 * 格式化国家名称
 */
function formatCountry(countryCode, countryName) {
  const maps = {
    'flag': countryMapping.flags,
    'zh': countryMapping.chinese,
    'en': countryMapping.english,
    'code': null
  };
  
  const map = maps[scriptConfig.format];
  
  if (scriptConfig.format === 'code') {
    return countryCode || 'XX';
  }
  
  return map?.[countryCode] || countryName || countryCode || '未知';
}

/**
 * 构建新的节点名称
 */
function buildNodeName(originalName, locationInfo) {
  const countryName = formatCountry(locationInfo.countryCode, locationInfo.country);
  
  // 清理原名称
  let cleanName = originalName
    .replace(/^(🇨🇳|🇭🇰|🇹🇼|🇲🇴|🇯🇵|🇰🇷|🇸🇬|🇺🇸|🇬🇧|🇫🇷|🇩🇪|🇦🇺|🇨🇦|🇷🇺|🇮🇳|🇧🇷|🇮🇹|🇪🇸|🇳🇱|🇸🇪|🇳🇴|🇨🇭|🇦🇹|🇧🇪|🇩🇰|🇫🇮|🇮🇪|🇵🇹|🇬🇷|🇺🇦|🇵🇱|🇨🇿|🇳🇿|🇹🇭|🇻🇳|🇮🇩|🇵🇭|🇹🇷|🇦🇪|🇸🇦|🇮🇱|🇪🇬|🇿🇦|🇰🇪|🇳🇬|🇦🇷|🇲🇾)\s*/, '')
    .replace(/^(中国|香港|台湾|澳门|日本|韩国|新加坡|美国|英国|法国|德国|澳大利亚|加拿大|俄罗斯|印度|巴西|意大利|西班牙|荷兰|瑞典|挪威|瑞士|奥地利|比利时|丹麦|芬兰|爱尔兰|葡萄牙|希腊|乌克兰|波兰|捷克|新西兰|泰国|越南|印尼|菲律宾|土耳其|阿联酋|沙特|以色列|埃及|南非|肯尼亚|尼日利亚|阿根廷|马来西亚)\s*/, '')
    .replace(/^(CN|HK|TW|MO|JP|KR|SG|US|GB|FR|DE|AU|CA|RU|IN|BR|IT|ES|NL|SE|NO|CH|AT|BE|DK|FI|IE|PT|GR|UA|PL|CZ|NZ|TH|VN|ID|PH|TR|AE|SA|IL|EG|ZA|KE|NG|AR|MY)\s*/i, '')
    .replace(/^(✅\s*|❌\s*|已检测\s*)/, '')
    .trim();
  
  if (!cleanName) {
    cleanName = originalName.replace(/^(🇨🇳|🇭🇰|🇹🇼|🇲🇴|🇯🇵|🇰🇷|🇸🇬|🇺🇸|🇬🇧|🇫🇷|🇩🇪|🇦🇺|🇨🇦|🇷🇺|🇮🇳|🇧🇷|🇮🇹|🇪🇸|🇳🇱|🇸🇪|🇳🇴|🇨🇭|🇦🇹|🇧🇪|🇩🇰|🇫🇮|🇮🇪|🇵🇹|🇬🇷|🇺🇦|🇵🇱|🇨🇿|🇳🇿|🇹🇭|🇻🇳|🇮🇩|🇵🇭|🇹🇷|🇦🇪|🇸🇦|🇮🇱|🇪🇬|🇿🇦|🇰🇪|🇳🇬|🇦🇷|🇲🇾)\s*/, '').trim();
  }
  
  // 构建新名称
  const parts = [scriptConfig.prefix, countryName, cleanName].filter(part => part && part.trim());
  return parts.join(' ').trim();
}

/**
 * 主处理函数 - Sub-Store入口点
 */
function operator(proxies) {
  if (!Array.isArray(proxies) || proxies.length === 0) {
    console.log('❌ 没有可处理的代理节点');
    return proxies;
  }
  
  console.log(`=== IP地理位置检测开始 (远程脚本简化版本) ===`);
  console.log(`输入节点数量: ${proxies.length}`);
  console.log(`配置: 格式=${scriptConfig.format}, 前缀="${scriptConfig.prefix}"`);
  console.log(`检测方法: IP前缀匹配 + 域名推测`);
  
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
      
      // 尝试IP检测
      const ip = getServerIP(proxy);
      if (ip) {
        console.log(`📍 提取到IP: ${ip}`);
        locationInfo = detectIPLocation(ip);
      }
      
      // 如果IP检测失败，尝试域名检测
      if (!locationInfo) {
        console.log(`🌐 尝试域名检测: ${server}`);
        locationInfo = detectDomainLocation(server);
      }
      
      if (locationInfo) {
        const originalName = proxy.name;
        proxy.name = buildNodeName(originalName, locationInfo);
        proxy.realCountry = locationInfo.countryCode;
        proxy.realIP = ip || server;
        proxy.location = locationInfo;
        proxy.detectionMethod = locationInfo.method;
        
        console.log(`🎯 检测成功: ${originalName} -> ${proxy.name} (${locationInfo.method})`);
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
  const ipCount = results.filter(proxy => proxy.detectionMethod === 'ip-prefix').length;
  const domainCount = results.filter(proxy => proxy.detectionMethod === 'domain').length;
  
  console.log(`=== 检测完成 ===`);
  console.log(`总计: ${results.length}, 成功: ${successCount} (IP: ${ipCount}, 域名: ${domainCount}), 失败: ${errorCount}`);
  console.log(`成功率: ${(successCount / results.length * 100).toFixed(1)}%`);
  
  return results;
}

// 配置信息
function showScriptConfig() {
  console.log('\n=== 远程脚本配置信息 ===');
  console.log(`输出格式: ${scriptConfig.format}`);
  console.log(`节点前缀: "${scriptConfig.prefix}"`);
  console.log(`失败保留: ${scriptConfig.fallback}`);
  
  console.log('\n=== 检测方法 ===');
  console.log('✅ IP前缀匹配 (简化版本)');
  console.log('✅ 域名地理标识推测');
  console.log('❌ 不支持实时API查询 (远程脚本环境限制)');
  
  console.log('\n=== 使用示例 ===');
  console.log('基础: script.js');
  console.log('完整: script.js#format=flag&prefix=✅');
}

// 调试模式
if (scriptParameters.debug || scriptParameters.help) {
  showScriptConfig();
}

// 导出 - 兼容多种环境
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { operator };
}

if (typeof global !== 'undefined') {
  global.operator = operator;
}
