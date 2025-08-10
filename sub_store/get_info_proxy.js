/**
 * @name         Sub-Store 节点信息提取脚本
 * @author       zfeny & Gemini
 * @version      1.5
 * @description  一个用于 Sub-Store 的脚本，用于处理将流量和套餐信息作为单独节点提供的情况。脚本会查找并解析这些信息节点，将它们合并成一个，并移除原始信息节点。
 * @license      MIT
 * @homepage     https://github.com/zfeny/scripts/
 * @update       2025-08-10
 *
 * * 使用方法:
 * 1. 将此脚本的完整代码粘贴到 Sub-Store 的脚本编辑区域。
 * 2. 根据你的需求，修改下方的【配置区域】。
 * 3. 保存脚本并更新订阅。
 */

// #################### 配置区域 (请在此处修改) ####################

const config = {
    // (可选) 添加在最终生成的信息节点名称前面的前缀。
    prefix: "ℹ️萌云",

    // (必需) 用于识别“剩余流量”节点的关键词。
    trafficKeyword: "剩余流量:",

    // (必需) 用于识别“套餐到期”节点的关键词。
    expiryKeyword: "套餐到期:",
    
    // (可选) 信息节点和错误节点的伪装服务器地址。
    infoNodeServer: 'sublink.cute-cloud.de',

    // (可选) 信息节点和错误节点的伪装服务器端口。
    infoNodePort: 443,
    
    // (可选) 调试模式。如果开启，在匹配失败时会创建一个包含原始节点名的特殊节点，方便排查问题。
    debug: true,
};

// #################################################################

/**
 * 计算剩余天数
 * @param {string} dateString - 日期字符串, e.g., "2050-08-13"
 * @returns {string} - 格式化后的剩余天数或原始日期
 */
const calculateRemainingDays = (dateString) => {
    if (!dateString) return null;
    const expireDate = new Date(dateString);
    // 检查日期是否有效
    if (isNaN(expireDate.getTime())) {
        return `到期:${dateString}`; // 解析失败则返回原始日期
    }
    const now = new Date();

    // 将时间设置为当天的开始，以确保天数计算准确
    now.setHours(0, 0, 0, 0);
    expireDate.setHours(0, 0, 0, 0);

    const diffTime = expireDate - now;

    if (diffTime < 0) {
        return "已过期";
    }
    
    // 向上取整，例如剩余 0.1 天也算 1 天
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `还剩${diffDays}天`;
};

/**
 * Sub-Store 主入口函数
 * @param {Array} proxies - 原始节点列表
 * @param {Object} options - Sub-Store 提供的选项
 * @returns {Array} - 处理后的节点列表
 */
async function operator(proxies, options) {
    let remainingTraffic = null;
    let expiryDate = null;
    const filteredProxies = [];

    // 自动修正用户可能在关键词中误加的冒号
    const sanitizedTrafficKeyword = config.trafficKeyword.replace(/[:：]$/, '').trim();
    const sanitizedExpiryKeyword = config.expiryKeyword.replace(/[:：]$/, '').trim();

    // 根据关键词创建更精确的正则表达式，匹配到 | 或 丨 或行尾为止
    const trafficRegex = new RegExp(`${sanitizedTrafficKeyword}[:：]\\s*([^|丨]+)`);
    const expiryRegex = new RegExp(`${sanitizedExpiryKeyword}[:：]\\s*([^|丨]+)`);

    console.log('🚀 开始执行节点信息提取脚本...');
    
    // 1. 遍历所有节点，查找信息并过滤掉假节点
    for (const p of proxies) {
        const nodeName = p.name;
        let isInfoNode = false;

        const trafficMatch = nodeName.match(trafficRegex);
        if (trafficMatch && trafficMatch[1]) {
            remainingTraffic = trafficMatch[1].trim();
            isInfoNode = true;
            console.log(`✅ 匹配到流量信息: ${remainingTraffic}`);
        }
        
        const expiryMatch = nodeName.match(expiryRegex);
        if (expiryMatch && expiryMatch[1]) {
            expiryDate = expiryMatch[1].trim();
            isInfoNode = true;
            console.log(`✅ 匹配到到期信息: ${expiryDate}`);
        }

        // 如果不是信息节点，则保留下来
        if (!isInfoNode) {
            filteredProxies.push(p);
        } else {
            console.log(`- 正在移除信息节点: ${nodeName}`);
        }
    }

    // 2. 如果成功找到了信息，则创建并添加合并后的新节点
    if (remainingTraffic || expiryDate) {
        // 构造节点名称
        const parts = [config.prefix];
        if (remainingTraffic) {
            parts.push(`剩余:${remainingTraffic}`);
        }
        if (expiryDate) {
            const remainingDaysStr = calculateRemainingDays(expiryDate);
            parts.push(remainingDaysStr);
        }
        
        const newNodeName = parts.filter(Boolean).join(' | ');

        const newNode = {
            name: newNodeName,
            type: 'trojan',
            server: config.infoNodeServer,
            port: config.infoNodePort,
            password: 'info',
        };
        filteredProxies.unshift(newNode);
        console.log(`✅ 成功合并信息节点: ${newNodeName}`);
    } else {
        console.warn('⚠️ 未在节点列表中找到任何流量或到期信息。请检查关键词配置是否正确。');
        // 在调试模式下，如果匹配失败，则创建一个包含所有原始节点名的特殊节点
        if (config.debug) {
            const originalNames = proxies.map(p => p.name).join(' || ');
            const debugNode = {
                name: `DEBUG:未匹配到! 原始节点名: ${originalNames.slice(0, 250)}`, // 截断以防名称过长
                type: 'ss',
                server: 'debug.info',
                port: 80,
                password: 'debug',
                cipher: 'none'
            };
            // 将调试节点添加到原始节点列表的顶部返回，以便用户看到所有节点
            proxies.unshift(debugNode);
            return proxies;
        }
    }

    return filteredProxies;
}
