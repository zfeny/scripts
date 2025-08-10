/**
 * Sub-Store 可传参远程流量统计脚本 (支持 URL Hash 参数)
 *
 * 工作模式: main 函数
 * 功能:
 * 1. 优先从脚本自身的 URL hash (#) 中解析参数。
 * 2. 如果 hash 中没有，则从 Sub-Store UI 的 S.args 中获取参数。
 * 3. 接收一个名为 `sub_url` 的订阅链接参数。
 * 4. 主动请求该订阅链接，解析流量信息和节点。
 * 5. 创建一个虚拟信息节点并置顶。
 * 6. 返回最终的节点列表。
 *
 * @param {object} S - Sub-Store 提供的全局对象，包含上下文和工具。
 * @returns {Promise<Array>} - 返回一个 Promise，解析为节点对象数组。
 */

// 脚本主入口，必须是 async function
async function main(S) {
  // --- 参数处理 ---
  // 1. 默认使用在 Sub-Store UI 中填写的 S.args
  const args = { ...S.args };

  // 2. 解析脚本自身 URL 的 hash 部分，并用其覆盖默认参数
  // S.source.url 是 Sub-Store 配置中填写的脚本链接
  const scriptUrl = S.source.url;
  if (scriptUrl && scriptUrl.includes('#')) {
    try {
      // 获取 # 后面的部分，并使用 URLSearchParams 解析
      const hashPart = scriptUrl.split('#')[1];
      const hashParams = new URLSearchParams(hashPart);
      for (const [key, value] of hashParams.entries()) {
        // URL hash 中的参数优先级更高
        args[key] = value;
      }
    } catch (e) {
      // 如果解析失败，可以在日志中记录错误，但继续执行
      console.error(`解析 URL hash 参数失败: ${e.message}`);
    }
  }

  // 3. 从最终合并的参数中获取 sub_url
  const subUrl = args.sub_url;

  // --- 检查参数 ---
  if (!subUrl) {
    return [{
      name: '❌ 错误：脚本参数中未提供 "sub_url"',
      type: 'vless', server: 'error.info', port: 443, uuid: '00000000-0000-0000-0000-000000000000',
      tls: true, servername: 'error.info', network: 'ws', 'ws-opts': { path: '/' }
    }];
  }

  try {
    // --- 发起网络请求 ---
    const response = await S.axios.get(subUrl, {
      headers: { 'User-Agent': 'Clash/2023.08.17' }
    });

    // --- 解析数据 ---
    const proxies = S.utils.parseProxies(response.data);
    const userInfoHeader = response.headers['subscription-userinfo'];

    if (!userInfoHeader) {
      return proxies;
    }

    // --- 流量信息处理 ---
    const info = {};
    userInfoHeader.split(';').forEach(item => {
      const parts = item.split('=');
      if (parts.length === 2) {
        info[parts[0].trim()] = parts[1].trim();
      }
    });

    const upload = Number(info.upload) || 0;
    const download = Number(info.download) || 0;
    const total = Number(info.total) || 0;
    const expire = Number(info.expire) || 0;

    // --- 格式化显示 ---
    const bytesToSize = (bytes) => {
      if (bytes <= 0) return '0 B';
      const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    };
    
    const formatExpireDate = (timestamp) => {
      if (!timestamp) return 'N/A';
      const date = new Date(timestamp * 1000);
      if (isNaN(date.getTime())) return 'N/A';
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    };

    const used = upload + download;
    const remaining = total - used;
    const percentage = total > 0 ? ((remaining / total) * 100).toFixed(0) : 0;
    
    const nodeName = `📈 流量 | 剩 ${percentage}% | ${bytesToSize(remaining)} | ${formatExpireDate(expire)} 到期`;

    // --- 创建信息节点 ---
    const trafficNode = {
      name: nodeName,
      type: 'vless', server: 'traffic.info.substore', port: 443, uuid: '00000000-0000-0000-0000-000000000000',
      tls: true, servername: 'traffic.info.substore', network: 'ws', 'ws-opts': { path: '/' }
    };

    proxies.unshift(trafficNode);
    return proxies;

  } catch (error) {
    // --- 错误处理 ---
    return [{
      name: `❌ 错误：获取订阅失败 - ${error.message}`,
      type: 'vless', server: 'error.info', port: 443, uuid: '00000000-0000-0000-0000-000000000000',
      tls: true, servername: 'error.info', network: 'ws', 'ws-opts': { path: '/' }
    }];
  }
}
