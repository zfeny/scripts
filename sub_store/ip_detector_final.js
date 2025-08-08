/**
 * Sub-Store IP地理位置检测脚本 - 最终版
 * 功能：通过API精准检测代理节点真实IP地理位置，清除原有地区标识，只保留API获取的国别flag
 * 作者：zfeny
 * 版本：6.3 Final
 * 更新：2025-08-08
 * 
 * 使用方法：
 * https://raw.githubusercontent.com/zfeny/scripts/refs/heads/main/sub_store/ip_detector_final.js#api=ipinfo&token=bd71953cf5a6f9&format=flag&cleanShortCodes=true&include=trojan+专线&exclude=test+临时
 * 
 * 参数说明：
 * - api: API服务 (ip-api, ipinfo, ip2location)
 * - token: IPInfo API Token (仅ipinfo需要)
 * - format: 输出格式 (flag, text, both)
 * - cleanShortCodes: 是否清理英文简称如HK、TR等 (true/false)
 * - include: 包含条件，仅处理包含指定关键词的节点，多个关键词用+分隔 (为空时处理所有节点)
 * - exclude: 排除条件，排除包含指定关键词的节点，多个关键词用+分隔 (为空时不排除任何节点)
 * - debug: 调试模式 (true/false)
 * - timeout: 超时时间毫秒 (默认10000)
 * 
 * 多关键词过滤示例：
 * include=香港+新加坡  -> 只处理节点名包含"香港"或"新加坡"的节点
 * exclude=测试+临时+备用 -> 排除节点名包含"测试"或"临时"或"备用"的节点
 * include=IPLC+专线&exclude=测试 -> 只处理包含"IPLC"或"专线"但不包含"测试"的节点
 * 
 * 更新日志：
 * v6.3 - 修正台湾地区旗帜显示：确保台湾使用自己的旗帜🇹🇼而不是🇨🇳
 * v6.2 - 增强过滤功能：支持用+分隔多个关键词进行包含/排除过滤
 * v6.1 - 修复清理规则过于宽泛导致意外删除字符的问题，移除单字匹配，改用完整国家名称匹配
 */

// 配置参数解析
const scriptArgs = (typeof $arguments !== 'undefined') ? $arguments : {};
const config = {
  api: scriptArgs.api || 'ip-api',
  token: scriptArgs.token || '',
  format: scriptArgs.format || 'flag',
  cleanShortCodes: scriptArgs.cleanShortCodes === 'true' || scriptArgs.cleanShortCodes === true || false,
  include: scriptArgs.include || '',
  exclude: scriptArgs.exclude || '',
  debug: scriptArgs.debug === 'true' || scriptArgs.debug === true,
  timeout: parseInt(scriptArgs.timeout) || 10000
};

// IP地理位置API服务配置
const ipServices = {
  'ip-api': {
    name: 'IP-API',
    url: 'http://ip-api.com/json/',
    parseResponse: (data) => ({
      country: data.country,
      countryCode: data.countryCode,
      region: data.regionName,
      city: data.city,
      isp: data.isp
    })
  },
  'ipinfo': {
    name: 'IPInfo',
    url: 'https://ipinfo.io/',
    parseResponse: (data) => ({
      country: data.country_name || getCountryName(data.country),
      countryCode: data.country,
      region: data.region,
      city: data.city,
      isp: data.org
    })
  },
  'ip2location': {
    name: 'IP2Location',
    url: 'https://api.ip2location.io/?format=json&ip=',
    parseResponse: (data) => ({
      country: data.country_name,
      countryCode: data.country_code,
      region: data.region_name,
      city: data.city_name,
      isp: data.isp
    })
  }
};

