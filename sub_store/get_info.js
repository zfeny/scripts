/**
 * @name         Sub-Store 通用流量查询脚本
 * @author       zfeny & Gemini
 * @version      2.1
 * @description  一个用于 Sub-Store 的通用脚本，通过传入的订阅链接查询流量信息，并将其作为一个自定义节点添加到节点列表顶部。
 * @license      MIT
 * @homepage     https://github.com/zfeny/scripts/blob/main/sub_store/subscribe_traffic.js
 * @update       2025-08-10
 *
 *
 * ===================================================================================
 *
 * ** 使用说明 **
 *
 * 1. 将此脚本的 URL (例如 Raw GitHub 链接) 填入 Sub-Store 的脚本配置中。
 * 2. 在脚本链接后面通过 `#` 添加参数来配置脚本。
 * 3. 多个参数之间使用 `&` 分隔。
 *
 * ===================================================================================
 *
 * ** 快捷参数示例 **
 *
 * 假设你的脚本托管在: https://raw.githubusercontent.com/zfeny/scripts/refs/heads/main/sub_store/get_info.js
 *
 * 配置示例:
 * https://raw.githubusercontent.com/zfeny/scripts/refs/heads/main/sub_store/get_info.js#sub_url=ENCODED_URL&prefix=套餐信息&no_cache=true
 *
 *
 * ===================================================================================
 *
 * ** 参数详解 **
 *
 * 以下是此脚本支持的所有参数，必须以 `#` 开头。
 *
 * --------------------------------- 主要参数 (必需) ---------------------------------
 *
 * [sub_url]
 * 说明：必需参数。用于指定需要查询流量的真实订阅链接。
 * 注意：这个链接的 **值** 必须经过 URL-encode (百分号编码)，否则 Sub-Store 可能无法正确解析。
 * 工具：可以使用 https://www.urlencoder.org/ 等在线工具进行编码。
 * 示例：#sub_url=https%3A%2F%2Fexample.com%2Fapi%3Ftoken%3D123
 *
 * --------------------------------- 可选参数 ---------------------------------
 *
 * [prefix]
 * 说明：给生成的流量信息节点添加一个自定义前缀。
 * 默认：无。
 * 示例：#prefix=【我的套餐】
 *
 * [info_node_type]
 * 说明：设置信息节点的伪装类型。某些客户端对节点类型有要求。
 * 可选值：'ss', 'vmess', 'trojan'。
 * 默认：'ss' (因为它最通用且结构最简单)。
 * 示例：#info_node_type=vmess
 *
 * [no_cache]
 * 说明：在请求 sub_url 时附加一个随机时间戳，以防止 CDN 或服务端缓存旧的流量信息。
 * 可选值：任意值，例如 'true' 或 '1'。只要存在此参数即生效。
 * 默认：不启用。
 * 示例：#no_cache=true
 *
 */

/**
 * Sub-Store 主入口函数
 * @param {Array} proxies - 原始节点列表
 * @param {Object} options - Sub-Store 提供的选项，包含 URL 参数
 * @returns {Array} - 处理后的节点列表
 */
async function operator(proxies, options) {
    // 从 options.args 中读取外部传入的参数
    const {
        sub_url: subUrl,
        prefix = '', // 默认为空字符串
        info_node_type: nodeType = 'ss', // 默认节点类型为 'ss'
        no_cache: noCache
    } = options.args;

    // 如果没有提供 sub_url，则添加一个错误提示节点，并终止脚本
    if (!subUrl) {
        console.error('❌ 脚本错误: 未在订阅链接中通过参数提供 sub_url！');
        proxies.unshift(createErrorProxy('❌ 脚本错误：请提供 sub_url 参数'));
        return proxies;
    }

    try {
        console.log(`🚀 开始执行流量查询脚本...`);

        // 获取并解析流量信息
        const userInfo = await getSubscriptionInfo(subUrl, noCache);

        if (!userInfo) {
            console.warn('⚠️ 未能获取流量信息，跳过添加节点。');
            proxies.unshift(createErrorProxy('⚠️ 流量信息获取失败'));
            return proxies;
        }

        // 创建自定义节点
        const customProxy = createCustomProxy(userInfo, prefix, nodeType);

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
 * @param {boolean} noCache - 是否禁用缓存
 * @returns {Promise<object|null>}
 */
async function getSubscriptionInfo(url, noCache) {
    let finalUrl = url;
    // 如果启用了 no_cache，则在 URL 后附加一个随机时间戳参数
    if (noCache) {
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

    const nodeName = `${prefix} 剩余:${formatBytes(remaining)} | ${remainingDaysStr}`;
    
    // 根据传入的 nodeType 创建不同类型的伪装节点
    const baseNode = { name: nodeName };
    switch (nodeType.toLowerCase()) {
        case 'vmess':
            return { ...baseNode, type: 'vmess', server: '127.0.0.1', port: 80, uuid: '00000000-0000-0000-0000-000000000000', alterId: 0, cipher: 'auto' };
        case 'trojan':
            return { ...baseNode, type: 'trojan', server: '127.0.0.1', port: 80, password: 'info' };
        case 'ss':
        default:
            return { ...baseNode, type: 'ss', server: '127.0.0.1', port: 80, password: 'info', cipher: 'none' };
    }
}

/**
 * 创建一个用于显示错误的节点
 * @param {string} name - 错误信息
 * @returns {object}
 */
function createErrorProxy(name) {
    return { name, type: 'ss', server: '127.0.0.1', port: 80, password: 'error', cipher: 'none' };
}
