/**
 * Sub-Store IP地理位置检测脚本 - 最终版
 * 功能：通过API精准检测代理节点真实IP地理位置，清除原有地区标识，只保留API获取的国别flag
 * 作者：zfeny
 * 版本：5.0 Final
 * 更新：2025-08-08
 * 
 * 使用方法：
 * https://raw.githubusercontent.com/zfeny/scripts/refs/heads/main/sub_store/ip_detector_final.js#api=ip-api&format=flag&prefix=✅
 * 
 * 参数说明：
 * - api: API服务 (ip-api, ipinfo, ip2location)
 * - format: 输出格式 (flag, text, both)
 * - prefix: 前缀标识 (如: ✅, 🌍, 📍)
 * - debug: 调试模式 (true/false)
 * - timeout: 超时时间毫秒 (默认10000)
 */

// 配置参数解析
const scriptArgs = (typeof $arguments !== 'undefined') ? $arguments : {};
const config = {
  api: scriptArgs.api || 'ip-api',
  format: scriptArgs.format || 'flag',
  prefix: scriptArgs.prefix || '✅',
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

// 地区清理规则 - 借鉴rename.js的清理逻辑
const regionCleanRules = {
  // 国家/地区名称清理
  '🇭🇰': /香港|港|HK|Hong\s?Kong|Hongkong|HONG\s?KONG|(深|沪|呼|京|广|杭)港(?!.*(I|线))/gi,
  '🇹🇼': /台湾|台|TW|Taiwan|Taipei|新台|新北|台(?!.*线)/gi,
  '🇯🇵': /日本|日|JP|Japan|Tokyo|Osaka|东京|大坂|(深|沪|呼|京|广|杭|中|辽)日(?!.*(I|线))/gi,
  '🇰🇷': /韩国|韩|KR|Korea|Seoul|首尔|春川/gi,
  '🇸🇬': /新加坡|新|SG|Singapore|狮城|(深|沪|呼|京|广|杭)新/gi,
  '🇺🇸': /美国|美|US|USA|United\s?States|Los\s?Angeles|San\s?Jose|Silicon\s?Valley|Michigan|波特兰|芝加哥|哥伦布|纽约|硅谷|俄勒冈|西雅图|(深|沪|呼|京|广|杭)美/gi,
  '🇬🇧': /英国|英|GB|UK|United\s?Kingdom|London|Great\s?Britain|伦敦/gi,
  '🇩🇪': /德国|德|DE|Germany|Frankfurt|法兰克福|(深|沪|呼|京|广|杭)德(?!.*(I|线))|滬德/gi,
  '🇫🇷': /法国|法|FR|France|Paris|巴黎/gi,
  '🇦🇺': /澳大利亚|澳洲|澳|AU|Australia|墨尔本|悉尼|土澳|(深|沪|呼|京|广|杭)澳/gi,
  '🇨🇦': /加拿大|加|CA|Canada/gi,
  '🇷🇺': /俄罗斯|俄|RU|Russia|Moscow|莫斯科/gi,
  '🇹🇷': /土耳其|土|TR|Turkey|伊斯坦布尔/gi,
  '🇮🇳': /印度|印|IN|India|Mumbai|孟买/gi,
  '🇮🇩': /印尼|印度尼西亚|ID|Indonesia|雅加达/gi,
  '🇹🇭': /泰国|泰|TH|Thailand|泰國|曼谷/gi,
  '🇻🇳': /越南|越|VN|Vietnam/gi,
  '🇵🇭': /菲律宾|菲|PH|Philippines/gi,
  '🇲🇾': /马来西亚|马来|马|MY|Malaysia/gi,
  '🇦🇪': /阿联酋|阿拉伯联合酋长国|AE|UAE|Dubai|迪拜|United\s?Arab\s?Emirates/gi,
  '🇨🇭': /瑞士|瑞|CH|Switzerland|Zurich/gi,
  '🇧🇩': /孟加拉国|孟加拉|BD|Bangladesh/gi,
  '🇨🇿': /捷克|捷克共和国|CZ|Czech/gi,
  '🇧🇦': /波黑|波斯尼亚和黑塞哥维那|波黑共和国|BA|Bosnia/gi,
  
  // 通用地区标识清理
  'CLEAN_GENERIC': /[\u4e00-\u9fff]+(港|台|日|韩|新|美|英|德|法|澳|加|俄|土|印|泰|越|菲|马|阿|瑞|孟|捷|波)/gi,
  'CLEAN_BRACKETS': /[\(\[【][\u4e00-\u9fff\w\s\-\.]+[\)\]】]/gi,
  'CLEAN_NODES': /(节点|代理|服务器|专线|中继|IPLC|IEPL|BGP|线路|机房|数据中心)/gi,
  'CLEAN_NUMBERS': /\s*[\-\|]\s*\d+/gi,
  'CLEAN_EXTRA': /(高速|优化|专用|标准|精品|企业|家宽|商宽)/gi
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
 * 清理节点名称中的地区标识
 */
function cleanRegionFromName(name) {
  let cleanName = name;
  
  // 使用地区清理规则
  Object.entries(regionCleanRules).forEach(([flag, regex]) => {
    if (flag.startsWith('CLEAN_')) {
      // 通用清理规则
      cleanName = cleanName.replace(regex, '');
    } else {
      // 特定地区清理规则
      cleanName = cleanName.replace(regex, '');
    }
  });
  
  // 清理多余的空格和特殊字符
  cleanName = cleanName
    .replace(/\s+/g, ' ')                    // 多个空格合并为一个
    .replace(/^[\s\-\|]+|[\s\-\|]+$/g, '')   // 清理首尾的空格、横线、竖线
    .replace(/^\d+[\.\-\s]*/, '')            // 清理开头的数字
    .trim();
  
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
      url = `${service.url}${ip}/json`;
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
      console.log(`✅ IP ${ip} 位置: ${locationInfo.country} (${locationInfo.countryCode})`);
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
  const flag = getCountryFlag(locationInfo.countryCode);
  
  switch (config.format) {
    case 'flag':
      return config.prefix ? `${config.prefix} ${flag} ${cleanedName}` : `${flag} ${cleanedName}`;
    
    case 'text':
      const countryName = getCountryName(locationInfo.countryCode);
      return config.prefix ? `${config.prefix} ${countryName} ${cleanedName}` : `${countryName} ${cleanedName}`;
    
    case 'both':
      const country = getCountryName(locationInfo.countryCode);
      return config.prefix ? `${config.prefix} ${flag} ${country} ${cleanedName}` : `${flag} ${country} ${cleanedName}`;
    
    default:
      return config.prefix ? `${config.prefix} ${flag} ${cleanedName}` : `${flag} ${cleanedName}`;
  }
}

/**
 * 主处理函数
 */
function operator(proxies) {
  console.log(`🚀 开始处理 ${proxies.length} 个节点，使用API: ${config.api}`);
  
  let processedCount = 0;
  let successCount = 0;
  
  const results = proxies.map((proxy, index) => {
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
    console.log(`✅ ${proxy.name} → ${newName}`);
    
    return newProxy;
  });
  
  console.log(`\n🎉 处理完成: ${successCount}/${processedCount} 个节点成功更新`);
  
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