// 国家代码到国旗映射
const countryFlags = {
  'AD': '🇦🇩', 'AE': '🇦🇪', 'AF': '🇦🇫', 'AG': '🇦🇬', 'AI': '🇦🇮', 'AL': '🇦🇱', 'AM': '🇦🇲', 'AO': '🇦🇴',
  'AQ': '🇦🇶', 'AR': '🇦🇷', 'AS': '🇦🇸', 'AT': '🇦🇹', 'AU': '🇦🇺', 'AW': '🇦🇼', 'AX': '🇦🇽', 'AZ': '🇦🇿',
  'BA': '🇧🇦', 'BB': '🇧🇧', 'BD': '🇧🇩', 'BE': '🇧🇪', 'BF': '🇧🇫', 'BG': '🇧🇬', 'BH': '🇧🇭', 'BI': '🇧🇮',
  'BJ': '🇧🇯', 'BL': '🇧🇱', 'BM': '🇧🇲', 'BN': '🇧🇳', 'BO': '🇧🇴', 'BQ': '🇧🇶', 'BR': '🇧🇷', 'BS': '🇧🇸',
  'BT': '🇧🇹', 'BV': '🇧🇻', 'BW': '🇧🇼', 'BY': '🇧🇾', 'BZ': '🇧🇿', 'CA': '🇨🇦', 'CC': '🇨🇨', 'CD': '🇨🇩',
  'CF': '🇨🇫', 'CG': '🇨🇬', 'CH': '🇨🇭', 'CI': '🇨🇮', 'CK': '🇨🇰', 'CL': '🇨🇱', 'CM': '🇨🇲', 'CN': '🇨🇳',
  'CO': '🇨🇴', 'CR': '🇨🇷', 'CU': '🇨🇺', 'CV': '🇨🇻', 'CW': '🇨🇼', 'CX': '🇨🇽', 'CY': '🇨🇾', 'CZ': '🇨🇿',
  'DE': '🇩🇪', 'DJ': '🇩🇯', 'DK': '🇩🇰', 'DM': '🇩🇲', 'DO': '🇩🇴', 'DZ': '🇩🇿', 'EC': '🇪🇨', 'EE': '🇪🇪',
  'EG': '🇪🇬', 'EH': '🇪🇭', 'ER': '🇪🇷', 'ES': '🇪🇸', 'ET': '🇪🇹', 'FI': '🇫🇮', 'FJ': '🇫🇯', 'FK': '🇫🇰',
  'FM': '🇫🇲', 'FO': '🇫🇴', 'FR': '🇫🇷', 'GA': '🇬🇦', 'GB': '🇬🇧', 'GD': '🇬🇩', 'GE': '🇬🇪', 'GF': '🇬🇫',
  'GG': '🇬🇬', 'GH': '🇬🇭', 'GI': '🇬🇮', 'GL': '🇬🇱', 'GM': '🇬🇲', 'GN': '🇬🇳', 'GP': '🇬🇵', 'GQ': '🇬🇶',
  'GR': '🇬🇷', 'GS': '🇬🇸', 'GT': '🇬🇹', 'GU': '🇬🇺', 'GW': '🇬🇼', 'GY': '🇬🇾', 'HK': '🇭🇰', 'HM': '🇭🇲',
  'HN': '🇭🇳', 'HR': '🇭🇷', 'HT': '🇭🇹', 'HU': '🇭🇺', 'ID': '🇮🇩', 'IE': '🇮🇪', 'IL': '🇮🇱', 'IM': '🇮🇲',
  'IN': '🇮🇳', 'IO': '🇮🇴', 'IQ': '🇮🇶', 'IR': '🇮🇷', 'IS': '🇮🇸', 'IT': '🇮🇹', 'JE': '🇯🇪', 'JM': '🇯🇲',
  'JO': '🇯🇴', 'JP': '🇯🇵', 'KE': '🇰🇪', 'KG': '🇰🇬', 'KH': '🇰🇭', 'KI': '🇰🇮', 'KM': '🇰🇲', 'KN': '🇰🇳',
  'KP': '🇰🇵', 'KR': '🇰🇷', 'KW': '🇰🇼', 'KY': '🇰🇾', 'KZ': '🇰🇿', 'LA': '🇱🇦', 'LB': '🇱🇧', 'LC': '🇱🇨',
  'LI': '🇱🇮', 'LK': '🇱🇰', 'LR': '🇱🇷', 'LS': '🇱🇸', 'LT': '🇱🇹', 'LU': '🇱🇺', 'LV': '🇱🇻', 'LY': '🇱🇾',
  'MA': '🇲🇦', 'MC': '🇲🇨', 'MD': '🇲🇩', 'ME': '🇲🇪', 'MF': '🇲🇫', 'MG': '🇲🇬', 'MH': '🇲🇭', 'MK': '🇲🇰',
  'ML': '🇲🇱', 'MM': '🇲🇲', 'MN': '🇲🇳', 'MO': '🇲🇴', 'MP': '🇲🇵', 'MQ': '🇲🇶', 'MR': '🇲🇷', 'MS': '🇲🇸',
  'MT': '🇲🇹', 'MU': '🇲🇺', 'MV': '🇲🇻', 'MW': '🇲🇼', 'MX': '🇲🇽', 'MY': '🇲🇾', 'MZ': '🇲🇿', 'NA': '🇳🇦',
  'NC': '🇳🇨', 'NE': '🇳🇪', 'NF': '🇳🇫', 'NG': '🇳🇬', 'NI': '🇳🇮', 'NL': '🇳🇱', 'NO': '🇳🇴', 'NP': '🇳🇵',
  'NR': '🇳🇷', 'NU': '🇳🇺', 'NZ': '🇳🇿', 'OM': '🇴🇲', 'PA': '🇵🇦', 'PE': '🇵🇪', 'PF': '🇵🇫', 'PG': '🇵🇬',
  'PH': '🇵🇭', 'PK': '🇵🇰', 'PL': '🇵🇱', 'PM': '🇵🇲', 'PN': '🇵🇳', 'PR': '🇵🇷', 'PS': '🇵🇸', 'PT': '🇵🇹',
  'PW': '🇵🇼', 'PY': '🇵🇾', 'QA': '🇶🇦', 'RE': '🇷🇪', 'RO': '🇷🇴', 'RS': '🇷🇸', 'RU': '🇷🇺', 'RW': '🇷🇼',
  'SA': '🇸🇦', 'SB': '🇸🇧', 'SC': '🇸🇨', 'SD': '🇸🇩', 'SE': '🇸🇪', 'SG': '🇸🇬', 'SH': '🇸🇭', 'SI': '🇸🇮',
  'SJ': '🇸🇯', 'SK': '🇸🇰', 'SL': '🇸🇱', 'SM': '🇸🇲', 'SN': '🇸🇳', 'SO': '🇸🇴', 'SR': '🇸🇷', 'SS': '🇸🇸',
  'ST': '🇸🇹', 'SV': '🇸🇻', 'SX': '🇸🇽', 'SY': '🇸🇾', 'SZ': '🇸🇿', 'TC': '🇹🇨', 'TD': '🇹🇩', 'TF': '🇹🇫',
  'TG': '🇹🇬', 'TH': '🇹🇭', 'TJ': '🇹🇯', 'TK': '🇹🇰', 'TL': '🇹🇱', 'TM': '🇹🇲', 'TN': '🇹🇳', 'TO': '🇹🇴',
  'TR': '🇹🇷', 'TT': '🇹🇹', 'TV': '🇹🇻', 'TW': '🇹🇼', 'TZ': '🇹🇿', 'UA': '🇺🇦', 'UG': '🇺🇬', 'UM': '🇺🇲',
  'US': '🇺🇸', 'UY': '🇺🇾', 'UZ': '🇺🇿', 'VA': '🇻🇦', 'VC': '🇻🇨', 'VE': '🇻🇪', 'VG': '🇻🇬', 'VI': '🇻🇮',
  'VN': '🇻🇳', 'VU': '🇻🇺', 'WF': '🇼🇫', 'WS': '🇼🇸', 'YE': '🇾🇪', 'YT': '🇾🇹', 'ZA': '🇿🇦', 'ZM': '🇿🇲', 'ZW': '🇿🇼'
};

