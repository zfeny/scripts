/**
 * Sub-Store IP检测脚本 - 简化版本
 * 适用于Sub-Store环境的IP地理位置检测
 * 
 * 参数说明：
 * format: 输出格式 (flag, zh, en)
 * prefix: 前缀文字
 * 
 * 使用方法：
 * script.js#format=flag&prefix=✅
 */

// 获取参数
const params = $arguments || {};
const outputFormat = params.format || 'flag';
const prefix = params.prefix ? decodeURIComponent(params.prefix) : '';

// 国家映射
const countryMap = {
  flags: {
    'SG': '🇸🇬', 'HK': '🇭🇰', 'TW': '🇹🇼', 'JP': '🇯🇵', 'KR': '🇰🇷',
    'US': '🇺🇸', 'CA': '🇨🇦', 'GB': '🇬🇧', 'FR': '🇫🇷', 'DE': '🇩🇪',
    'AU': '🇦🇺', 'RU': '🇷🇺', 'CN': '🇨🇳', 'IN': '🇮🇳', 'BR': '🇧🇷'
  },
  chinese: {
    'SG': '新加坡', 'HK': '香港', 'TW': '台湾', 'JP': '日本', 'KR': '韩国',
    'US': '美国', 'CA': '加拿大', 'GB': '英国', 'FR': '法国', 'DE': '德国',
    'AU': '澳大利亚', 'RU': '俄罗斯', 'CN': '中国', 'IN': '印度', 'BR': '巴西'
  },
  english: {
    'SG': 'Singapore', 'HK': 'Hong Kong', 'TW': 'Taiwan', 'JP': 'Japan', 'KR': 'Korea',
    'US': 'United States', 'CA': 'Canada', 'GB': 'United Kingdom', 'FR': 'France', 'DE': 'Germany',
    'AU': 'Australia', 'RU': 'Russia', 'CN': 'China', 'IN': 'India', 'BR': 'Brazil'
  }
};

/**
 * 从代理配置提取IP地址
 */
function getIP(proxy) {
  const server = proxy.server || proxy.hostname || proxy.host || '';
  
  // 检查是否为IPv4地址
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(server)) {
    return server;
  }
  
  return null; // 域名返回null
}

/**
 * 根据IP判断国家（简化版本）
 */
function detectCountry(ip) {
  if (!ip) return null;
  
  // 根据IP段简单判断（实际应该调用API）
  const parts = ip.split('.');
  const first = parseInt(parts[0]);
  const second = parseInt(parts[1]);
  
  // 常见的IP段判断
  if (ip.startsWith('154.')) return 'SG'; // 新加坡
  if (ip.startsWith('103.') || ip.startsWith('119.')) return 'HK'; // 香港
  if (ip.startsWith('45.') || ip.startsWith('104.')) return 'US'; // 美国
  if (ip.startsWith('126.') || ip.startsWith('133.')) return 'JP'; // 日本
  if (first >= 1 && first <= 40) return 'US';
  if (first >= 41 && first <= 80) return 'JP';
  if (first >= 81 && first <= 120) return 'HK';
  if (first >= 121 && first <= 160) return 'SG';
  if (first >= 161 && first <= 200) return 'KR';
  
  return 'US'; // 默认美国
}

/**
 * 格式化国家名称
 */
function formatCountry(countryCode) {
  if (outputFormat === 'flag') {
    return countryMap.flags[countryCode] || '🌍';
  } else if (outputFormat === 'zh') {
    return countryMap.chinese[countryCode] || '未知';
  } else {
    return countryMap.english[countryCode] || 'Unknown';
  }
}

/**
 * 清理节点名称中的地理标识
 */
function cleanNodeName(name) {
  return name
    .replace(/^(🇸🇬|🇭🇰|🇹🇼|🇯🇵|🇰🇷|🇺🇸|🇨🇦|🇬🇧|🇫🇷|🇩🇪|🇦🇺|🇷🇺|🇨🇳|🇮🇳|🇧🇷)\s*/, '')
    .replace(/^(新加坡|香港|台湾|日本|韩国|美国|加拿大|英国|法国|德国|澳大利亚|俄罗斯|中国|印度|巴西)\s*/, '')
    .replace(/^(Singapore|Hong Kong|Taiwan|Japan|Korea|United States|Canada|United Kingdom|France|Germany|Australia|Russia|China|India|Brazil)\s*/i, '')
    .replace(/^(SG|HK|TW|JP|KR|US|CA|GB|FR|DE|AU|RU|CN|IN|BR)\s*/i, '')
    .trim();
}

/**
 * 主处理函数
 */
function operator(proxies) {
  if (!Array.isArray(proxies)) {
    console.log('输入不是数组');
    return proxies;
  }
  
  console.log(`开始处理 ${proxies.length} 个节点`);
  console.log(`输出格式: ${outputFormat}, 前缀: "${prefix}"`);
  
  const results = proxies.map((proxy, index) => {
    const originalName = proxy.name || `节点${index + 1}`;
    console.log(`处理节点: ${originalName}`);
    
    try {
      const ip = getIP(proxy);
      
      if (!ip) {
        // 域名节点
        const serverName = proxy.server || proxy.hostname || proxy.host || '';
        console.log(`域名节点: ${serverName}`);
        
        // 尝试从域名推测位置
        let countryCode = 'US'; // 默认
        if (serverName.includes('sg') || serverName.includes('singapore')) countryCode = 'SG';
        else if (serverName.includes('hk') || serverName.includes('hongkong')) countryCode = 'HK';
        else if (serverName.includes('jp') || serverName.includes('japan') || serverName.includes('tokyo')) countryCode = 'JP';
        else if (serverName.includes('kr') || serverName.includes('korea') || serverName.includes('seoul')) countryCode = 'KR';
        
        const countryName = formatCountry(countryCode);
        const cleanName = cleanNodeName(originalName);
        
        const newName = [prefix, countryName, cleanName].filter(x => x).join(' ').trim();
        
        proxy.name = newName;
        proxy.detectedCountry = countryCode;
        proxy.detectionMethod = 'domain';
        
        console.log(`域名检测: ${originalName} -> ${newName}`);
        return proxy;
      }
      
      // IP节点
      console.log(`IP节点: ${ip}`);
      const countryCode = detectCountry(ip);
      const countryName = formatCountry(countryCode);
      const cleanName = cleanNodeName(originalName);
      
      const newName = [prefix, countryName, cleanName].filter(x => x).join(' ').trim();
      
      proxy.name = newName;
      proxy.detectedCountry = countryCode;
      proxy.detectedIP = ip;
      proxy.detectionMethod = 'ip';
      
      console.log(`IP检测: ${originalName} -> ${newName} (${ip})`);
      return proxy;
      
    } catch (error) {
      console.error(`处理节点 ${originalName} 时出错: ${error.message}`);
      proxy.name = `[错误] ${originalName}`;
      return proxy;
    }
  });
  
  console.log(`处理完成，共 ${results.length} 个节点`);
  
  // 统计结果
  const stats = {};
  results.forEach(proxy => {
    if (proxy.detectedCountry) {
      const country = formatCountry(proxy.detectedCountry);
      stats[country] = (stats[country] || 0) + 1;
    }
  });
  
  console.log('国家分布:', Object.entries(stats).map(([k, v]) => `${k}:${v}`).join(', '));
  
  return results;
}

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { operator };
}

// 调试输出
if (params.debug) {
  console.log('=== 调试信息 ===');
  console.log('参数:', JSON.stringify(params, null, 2));
  console.log('输出格式:', outputFormat);
  console.log('前缀:', prefix);
}
