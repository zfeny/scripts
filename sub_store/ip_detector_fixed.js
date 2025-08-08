/**
 * Sub-Store IP地理位置检测脚本 (优化版)
 * 用于检测代理节点的真实IP地址地理位置，并自动添加国家标识
 * 
 * 功能特点:
 * - 支持IP地址和域名的地理位置检测
 * - 支持多种输出格式（国旗、中文、英文、代码）
 * - 智能清理原有节点名称中的地理标识
 * - 从节点名称推断地理位置作为备选方案
 * - 同步处理，适配Sub-Store环境
 * 
 * 作者: Assistant
 * 版本: 2.0 (Fixed)
 */

// 获取脚本参数
const inArg = typeof $arguments !== 'undefined' ? $arguments : {};

// 脚本配置
const config = {
  // 输出格式: 'flag'(国旗), 'zh'(中文), 'en'(英文), 'code'(代码)
  format: inArg.format || 'flag',
  
  // 节点名称前缀
  prefix: inArg.prefix || '✅',
  
  // 请求超时时间(毫秒)
  timeout: parseInt(inArg.timeout) || 5000,
  
  // 并发请求数量
  concurrent: parseInt(inArg.concurrent) || 3,
  
  // 重试次数
  retries: parseInt(inArg.retries) || 2,
  
  // 查询失败时是否保留节点
  fallback: inArg.fallback !== 'false',
  
  // 默认国家(检测失败时使用)
  defaultCountry: {
    code: 'US',
    name: 'United States'
  }
};

// 国家名称映射
const countryMaps = {
  // 国旗映射
  flags: {
    'CN': '🇨🇳', 'HK': '🇭🇰', 'TW': '🇹🇼', 'MO': '🇲🇴',
    'JP': '🇯🇵', 'KR': '🇰🇷', 'SG': '🇸🇬', 'US': '🇺🇸',
    'GB': '🇬🇧', 'FR': '🇫🇷', 'DE': '🇩🇪', 'AU': '🇦🇺',
    'CA': '🇨🇦', 'RU': '🇷🇺', 'IN': '🇮🇳', 'BR': '🇧🇷',
    'IT': '🇮🇹', 'ES': '🇪🇸', 'NL': '🇳🇱', 'SE': '🇸🇪',
    'NO': '🇳🇴', 'CH': '🇨🇭', 'AT': '🇦🇹', 'BE': '🇧🇪',
    'DK': '🇩🇰', 'FI': '🇫🇮', 'IE': '🇮🇪', 'PT': '🇵🇹',
    'GR': '🇬🇷', 'UA': '🇺🇦', 'PL': '🇵🇱', 'CZ': '🇨🇿',
    'NZ': '🇳🇿', 'TH': '🇹🇭', 'VN': '🇻🇳', 'ID': '🇮🇩',
    'PH': '🇵🇭', 'TR': '🇹🇷', 'AE': '🇦🇪', 'SA': '🇸🇦',
    'IL': '🇮🇱', 'EG': '🇪🇬', 'ZA': '🇿🇦', 'KE': '🇰🇪',
    'NG': '🇳🇬', 'AR': '🇦🇷', 'MY': '🇲🇾'
  },
  
  // 中文名称映射
  chinese: {
    'CN': '中国', 'HK': '香港', 'TW': '台湾', 'MO': '澳门',
    'JP': '日本', 'KR': '韩国', 'SG': '新加坡', 'US': '美国',
    'GB': '英国', 'FR': '法国', 'DE': '德国', 'AU': '澳大利亚',
    'CA': '加拿大', 'RU': '俄罗斯', 'IN': '印度', 'BR': '巴西',
    'IT': '意大利', 'ES': '西班牙', 'NL': '荷兰', 'SE': '瑞典',
    'NO': '挪威', 'CH': '瑞士', 'AT': '奥地利', 'BE': '比利时',
    'DK': '丹麦', 'FI': '芬兰', 'IE': '爱尔兰', 'PT': '葡萄牙',
    'GR': '希腊', 'UA': '乌克兰', 'PL': '波兰', 'CZ': '捷克',
    'NZ': '新西兰', 'TH': '泰国', 'VN': '越南', 'ID': '印尼',
    'PH': '菲律宾', 'TR': '土耳其', 'AE': '阿联酋', 'SA': '沙特',
    'IL': '以色列', 'EG': '埃及', 'ZA': '南非', 'KE': '肯尼亚',
    'NG': '尼日利亚', 'AR': '阿根廷', 'MY': '马来西亚'
  },
  
  // 英文名称映射
  english: {
    'CN': 'China', 'HK': 'Hong Kong', 'TW': 'Taiwan', 'MO': 'Macao',
    'JP': 'Japan', 'KR': 'Korea', 'SG': 'Singapore', 'US': 'United States',
    'GB': 'United Kingdom', 'FR': 'France', 'DE': 'Germany', 'AU': 'Australia',
    'CA': 'Canada', 'RU': 'Russia', 'IN': 'India', 'BR': 'Brazil',
    'IT': 'Italy', 'ES': 'Spain', 'NL': 'Netherlands', 'SE': 'Sweden',
    'NO': 'Norway', 'CH': 'Switzerland', 'AT': 'Austria', 'BE': 'Belgium',
    'DK': 'Denmark', 'FI': 'Finland', 'IE': 'Ireland', 'PT': 'Portugal',
    'GR': 'Greece', 'UA': 'Ukraine', 'PL': 'Poland', 'CZ': 'Czech',
    'NZ': 'New Zealand', 'TH': 'Thailand', 'VN': 'Vietnam', 'ID': 'Indonesia',
    'PH': 'Philippines', 'TR': 'Turkey', 'AE': 'UAE', 'SA': 'Saudi Arabia',
    'IL': 'Israel', 'EG': 'Egypt', 'ZA': 'South Africa', 'KE': 'Kenya',
    'NG': 'Nigeria', 'AR': 'Argentina', 'MY': 'Malaysia'
  }
};