// 国家代码到中文名称映射
const countryNames = {
  'AD': '安道尔', 'AE': '阿联酋', 'AF': '阿富汗', 'AG': '安提瓜和巴布达', 'AI': '安圭拉', 'AL': '阿尔巴尼亚',
  'AM': '亚美尼亚', 'AO': '安哥拉', 'AQ': '南极洲', 'AR': '阿根廷', 'AS': '美属萨摩亚', 'AT': '奥地利',
  'AU': '澳大利亚', 'AW': '阿鲁巴', 'AX': '奥兰群岛', 'AZ': '阿塞拜疆', 'BA': '波黑', 'BB': '巴巴多斯',
  'BD': '孟加拉国', 'BE': '比利时', 'BF': '布基纳法索', 'BG': '保加利亚', 'BH': '巴林', 'BI': '布隆迪',
  'BJ': '贝宁', 'BL': '圣巴泰勒米', 'BM': '百慕大', 'BN': '文莱', 'BO': '玻利维亚', 'BQ': '荷属加勒比',
  'BR': '巴西', 'BS': '巴哈马', 'BT': '不丹', 'BV': '布韦岛', 'BW': '博茨瓦纳', 'BY': '白俄罗斯',
  'BZ': '伯利兹', 'CA': '加拿大', 'CC': '科科斯群岛', 'CD': '刚果金', 'CF': '中非', 'CG': '刚果布',
  'CH': '瑞士', 'CI': '科特迪瓦', 'CK': '库克群岛', 'CL': '智利', 'CM': '喀麦隆', 'CN': '中国',
  'CO': '哥伦比亚', 'CR': '哥斯达黎加', 'CU': '古巴', 'CV': '佛得角', 'CW': '库拉索', 'CX': '圣诞岛',
  'CY': '塞浦路斯', 'CZ': '捷克', 'DE': '德国', 'DJ': '吉布提', 'DK': '丹麦', 'DM': '多米尼克',
  'DO': '多米尼加', 'DZ': '阿尔及利亚', 'EC': '厄瓜多尔', 'EE': '爱沙尼亚', 'EG': '埃及', 'EH': '西撒哈拉',
  'ER': '厄立特里亚', 'ES': '西班牙', 'ET': '埃塞俄比亚', 'FI': '芬兰', 'FJ': '斐济', 'FK': '马尔维纳斯群岛',
  'FM': '密克罗尼西亚', 'FO': '法罗群岛', 'FR': '法国', 'GA': '加蓬', 'GB': '英国', 'GD': '格林纳达',
  'GE': '格鲁吉亚', 'GF': '法属圭亚那', 'GG': '根西岛', 'GH': '加纳', 'GI': '直布罗陀', 'GL': '格陵兰',
  'GM': '冈比亚', 'GN': '几内亚', 'GP': '瓜德罗普', 'GQ': '赤道几内亚', 'GR': '希腊', 'GS': '南乔治亚和南桑威奇群岛',
  'GT': '危地马拉', 'GU': '关岛', 'GW': '几内亚比绍', 'GY': '圭亚那', 'HK': '香港', 'HM': '赫德岛和麦克唐纳群岛',
  'HN': '洪都拉斯', 'HR': '克罗地亚', 'HT': '海地', 'HU': '匈牙利', 'ID': '印尼', 'IE': '爱尔兰',
  'IL': '以色列', 'IM': '马恩岛', 'IN': '印度', 'IO': '英属印度洋领地', 'IQ': '伊拉克', 'IR': '伊朗',
  'IS': '冰岛', 'IT': '意大利', 'JE': '泽西岛', 'JM': '牙买加', 'JO': '约旦', 'JP': '日本',
  'KE': '肯尼亚', 'KG': '吉尔吉斯斯坦', 'KH': '柬埔寨', 'KI': '基里巴斯', 'KM': '科摩罗', 'KN': '圣基茨和尼维斯',
  'KP': '朝鲜', 'KR': '韩国', 'KW': '科威特', 'KY': '开曼群岛', 'KZ': '哈萨克斯坦', 'LA': '老挝',
  'LB': '黎巴嫩', 'LC': '圣卢西亚', 'LI': '列支敦士登', 'LK': '斯里兰卡', 'LR': '利比里亚', 'LS': '莱索托',
  'LT': '立陶宛', 'LU': '卢森堡', 'LV': '拉脱维亚', 'LY': '利比亚', 'MA': '摩洛哥', 'MC': '摩纳哥',
  'MD': '摩尔多瓦', 'ME': '黑山', 'MF': '法属圣马丁', 'MG': '马达加斯加', 'MH': '马绍尔群岛', 'MK': '北马其顿',
  'ML': '马里', 'MM': '缅甸', 'MN': '蒙古', 'MO': '澳门', 'MP': '北马里亚纳群岛', 'MQ': '马提尼克',
  'MR': '毛利塔尼亚', 'MS': '蒙特塞拉特', 'MT': '马耳他', 'MU': '毛里求斯', 'MV': '马尔代夫', 'MW': '马拉维',
  'MX': '墨西哥', 'MY': '马来西亚', 'MZ': '莫桑比克', 'NA': '纳米比亚', 'NC': '新喀里多尼亚', 'NE': '尼日尔',
  'NF': '诺福克岛', 'NG': '尼日利亚', 'NI': '尼加拉瓜', 'NL': '荷兰', 'NO': '挪威', 'NP': '尼泊尔',
  'NR': '瑙鲁', 'NU': '纽埃', 'NZ': '新西兰', 'OM': '阿曼', 'PA': '巴拿马', 'PE': '秘鲁',
  'PF': '法属波利尼西亚', 'PG': '巴布亚新几内亚', 'PH': '菲律宾', 'PK': '巴基斯坦', 'PL': '波兰', 'PM': '圣皮埃尔和密克隆',
  'PN': '皮特凯恩群岛', 'PR': '波多黎各', 'PS': '巴勒斯坦', 'PT': '葡萄牙', 'PW': '帕劳', 'PY': '巴拉圭',
  'QA': '卡塔尔', 'RE': '留尼汪', 'RO': '罗马尼亚', 'RS': '塞尔维亚', 'RU': '俄罗斯', 'RW': '卢旺达',
  'SA': '沙特阿拉伯', 'SB': '所罗门群岛', 'SC': '塞舌尔', 'SD': '苏丹', 'SE': '瑞典', 'SG': '新加坡',
  'SH': '圣赫勒拿', 'SI': '斯洛文尼亚', 'SJ': '斯瓦尔巴和扬马延', 'SK': '斯洛伐克', 'SL': '塞拉利昂', 'SM': '圣马力诺',
  'SN': '塞内加尔', 'SO': '索马里', 'SR': '苏里南', 'SS': '南苏丹', 'ST': '圣多美和普林西比', 'SV': '萨尔瓦多',
  'SX': '荷属圣马丁', 'SY': '叙利亚', 'SZ': '斯威士兰', 'TC': '特克斯和凯科斯群岛', 'TD': '乍得', 'TF': '法属南部领地',
  'TG': '多哥', 'TH': '泰国', 'TJ': '塔吉克斯坦', 'TK': '托克劳', 'TL': '东帝汶', 'TM': '土库曼斯坦',
  'TN': '突尼斯', 'TO': '汤加', 'TR': '土耳其', 'TT': '特立尼达和多巴哥', 'TV': '图瓦卢', 'TW': '台湾',
  'TZ': '坦桑尼亚', 'UA': '乌克兰', 'UG': '乌干达', 'UM': '美国本土外小岛屿', 'US': '美国', 'UY': '乌拉圭',
  'UZ': '乌兹别克斯坦', 'VA': '梵蒂冈', 'VC': '圣文森特和格林纳丁斯', 'VE': '委内瑞拉', 'VG': '英属维尔京群岛', 'VI': '美属维尔京群岛',
  'VN': '越南', 'VU': '瓦努阿图', 'WF': '瓦利斯和富图纳', 'WS': '萨摩亚', 'YE': '也门', 'YT': '马约特',
  'ZA': '南非', 'ZM': '赞比亚', 'ZW': '津巴布韦'
};

