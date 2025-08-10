/**
 * @name         Sub-Store 流量查询脚本 (内置配置版)
 * @author       zfeny & Gemini
 * @version      3.1
 * @description  一个用于 Sub-Store 的脚本，通过内置配置查询流量信息，并将其作为一个自定义节点添加到列表顶部。
 * @license      MIT
 * @homepage     https://github.com/zfeny/scripts/
 * @update       2025-08-10
 *
 * * 使用方法:
 * 1. 将此脚本的完整代码粘贴到 Sub-Store 的脚本编辑区域。
 * 2. 修改下方的【配置区域】，填入你自己的信息。
 * 3. 保存脚本并更新订阅。
 */

// #################### 配置区域 (请在此处修改) ####################

const config = {
    // !! 必需 !! 你的真实订阅链接。
    // 请确保链接是完整的，如果包含特殊字符，建议先进行 URL-encode。
    subscriptionUrl: "https://zhuzhuzhu.whtjdasha.c",

    // (可选) 添加在节点名称前面的前缀。
    // 例如: "【我的套餐】"
    prefix: "ℹ️牛逼",

    // (可选) 信息节点的伪装类型。可选值: 'ss', 'vmess', 'trojan'。
    // 'ss' 最为通用。
    nodeType: 'ss',

    // (可选) 是否在请求时禁用缓存。
    // 如果你的流量信息更新不及时，可以设置为 true。
    noCache: true,
    
    // (可选) 信息节点和错误节点的伪装服务器地址。
    infoNodeServer: 'https://zhuzhuzhu.whtjdasha.com',

    // (可选) 信息节点和错误节点的伪装服务器端口。
    infoNodePort: 443,
};

// #################################################################

/**
 * Sub-Store 主入口函数
 * @param {Array} proxies - 原始节点列表
 * @param {Object} options - Sub-Store 提供的选项
 * @returns {Array} - 处理后的节点列表
 */
async function operator(proxies, options) {
    // 检查订阅链接是否已配置
    if (!config.subscriptionUrl) {
        proxies.unshift(createErrorProxy('❌ 脚本错误：请在配置区域填入 subscriptionUrl'));
        return proxies;
    }

    try {
        console.log(`🚀 开始执行流量查询脚本...`);

        // 获取并解析流量信息
        const userInfo = await getSubscriptionInfo(config.subscriptionUrl, config.noCache);

        if (!userInfo) {
            console.warn('⚠️ 未能获取流量信息，跳过添加节点。');
            proxies.unshift(createErrorProxy('⚠️ 流量信息获取失败，请检查链接'));
            return proxies;
        }

        // 创建自定义节点
        const customProxy = createCustomProxy(userInfo, config.prefix, config.nodeType);

        // 将新节点添加到列表的最前面
        proxies.unshift(customProxy);
        
        console.log('✅ 成功添加流量信息节点到列表顶部！');

    } catch (error) {
        console.error('❌ 脚本执行出错:', error);
        proxies.unshift(createErrorProxy(`❌ 脚本异常: ${error.message}`));
    }
    
    return proxies;
}

/**
 * 获取并解析流量信息
 * @param {string} url - 要查询的订阅链接
 * @param {boolean} useNoCache - 是否禁用缓存
 * @returns {Promise<object|null>}
 */
async function getSubscriptionInfo(url, useNoCache) {
    let finalUrl = url;
    if (useNoCache) {
        finalUrl += (url.includes('?') ? '&' : '?') + `_=${Date.now()}`;
    }

    console.log(`正在请求: ${finalUrl}`);
    try {
        const response = await fetch(finalUrl, {
            method: 'GET',
            headers: { 'User-Agent': 'Clash' }
        });
        const userInfoHeader = response.headers.get('subscription-userinfo');
        if (!userInfoHeader) return null;

        const info = {};
        userInfoHeader.split(';').forEach(part => {
            const [key, value] = part.trim().split('=');
            if (key && value) info[key] = Number(value);
        });
        return info;
    } catch (error) {
        console.error('❌ 获取流量信息请求失败:', error.message);
        return null;
    }
}

/**
 * 根据流量信息创建自定义的代理节点
 * @param {object} userInfo
 * @param {string} prefix
 * @param {string} nodeType
 * @returns {object}
 */
function createCustomProxy(userInfo, prefix, nodeType) {
    const formatBytes = (bytes) => {
        if (bytes <= 0) return '0B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))}${sizes[i]}`;
    };

    const calculateRemainingDays = (expireTimestamp) => {
        const now = Date.now();
        const expireTime = expireTimestamp * 1000;
        if (expireTime < now) return '已过期';
        const remainingDays = Math.ceil((expireTime - now) / (1000 * 60 * 60 * 24));
        return `还剩${remainingDays}天`;
    };
    
    const used = userInfo.upload + userInfo.download;
    const total = userInfo.total;
    const remaining = total > used ? total - used : 0;
    const remainingDaysStr = calculateRemainingDays(userInfo.expire);

    const nodeName = `${prefix} | 剩余:${formatBytes(remaining)} | ${remainingDaysStr}`;
    
    const baseNode = { 
        name: nodeName,
        server: config.infoNodeServer,
        port: config.infoNodePort,
    };
    
    switch (nodeType.toLowerCase()) {
        case 'vmess':
            return { ...baseNode, type: 'vmess', uuid: '00000000-0000-0000-0000-000000000000', alterId: 0, cipher: 'auto' };
        case 'trojan':
            return { ...baseNode, type: 'trojan', password: 'info' };
        case 'ss':
        default:
            return { ...baseNode, type: 'ss', password: 'info', cipher: 'none' };
    }
}

/**
 * 创建一个用于显示错误的节点
 * @param {string} name - 错误信息
 * @returns {object}
 */
function createErrorProxy(name) {
    return { 
        name, 
        type: 'ss', 
        server: config.infoNodeServer, 
        port: config.infoNodePort, 
        password: 'error', 
        cipher: 'none' 
    };
}