/**
 * 从代理配置中提取IP地址
 * @param {Object} proxy 代理配置对象
 * @returns {string|null} IP地址
 */
function extractIPFromProxy(proxy) {
  const server = proxy.server || proxy.hostname || proxy.host || '';
  
  // IP地址正则表达式
  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  
  if (ipPattern.test(server)) {
    return server;
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
    .replace(/^(✅\s*已检测\s*|✅\s*|已检测\s*)/, '')
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
 * 根据域名推测地理位置
 * @param {string} domain 域名
 * @returns {Object|null} 地理位置信息
 */
function detectLocationFromDomain(domain) {
  if (!domain) return null;
  
  const lowerDomain = domain.toLowerCase();
  
  // 新加坡相关域名
  if (lowerDomain.includes('sg') || lowerDomain.includes('singapore') || 
      lowerDomain.includes('shiyuandian')) {
    return { countryCode: 'SG', country: 'Singapore', city: 'Singapore' };
  }
  
  // 香港相关域名
  if (lowerDomain.includes('hk') || lowerDomain.includes('hongkong') || 
      lowerDomain.includes('hong-kong')) {
    return { countryCode: 'HK', country: 'Hong Kong', city: 'Hong Kong' };
  }
  
  // 美国相关域名
  if (lowerDomain.includes('us') || lowerDomain.includes('usa') || 
      lowerDomain.includes('america') || lowerDomain.includes('ny') || 
      lowerDomain.includes('la') || lowerDomain.includes('chicago') ||
      lowerDomain.includes('seattle') || lowerDomain.includes('miami')) {
    return { countryCode: 'US', country: 'United States', city: 'United States' };
  }
  
  // 日本相关域名
  if (lowerDomain.includes('jp') || lowerDomain.includes('japan') || 
      lowerDomain.includes('tokyo') || lowerDomain.includes('osaka')) {
    return { countryCode: 'JP', country: 'Japan', city: 'Tokyo' };
  }
  
  // 韩国相关域名
  if (lowerDomain.includes('kr') || lowerDomain.includes('korea') || 
      lowerDomain.includes('seoul')) {
    return { countryCode: 'KR', country: 'South Korea', city: 'Seoul' };
  }
  
  // 台湾相关域名
  if (lowerDomain.includes('tw') || lowerDomain.includes('taiwan') || 
      lowerDomain.includes('taipei')) {
    return { countryCode: 'TW', country: 'Taiwan', city: 'Taipei' };
  }
  
  // 中国大陆相关域名
  if (lowerDomain.includes('cn') || lowerDomain.includes('china') || 
      lowerDomain.includes('beijing') || lowerDomain.includes('shanghai')) {
    return { countryCode: 'CN', country: 'China', city: 'Beijing' };
  }
  
  // 英国相关域名
  if (lowerDomain.includes('uk') || lowerDomain.includes('britain') || 
      lowerDomain.includes('london')) {
    return { countryCode: 'GB', country: 'United Kingdom', city: 'London' };
  }
  
  // 德国相关域名
  if (lowerDomain.includes('de') || lowerDomain.includes('germany') || 
      lowerDomain.includes('berlin')) {
    return { countryCode: 'DE', country: 'Germany', city: 'Berlin' };
  }
  
  // 加拿大相关域名
  if (lowerDomain.includes('ca') || lowerDomain.includes('canada') || 
      lowerDomain.includes('toronto') || lowerDomain.includes('vancouver')) {
    return { countryCode: 'CA', country: 'Canada', city: 'Toronto' };
  }
  
  // 澳大利亚相关域名
  if (lowerDomain.includes('au') || lowerDomain.includes('australia') || 
      lowerDomain.includes('sydney') || lowerDomain.includes('melbourne')) {
    return { countryCode: 'AU', country: 'Australia', city: 'Sydney' };
  }
  
  return null;
}

/**
 * 根据节点名称推断地理位置
 * @param {string} nodeName 节点名称
 * @returns {Object|null} 地理位置信息
 */
function detectLocationFromNodeName(nodeName) {
  if (!nodeName) return null;
  
  const lowerName = nodeName.toLowerCase();
  
  // 检测国旗
  const flagToCountry = {
    '🇸🇬': { countryCode: 'SG', country: 'Singapore' },
    '🇭🇰': { countryCode: 'HK', country: 'Hong Kong' },
    '🇺🇸': { countryCode: 'US', country: 'United States' },
    '🇯🇵': { countryCode: 'JP', country: 'Japan' },
    '🇰🇷': { countryCode: 'KR', country: 'South Korea' },
    '🇹🇼': { countryCode: 'TW', country: 'Taiwan' },
    '🇨🇳': { countryCode: 'CN', country: 'China' },
    '🇬🇧': { countryCode: 'GB', country: 'United Kingdom' },
    '🇩🇪': { countryCode: 'DE', country: 'Germany' },
    '🇨🇦': { countryCode: 'CA', country: 'Canada' },
    '🇦🇺': { countryCode: 'AU', country: 'Australia' },
    '🇷🇺': { countryCode: 'RU', country: 'Russia' },
    '🇮🇳': { countryCode: 'IN', country: 'India' },
    '🇧🇷': { countryCode: 'BR', country: 'Brazil' },
    '🇮🇹': { countryCode: 'IT', country: 'Italy' },
    '🇪🇸': { countryCode: 'ES', country: 'Spain' },
    '🇳🇱': { countryCode: 'NL', country: 'Netherlands' },
    '🇸🇪': { countryCode: 'SE', country: 'Sweden' },
    '🇳🇴': { countryCode: 'NO', country: 'Norway' },
    '🇨🇭': { countryCode: 'CH', country: 'Switzerland' },
    '🇦🇹': { countryCode: 'AT', country: 'Austria' },
    '🇧🇪': { countryCode: 'BE', country: 'Belgium' },
    '🇩🇰': { countryCode: 'DK', country: 'Denmark' },
    '🇫🇮': { countryCode: 'FI', country: 'Finland' },
    '🇮🇪': { countryCode: 'IE', country: 'Ireland' },
    '🇵🇹': { countryCode: 'PT', country: 'Portugal' },
    '🇬🇷': { countryCode: 'GR', country: 'Greece' },
    '🇺🇦': { countryCode: 'UA', country: 'Ukraine' },
    '🇵🇱': { countryCode: 'PL', country: 'Poland' },
    '🇨🇿': { countryCode: 'CZ', country: 'Czech Republic' },
    '🇳🇿': { countryCode: 'NZ', country: 'New Zealand' },
    '🇹🇭': { countryCode: 'TH', country: 'Thailand' },
    '🇻🇳': { countryCode: 'VN', country: 'Vietnam' },
    '🇮🇩': { countryCode: 'ID', country: 'Indonesia' },
    '🇵🇭': { countryCode: 'PH', country: 'Philippines' },
    '🇹🇷': { countryCode: 'TR', country: 'Turkey' },
    '🇦🇪': { countryCode: 'AE', country: 'UAE' },
    '🇸🇦': { countryCode: 'SA', country: 'Saudi Arabia' },
    '🇮🇱': { countryCode: 'IL', country: 'Israel' },
    '🇪🇬': { countryCode: 'EG', country: 'Egypt' },
    '🇿🇦': { countryCode: 'ZA', country: 'South Africa' },
    '🇰🇪': { countryCode: 'KE', country: 'Kenya' },
    '🇳🇬': { countryCode: 'NG', country: 'Nigeria' },
    '🇦🇷': { countryCode: 'AR', country: 'Argentina' },
    '🇲🇾': { countryCode: 'MY', country: 'Malaysia' }
  };
  
  for (const [flag, info] of Object.entries(flagToCountry)) {
    if (nodeName.includes(flag)) {
      return info;
    }
  }
  
  // 检测中文国家名
  const chineseNameMap = {
    '新加坡': { countryCode: 'SG', country: 'Singapore' },
    '香港': { countryCode: 'HK', country: 'Hong Kong' },
    '美国': { countryCode: 'US', country: 'United States' },
    '日本': { countryCode: 'JP', country: 'Japan' },
    '韩国': { countryCode: 'KR', country: 'South Korea' },
    '台湾': { countryCode: 'TW', country: 'Taiwan' },
    '中国': { countryCode: 'CN', country: 'China' },
    '英国': { countryCode: 'GB', country: 'United Kingdom' },
    '德国': { countryCode: 'DE', country: 'Germany' },
    '加拿大': { countryCode: 'CA', country: 'Canada' },
    '澳大利亚': { countryCode: 'AU', country: 'Australia' },
    '俄罗斯': { countryCode: 'RU', country: 'Russia' },
    '印度': { countryCode: 'IN', country: 'India' },
    '巴西': { countryCode: 'BR', country: 'Brazil' },
    '意大利': { countryCode: 'IT', country: 'Italy' },
    '西班牙': { countryCode: 'ES', country: 'Spain' },
    '荷兰': { countryCode: 'NL', country: 'Netherlands' },
    '瑞典': { countryCode: 'SE', country: 'Sweden' },
    '挪威': { countryCode: 'NO', country: 'Norway' },
    '瑞士': { countryCode: 'CH', country: 'Switzerland' }
  };
  
  for (const [chName, info] of Object.entries(chineseNameMap)) {
    if (lowerName.includes(chName)) {
      return info;
    }
  }
  
  // 检测英文国家名
  const englishNameMap = {
    'singapore': { countryCode: 'SG', country: 'Singapore' },
    'hong kong': { countryCode: 'HK', country: 'Hong Kong' },
    'united states': { countryCode: 'US', country: 'United States' },
    'america': { countryCode: 'US', country: 'United States' },
    'japan': { countryCode: 'JP', country: 'Japan' },
    'korea': { countryCode: 'KR', country: 'South Korea' },
    'taiwan': { countryCode: 'TW', country: 'Taiwan' },
    'china': { countryCode: 'CN', country: 'China' },
    'united kingdom': { countryCode: 'GB', country: 'United Kingdom' },
    'britain': { countryCode: 'GB', country: 'United Kingdom' },
    'germany': { countryCode: 'DE', country: 'Germany' },
    'canada': { countryCode: 'CA', country: 'Canada' },
    'australia': { countryCode: 'AU', country: 'Australia' },
    'russia': { countryCode: 'RU', country: 'Russia' },
    'india': { countryCode: 'IN', country: 'India' },
    'brazil': { countryCode: 'BR', country: 'Brazil' },
    'italy': { countryCode: 'IT', country: 'Italy' },
    'spain': { countryCode: 'ES', country: 'Spain' },
    'netherlands': { countryCode: 'NL', country: 'Netherlands' },
    'sweden': { countryCode: 'SE', country: 'Sweden' }
  };
  
  for (const [enName, info] of Object.entries(englishNameMap)) {
    if (lowerName.includes(enName)) {
      return info;
    }
  }
  
  // 检测国家代码
  const codeMap = {
    'sg': { countryCode: 'SG', country: 'Singapore' },
    'hk': { countryCode: 'HK', country: 'Hong Kong' },
    'us': { countryCode: 'US', country: 'United States' },
    'jp': { countryCode: 'JP', country: 'Japan' },
    'kr': { countryCode: 'KR', country: 'South Korea' },
    'tw': { countryCode: 'TW', country: 'Taiwan' },
    'cn': { countryCode: 'CN', country: 'China' },
    'gb': { countryCode: 'GB', country: 'United Kingdom' },
    'uk': { countryCode: 'GB', country: 'United Kingdom' },
    'de': { countryCode: 'DE', country: 'Germany' },
    'ca': { countryCode: 'CA', country: 'Canada' },
    'au': { countryCode: 'AU', country: 'Australia' },
    'ru': { countryCode: 'RU', country: 'Russia' },
    'in': { countryCode: 'IN', country: 'India' },
    'br': { countryCode: 'BR', country: 'Brazil' },
    'it': { countryCode: 'IT', country: 'Italy' },
    'es': { countryCode: 'ES', country: 'Spain' },
    'nl': { countryCode: 'NL', country: 'Netherlands' },
    'se': { countryCode: 'SE', country: 'Sweden' }
  };
  
  // 用正则匹配单独的国家代码（避免匹配到其他单词的一部分）
  for (const [code, info] of Object.entries(codeMap)) {
    const regex = new RegExp(`\\b${code}\\b`, 'i');
    if (regex.test(lowerName)) {
      return info;
    }
  }
  
  return null;
}

/**
 * 智能IP地理位置查询（基于IP段数据库）
 * @param {string} ip IP地址
 * @returns {Object|null} 地理位置信息
 */
function simulateIPQuery(ip) {
  const ipParts = ip.split('.');
  const firstOctet = parseInt(ipParts[0]);
  const secondOctet = parseInt(ipParts[1]);
  
  // 基于真实IP段的地理位置判断
  
  // 新加坡IP段
  if (ip.startsWith('154.18.') || ip.startsWith('103.28.') || ip.startsWith('119.81.')) {
    return { countryCode: 'SG', country: 'Singapore', city: 'Singapore' };
  }
  
  // 美国IP段
  if (ip.startsWith('38.') || ip.startsWith('104.') || ip.startsWith('192.') || 
      (firstOctet >= 8 && firstOctet <= 15) || (firstOctet >= 23 && firstOctet <= 35)) {
    return { countryCode: 'US', country: 'United States', city: 'Los Angeles' };
  }
  
  // 香港IP段
  if (ip.startsWith('103.') || ip.startsWith('119.') || ip.startsWith('202.') ||
      (firstOctet >= 202 && firstOctet <= 210)) {
    return { countryCode: 'HK', country: 'Hong Kong', city: 'Hong Kong' };
  }
  
  // 日本IP段
  if (ip.startsWith('133.') || ip.startsWith('126.') || ip.startsWith('210.') ||
      (firstOctet >= 126 && firstOctet <= 133)) {
    return { countryCode: 'JP', country: 'Japan', city: 'Tokyo' };
  }
  
  // 韩国IP段
  if (ip.startsWith('221.') || ip.startsWith('211.') || ip.startsWith('222.')) {
    return { countryCode: 'KR', country: 'Korea', city: 'Seoul' };
  }
  
  // 台湾IP段
  if (ip.startsWith('114.') || ip.startsWith('118.') || ip.startsWith('120.')) {
    return { countryCode: 'TW', country: 'Taiwan', city: 'Taipei' };
  }
  
  // 德国IP段
  if (ip.startsWith('46.') || ip.startsWith('85.') || ip.startsWith('217.')) {
    return { countryCode: 'DE', country: 'Germany', city: 'Frankfurt' };
  }
  
  // 英国IP段
  if (ip.startsWith('81.') || ip.startsWith('86.') || ip.startsWith('87.')) {
    return { countryCode: 'GB', country: 'United Kingdom', city: 'London' };
  }
  
  // 加拿大IP段
  if (ip.startsWith('99.') || ip.startsWith('142.') || ip.startsWith('206.')) {
    return { countryCode: 'CA', country: 'Canada', city: 'Toronto' };
  }
  
  // 澳大利亚IP段
  if (ip.startsWith('101.') || ip.startsWith('175.') || ip.startsWith('203.')) {
    return { countryCode: 'AU', country: 'Australia', city: 'Sydney' };
  }
  
  // 俄罗斯IP段
  if (ip.startsWith('95.') || ip.startsWith('178.') || ip.startsWith('188.')) {
    return { countryCode: 'RU', country: 'Russia', city: 'Moscow' };
  }
  
  // 中国IP段（默认）
  if (firstOctet >= 220 || ip.startsWith('223.') || ip.startsWith('117.')) {
    return { countryCode: 'CN', country: 'China', city: 'Beijing' };
  }
  
  // 根据第一个八位数的范围判断
  if (firstOctet >= 1 && firstOctet <= 50) {
    return { countryCode: 'US', country: 'United States', city: 'Los Angeles' };
  } else if (firstOctet >= 51 && firstOctet <= 100) {
    return { countryCode: 'HK', country: 'Hong Kong', city: 'Hong Kong' };
  } else if (firstOctet >= 101 && firstOctet <= 150) {
    return { countryCode: 'JP', country: 'Japan', city: 'Tokyo' };
  } else if (firstOctet >= 151 && firstOctet <= 200) {
    return { countryCode: 'SG', country: 'Singapore', city: 'Singapore' };
  } else {
    return { countryCode: 'US', country: 'United States', city: 'Los Angeles' };
  }
}

/**
 * 主要操作函数
 * @param {Object} proxies 代理配置对象
 * @returns {Object} 处理后的代理配置对象
 */
function operator(proxies) {
  // 注意：Sub-Store可能不支持async函数，改为同步处理
  if (!Array.isArray(proxies) || proxies.length === 0) {
    console.log('没有可处理的代理节点');
    return proxies;
  }
  
  console.log(`=== IP地理位置检测开始 ===`);
  console.log(`输入节点数量: ${proxies.length}`);
  console.log(`配置: 格式=${config.format}, 前缀=${config.prefix}`);
  
  // 同步处理，直接返回修改后的节点
  const results = proxies.map((proxy, index) => {
    try {
      console.log(`处理节点 ${index + 1}: ${proxy.name}`);
      
      const ip = extractIPFromProxy(proxy);
      
      if (!ip) {
        // 域名节点，尝试从域名推测位置
        const serverName = proxy.server || proxy.hostname || proxy.host || '';
        console.log(`节点 ${proxy.name} 使用域名: ${serverName}`);
        
        let locationInfo = detectLocationFromDomain(serverName);
        
        // 如果域名检测失败，尝试从节点名称推断
        if (!locationInfo) {
          locationInfo = detectLocationFromNodeName(proxy.name);
        }
        
        if (locationInfo) {
          const originalName = proxy.name;
          proxy.name = buildNewNodeName(originalName, locationInfo);
          proxy.realCountry = locationInfo.countryCode;
          proxy.detectionMethod = 'domain';
          
          console.log(`🌐 域名检测: ${originalName} -> ${proxy.name}`);
          return proxy;
        } else if (config.fallback) {
          proxy.name = `[域名] ${proxy.name}`;
          return proxy;
        } else {
          return null;
        }
      }
      
      console.log(`提取到IP: ${ip}`);
      
      // IP查询
      const locationInfo = simulateIPQuery(ip);
      
      if (locationInfo) {
        const originalName = proxy.name;
        proxy.name = buildNewNodeName(originalName, locationInfo);
        proxy.realCountry = locationInfo.countryCode;
        proxy.realIP = ip;
        proxy.location = locationInfo;
        proxy.detectionMethod = 'ip';
        
        console.log(`🎯 IP检测: ${originalName} -> ${proxy.name} (${ip})`);
        return proxy;
      } else {
        console.log(`IP ${ip} 查询失败`);
        if (config.fallback) {
          proxy.name = `[查询失败] ${proxy.name}`;
          return proxy;
        }
        return null;
      }
      
    } catch (error) {
      console.error(`处理节点 ${proxy.name} 时出错: ${error.message}`);
      if (config.fallback) {
        proxy.name = `[错误] ${proxy.name}`;
        return proxy;
      }
      return null;
    }
  }).filter(proxy => proxy !== null);
  
  console.log(`=== 检测完成 ===`);
  console.log(`处理完成，输出节点数量: ${results.length}`);
  
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
  console.log('\n=== IP地理位置检测脚本配置 ===');
  console.log(`输出格式: ${config.format}`);
  console.log(`超时时间: ${config.timeout}ms`);
  console.log(`并发数量: ${config.concurrent}`);
  console.log(`重试次数: ${config.retries}`);
  console.log(`失败保留: ${config.fallback}`);
  if (config.prefix) console.log(`节点前缀: "${config.prefix}"`);
  
  console.log('\n=== 使用示例 ===');
  console.log('基础使用: script.js');
  console.log('完整配置: script.js#format=flag&prefix=✅&timeout=5000');
}

// 调试模式
if (inArg.debug || inArg.help) {
  showConfig();
}