// 地区清理规则 - 专注于清理国别标识
const regionCleanRules = {
  // 清理所有国家flag emoji (优先级最高)
  'CLEAN_FLAGS': /🇦🇩|🇦🇪|🇦🇫|🇦🇬|🇦🇮|🇦🇱|🇦🇲|🇦🇴|🇦🇶|🇦🇷|🇦🇸|🇦🇹|�🇺|🇦🇼|🇦🇽|🇦🇿|🇧🇦|🇧🇧|🇧🇩|🇧🇪|🇧🇫|🇧🇬|🇧🇭|🇧🇮|🇧🇯|🇧🇱|🇧🇲|🇧🇳|🇧🇴|🇧🇶|🇧🇷|🇧🇸|🇧�🇹|�🇻|🇧�🇼|🇧🇾|🇧🇿|🇨🇦|🇨🇨|🇨🇩|🇨🇫|�🇬|🇨🇭|🇨🇮|🇨🇰|🇨🇱|🇨🇲|🇨🇳|🇨🇴|🇨🇷|🇨🇺|🇨🇻|🇨🇼|🇨🇽|🇨🇾|🇨🇿|🇩🇪|🇩�🇯|�🇰|🇩🇲|🇩🇴|🇩🇿|🇪🇨|🇪🇪|🇪🇬|🇪🇭|🇪🇷|🇪🇸|🇪🇹|🇫🇮|🇫🇯|🇫🇰|🇫🇲|🇫🇴|🇫🇷|🇬🇦|🇬🇧|🇬🇩|🇬🇪|🇬🇫|🇬🇬|🇬🇭|🇬🇮|🇬🇱|🇬🇲|🇬🇳|🇬�🇵|🇬🇶|🇬🇷|🇬🇸|🇬🇹|🇬🇺|🇬🇼|🇬🇾|🇭🇰|🇭🇲|🇭🇳|🇭🇷|🇭🇹|🇭🇺|🇮🇩|🇮🇪|🇮🇱|🇮🇲|🇮🇳|🇮🇴|🇮🇶|🇮🇷|🇮🇸|🇮🇹|🇯🇪|🇯🇲|🇯🇴|🇯🇵|🇰🇪|🇰🇬|🇰🇭|🇰🇮|🇰🇲|🇰🇳|🇰🇵|🇰🇷|🇰🇼|🇰🇾|🇰🇿|🇱🇦|🇱🇧|🇱🇨|🇱🇮|🇱🇰|🇱🇷|🇱🇸|🇱🇹|🇱🇺|🇱🇻|🇱🇾|🇲🇦|🇲🇨|🇲🇩|🇲🇪|🇲🇫|🇲🇬|🇲🇭|🇲🇰|🇲🇱|🇲🇲|🇲🇳|🇲🇴|🇲🇵|🇲🇶|🇲🇷|🇲🇸|🇲🇹|🇲🇺|🇲🇻|🇲🇼|🇲🇽|🇲🇾|🇲🇿|🇳🇦|🇳🇨|🇳🇪|🇳🇫|🇳🇬|🇳🇮|🇳🇱|🇳🇴|🇳🇵|🇳🇷|🇳🇺|🇳🇿|🇴🇲|🇵🇦|🇵🇪|🇵🇫|🇵🇬|🇵🇭|🇵🇰|🇵🇱|🇵🇲|🇵🇳|🇵🇷|🇵🇸|🇵🇹|🇵🇼|🇵🇾|🇶🇦|🇷🇪|🇷🇴|🇷🇸|🇷🇺|🇷🇼|🇸🇦|🇸🇧|🇸🇨|🇸🇩|🇸🇪|🇸🇬|🇸🇭|🇸🇮|🇸🇯|🇸🇰|🇸🇱|🇸🇲|🇸🇳|🇸🇴|🇸🇷|🇸🇸|🇸🇹|🇸🇻|🇸🇽|🇸🇾|🇸🇿|🇹🇨|🇹🇩|🇹🇫|🇹🇬|🇹🇭|🇹🇯|🇹🇰|🇹🇱|🇹🇲|🇹🇳|🇹🇴|🇹🇷|🇹🇹|🇹🇻|🇹🇼|🇹🇿|🇺🇦|🇺🇬|🇺🇲|🇺🇸|🇺🇾|🇺🇿|🇻🇦|🇻🇨|🇻🇪|🇻🇬|🇻🇮|🇻🇳|🇻🇺|🇼🇫|🇼🇸|🇾🇪|🇾🇹|🇿🇦|🇿🇲|🇿🇼/g,
  
  // 中文国家/地区名称清理 - 使用更精确的匹配
  'CLEAN_CHINESE_REGIONS': /香港|台湾|日本|韩国|新加坡|美国|英国|德国|法国|澳大利亚|澳洲|加拿大|俄罗斯|土耳其|印度|泰国|越南|菲律宾|马来西亚|阿联酋|瑞士|孟加拉国|孟加拉|捷克|波黑|中国|荷兰|意大利|西班牙|葡萄牙|瑞典|挪威|丹麦|芬兰|波兰|乌克兰|白俄罗斯|立陶宛|拉脱维亚|爱沙尼亚|以色列|沙特阿拉伯|伊朗|伊拉克|埃及|南非|巴西|阿根廷|智利|墨西哥|哥伦比亚|委内瑞拉|秘鲁|新西兰|印尼|印度尼西亚|缅甸|柬埔寨|老挝|斯里兰卡|尼泊尔|巴基斯坦|阿富汗|乌兹别克斯坦|哈萨克斯坦|吉尔吉斯斯坦|塔吉克斯坦|土库曼斯坦|蒙古|朝鲜|文莱|东帝汶|巴布亚新几内亚|斐济|汤加|萨摩亚|瓦努阿图|所罗门群岛|密克罗尼西亚|帕劳|基里巴斯|图瓦卢|瑙鲁|马绍尔群岛|库克群岛|纽埃|托克劳/gi,
  
  // 英文国家/地区名称清理
  'CLEAN_ENGLISH_REGIONS': /Hong\s?Kong|Hongkong|Taiwan|Taipei|Japan|Tokyo|Osaka|Korea|Seoul|Singapore|United\s?States|USA|Los\s?Angeles|San\s?Jose|Silicon\s?Valley|Michigan|Portland|Chicago|Columbus|New\s?York|Oregon|Seattle|United\s?Kingdom|London|Great\s?Britain|Germany|Frankfurt|France|Paris|Australia|Melbourne|Sydney|Canada|Russia|Moscow|Turkey|Istanbul|India|Mumbai|Indonesia|Jakarta|Thailand|Bangkok|Vietnam|Philippines|Malaysia|United\s?Arab\s?Emirates|Dubai|Switzerland|Zurich|Bangladesh|Czech|Bosnia|Netherlands|Amsterdam|Italy|Rome|Spain|Madrid|Portugal|Lisbon|Sweden|Stockholm|Norway|Oslo|Denmark|Copenhagen|Finland|Helsinki|Poland|Warsaw|Ukraine|Kiev|Belarus|Minsk|Lithuania|Vilnius|Latvia|Riga|Estonia|Tallinn|Israel|Tel\s?Aviv|Saudi\s?Arabia|Riyadh|Iran|Tehran|Iraq|Baghdad|Egypt|Cairo|South\s?Africa|Cape\s?Town|Brazil|Sao\s?Paulo|Argentina|Buenos\s?Aires|Chile|Santiago|Mexico|Mexico\s?City|Colombia|Bogota|Venezuela|Caracas|Peru|Lima|New\s?Zealand|Auckland|Myanmar|Cambodia|Laos|Sri\s?Lanka|Nepal|Pakistan|Afghanistan|Uzbekistan|Kazakhstan|Kyrgyzstan|Tajikistan|Turkmenistan|Mongolia|North\s?Korea|Brunei|East\s?Timor|Papua\s?New\s?Guinea|Fiji|Tonga|Samoa|Vanuatu|Solomon\s?Islands|Micronesia|Palau|Kiribati|Tuvalu|Nauru|Marshall\s?Islands|Cook\s?Islands|Niue|Tokelau/gi,
  
  // 城市名称清理
  'CLEAN_CITIES': /东京|大坂|首尔|春川|狮城|波特兰|芝加哥|哥伦布|纽约|硅谷|俄勒冈|西雅图|伦敦|法兰克福|巴黎|墨尔本|悉尼|土澳|莫斯科|伊斯坦布尔|孟买|雅加达|曼谷|迪拜|苏黎世/gi
};

// 英文简称清理规则 (仅在启用时使用)
const shortCodeCleanRules = {
  'CLEAN_SHORT_CODES': /\b(AD|AE|AF|AG|AI|AL|AM|AO|AQ|AR|AS|AT|AU|AW|AX|AZ|BA|BB|BD|BE|BF|BG|BH|BI|BJ|BL|BM|BN|BO|BQ|BR|BS|BT|BV|BW|BY|BZ|CA|CC|CD|CF|CG|CH|CI|CK|CL|CM|CN|CO|CR|CU|CV|CW|CX|CY|CZ|DE|DJ|DK|DM|DO|DZ|EC|EE|EG|EH|ER|ES|ET|FI|FJ|FK|FM|FO|FR|GA|GB|GD|GE|GF|GG|GH|GI|GL|GM|GN|GP|GQ|GR|GS|GT|GU|GW|GY|HK|HM|HN|HR|HT|HU|ID|IE|IL|IM|IN|IO|IQ|IR|IS|IT|JE|JM|JO|JP|KE|KG|KH|KI|KM|KN|KP|KR|KW|KY|KZ|LA|LB|LC|LI|LK|LR|LS|LT|LU|LV|LY|MA|MC|MD|ME|MF|MG|MH|MK|ML|MM|MN|MO|MP|MQ|MR|MS|MT|MU|MV|MW|MX|MY|MZ|NA|NC|NE|NF|NG|NI|NL|NO|NP|NR|NU|NZ|OM|PA|PE|PF|PG|PH|PK|PL|PM|PN|PR|PS|PT|PW|PY|QA|RE|RO|RS|RU|RW|SA|SB|SC|SD|SE|SG|SH|SI|SJ|SK|SL|SM|SN|SO|SR|SS|ST|SV|SX|SY|SZ|TC|TD|TF|TG|TH|TJ|TK|TL|TM|TN|TO|TR|TT|TV|TW|TZ|UA|UG|UM|US|UY|UZ|VA|VC|VE|VG|VI|VN|VU|WF|WS|YE|YT|ZA|ZM|ZW)\b/gi
};

/**
 * 获取国家名称
 */
function getCountryName(countryCode) {
  return countryNames[countryCode?.toUpperCase()] || countryCode;
}

/**
 * 获取国旗
 */
function getCountryFlag(countryCode) {
  return countryFlags[countryCode?.toUpperCase()] || '🌍';
}

/**
 * 清理节点名称中的地区标识 - 仅专注于国别标识清理
 */
function cleanRegionFromName(name) {
  let cleanName = name;
  
  if (config.debug) {
    console.log(`🧹 清理前: ${name}`);
  }
  
  // 1. 清理国旗emoji (最高优先级)
  cleanName = cleanName.replace(regionCleanRules.CLEAN_FLAGS, '');
  
  // 2. 清理中文国家/地区名称
  cleanName = cleanName.replace(regionCleanRules.CLEAN_CHINESE_REGIONS, '');
  
  // 3. 清理英文国家/地区名称
  cleanName = cleanName.replace(regionCleanRules.CLEAN_ENGLISH_REGIONS, '');
  
  // 4. 清理城市名称
  cleanName = cleanName.replace(regionCleanRules.CLEAN_CITIES, '');
  
  // 5. 可选：清理英文简称 (仅在启用时)
  if (config.cleanShortCodes) {
    cleanName = cleanName.replace(shortCodeCleanRules.CLEAN_SHORT_CODES, '');
    if (config.debug) {
      console.log(`🔤 清理英文简称后: ${cleanName}`);
    }
  }
  
  // 6. 清理多余的空格和特殊字符
  cleanName = cleanName
    .replace(/\s+/g, ' ')                    // 多个空格合并为一个
    .replace(/^[\s\-\|]+|[\s\-\|]+$/g, '')   // 清理首尾的空格、横线、竖线
    .replace(/^\d+[\.\-\s]*/, '')            // 清理开头的数字
    .trim();
  
  if (config.debug) {
    console.log(`🧹 清理后: ${cleanName || 'Node'}`);
  }
  
  return cleanName || 'Node';  // 如果清理后为空，返回默认名称
}

/**
 * 解析IP地址从节点配置
 */
function extractIPFromProxy(proxy) {
  const server = proxy.server;
  if (!server) return null;
  
  // 检查是否为IP地址
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  if (ipv4Regex.test(server) || ipv6Regex.test(server)) {
    return server;
  }
  
  return null;  // 域名需要DNS解析，这里返回null
}

/**
 * 通过API查询IP地理位置
 */
function queryIPLocationSync(ip) {
  const service = ipServices[config.api];
  if (!service) {
    console.error(`❌ 不支持的API服务: ${config.api}`);
    return null;
  }
  
  try {
    if (config.debug) {
      console.log(`📡 正在查询IP ${ip} 的位置信息，使用API: ${service.name}`);
    }
    
    let url;
    if (config.api === 'ipapi') {
      url = `${service.url}${ip}/json/`;
    } else if (config.api === 'ipinfo') {
      url = config.token 
        ? `${service.url}${ip}/json?token=${config.token}`
        : `${service.url}${ip}/json`;
    } else if (config.api === 'ip2location') {
      url = `${service.url}${ip}`;
    } else {
      url = `${service.url}${ip}`;
    }
    
    let data;
    let requestSuccess = false;
    
    // 尝试不同的HTTP请求方法
    
    // 方法1: curl命令 (Docker/Linux环境优先)
    if (!requestSuccess) {
      try {
        if (typeof process !== 'undefined' && process.versions && process.versions.node) {
          const { execSync } = require('child_process');
          const curlCmd = `curl -s -H "User-Agent: Sub-Store-IP-Detector/5.0" --connect-timeout ${Math.ceil(config.timeout/1000)} --max-time ${Math.ceil(config.timeout/1000)} "${url}"`;
          
          const result = execSync(curlCmd, { 
            encoding: 'utf8',
            timeout: config.timeout,
            maxBuffer: 1024 * 1024
          });
          
          if (result && result.trim()) {
            data = JSON.parse(result.trim());
            requestSuccess = true;
            if (config.debug) console.log(`🌐 curl请求成功`);
          }
        }
      } catch (curlError) {
        if (config.debug) console.log(`curl方法失败: ${curlError.message}`);
      }
    }
    
    // 方法2: $httpClient (Surge/Loon环境)
    if (!requestSuccess && typeof $httpClient !== 'undefined') {
      try {
        if (config.debug) console.log(`🔧 尝试使用$httpClient`);
        const result = $httpClient.get({
          url: url,
          headers: {
            'User-Agent': 'Sub-Store-IP-Detector/5.0'
          },
          timeout: config.timeout / 1000
        });
        
        if (result && result.body) {
          data = JSON.parse(result.body);
          requestSuccess = true;
          if (config.debug) console.log(`🌐 $httpClient请求成功`);
        }
      } catch (clientError) {
        if (config.debug) console.log(`$httpClient方法失败: ${clientError.message}`);
      }
    }
    
    // 方法3: $task.fetch (Quantumult X环境)
    if (!requestSuccess && typeof $task !== 'undefined' && $task.fetch) {
      try {
        if (config.debug) console.log(`🔧 尝试使用$task.fetch`);
        const result = $task.fetch({
          url: url,
          method: 'GET',
          headers: {
            'User-Agent': 'Sub-Store-IP-Detector/5.0'
          },
          timeout: config.timeout
        });
        
        if (result && result.body) {
          data = JSON.parse(result.body);
          requestSuccess = true;
          if (config.debug) console.log(`🌐 $task.fetch请求成功`);
        }
      } catch (taskError) {
        if (config.debug) console.log(`$task.fetch方法失败: ${taskError.message}`);
      }
    }
    
    // 如果所有方法都失败
    if (!requestSuccess || !data) {
      throw new Error('所有HTTP请求方法都失败，请检查网络连接和API服务状态');
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
    
    if (config.debug) {
      console.log(`IP ${ip} 位置: ${locationInfo.country} (${locationInfo.countryCode})`);
    }
    
    return locationInfo;
    
  } catch (error) {
    console.error(`❌ 查询IP ${ip} 失败: ${error.message}`);
    return null;
  }
}

/**
 * 生成新的节点名称
 */
function generateNewNodeName(cleanedName, locationInfo, originalName) {
  let flag = getCountryFlag(locationInfo.countryCode);
  
  // 特殊处理：确保台湾使用自己的旗帜
  if (locationInfo.countryCode?.toUpperCase() === 'TW') {
    flag = '🇹🇼';
  }
  
  switch (config.format) {
    case 'flag':
      return `${flag} ${cleanedName}`;
    
    case 'text':
      const countryName = getCountryName(locationInfo.countryCode);
      return `${countryName} ${cleanedName}`;
    
    case 'both':
      const country = getCountryName(locationInfo.countryCode);
      return `${flag} ${country} ${cleanedName}`;
    
    default:
      return `${flag} ${cleanedName}`;
  }
}

/**
 * 主处理函数
 */
function operator(proxies) {
  console.log(`🚀 开始处理 ${proxies.length} 个节点，使用API: ${config.api}`);
  
  // 应用过滤条件
  let filteredProxies = proxies;
  if (config.include || config.exclude) {
    filteredProxies = proxies.filter(proxy => {
      if (!proxy.name) return false;
      
      const name = proxy.name.toLowerCase();
      
      // 处理包含条件 (include) - 支持多关键词
      let includeMatch = true;
      if (config.include) {
        const includeKeywords = config.include.split('+').map(k => k.toLowerCase().trim());
        includeMatch = includeKeywords.some(keyword => name.includes(keyword));
      }
      
      // 处理排除条件 (exclude) - 支持多关键词
      let excludeMatch = true;
      if (config.exclude) {
        const excludeKeywords = config.exclude.split('+').map(k => k.toLowerCase().trim());
        excludeMatch = !excludeKeywords.some(keyword => name.includes(keyword));
      }
      
      return includeMatch && excludeMatch;
    });
    
    let filterInfo = '';
    if (config.include) filterInfo += `包含关键词: ${config.include.replace(/\+/g, ' 或 ')}`;
    if (config.include && config.exclude) filterInfo += ' 且 ';
    if (config.exclude) filterInfo += `排除关键词: ${config.exclude.replace(/\+/g, ' 或 ')}`;
    
    console.log(`📋 多关键词过滤: ${filterInfo} - 匹配到 ${filteredProxies.length} 个节点`);
  }
  
  let processedCount = 0;
  let successCount = 0;
  let skippedCount = 0;
  
  const results = proxies.map((proxy, index) => {
    // 检查是否需要处理此节点
    let shouldProcess = true;
    
    if (proxy.name) {
      const name = proxy.name.toLowerCase();
      
      // 处理包含条件 (include) - 支持多关键词
      let includeMatch = true;
      if (config.include) {
        const includeKeywords = config.include.split('+').map(k => k.toLowerCase().trim());
        includeMatch = includeKeywords.some(keyword => name.includes(keyword));
      }
      
      // 处理排除条件 (exclude) - 支持多关键词
      let excludeMatch = true;
      if (config.exclude) {
        const excludeKeywords = config.exclude.split('+').map(k => k.toLowerCase().trim());
        excludeMatch = !excludeKeywords.some(keyword => name.includes(keyword));
      }
      
      shouldProcess = includeMatch && excludeMatch;
    } else {
      shouldProcess = !config.include; // 没有名称的节点，只有在没有 include 条件时才处理
    }
    
    if (!shouldProcess) {
      skippedCount++;
      if (config.debug) {
        console.log(`⏭️ 跳过节点 ${index + 1}/${proxies.length}: ${proxy.name} (不匹配过滤条件)`);
      }
      return proxy; // 返回原始节点，不做任何修改
    }
    
    processedCount++;
    
    if (config.debug) {
      console.log(`\n📋 处理节点 ${index + 1}/${proxies.length}: ${proxy.name}`);
    }
    
    // 提取IP地址
    const ip = extractIPFromProxy(proxy);
    if (!ip) {
      if (config.debug) {
        console.log(`⚠️ 跳过域名节点: ${proxy.server}`);
      }
      return proxy;
    }
    
    // 查询IP地理位置
    const locationInfo = queryIPLocationSync(ip);
    if (!locationInfo) {
      console.log(`❌ 无法获取 ${proxy.name} (${ip}) 的地理位置信息`);
      return proxy;
    }
    
    // 清理原节点名称中的地区标识
    const cleanedName = cleanRegionFromName(proxy.name);
    
    // 生成新的节点名称
    const newName = generateNewNodeName(cleanedName, locationInfo, proxy.name);
    
    // 创建新的代理对象
    const newProxy = { ...proxy };
    newProxy.name = newName;
    
    // 添加检测信息（用于调试）
    if (config.debug) {
      newProxy.realCountry = locationInfo.country;
      newProxy.realCountryCode = locationInfo.countryCode;
      newProxy.realIP = ip;
      newProxy.detectionMethod = 'API';
      newProxy.originalName = proxy.name;
      newProxy.cleanedName = cleanedName;
    }
    
    successCount++;
    console.log(`${proxy.name} → ${newName}`);
    
    return newProxy;
  });
  
  console.log(`\n🎉 处理完成: ${successCount}/${processedCount} 个节点成功更新${skippedCount > 0 ? `, ${skippedCount} 个节点已跳过` : ''}`);
  
  return results;
}

// 导出给测试使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    operator,
    config,
    cleanRegionFromName,
    extractIPFromProxy,
    queryIPLocationSync,
    generateNewNodeName
  };
}
