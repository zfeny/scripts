/**
 * Sub-Store 终极调试脚本
 *
 * 功能:
 * 1. 请求 S.args.sub_url。
 * 2. 不解析任何节点。
 * 3. 创建一个唯一的节点，其名称为：
 * - 如果成功获取到流量头，名称就是流量头的完整内容。
 * - 如果没有获取到流量头，名称就是警告信息。
 * - 如果请求失败，名称就是错误信息。
 * 这能帮助我们判断 Sub-Store 环境下网络请求和头部读取是否正常。
 */
async function main(S) {
  // --- 参数处理 ---
  const args = { ...S.args };
  const scriptUrl = S.source.url;
  if (scriptUrl && scriptUrl.includes('#')) {
    try {
      const hashPart = scriptUrl.split('#')[1];
      const hashParams = new URLSearchParams(hashPart);
      for (const [key, value] of hashParams.entries()) {
        args[key] = value;
      }
    } catch (e) {
      console.error(`解析 URL hash 参数失败: ${e.message}`);
    }
  }
  
  const subUrl = args.sub_url;

  if (!subUrl) {
    return [{ name: '❌ 错误：参数中未提供 "sub_url"', type: 'ss', server: '1.1.1.1', port: 80, cipher: 'aes-256-gcm', password: 'debug' }];
  }

  try {
    const response = await S.axios.get(subUrl, {
      headers: { 'User-Agent': 'Clash/2023.08.17' }
    });

    const userInfoHeader = response.headers['subscription-userinfo'];

    let resultNodeName = '';
    if (userInfoHeader) {
      resultNodeName = `✅ 成功获取头部: ${userInfoHeader}`;
    } else {
      resultNodeName = `⚠️ 警告：响应中未找到 "subscription-userinfo" 头部。`;
    }
    
    // 只返回一个调试节点
    return [{
      name: resultNodeName,
      type: 'ss', // 使用一个简单的类型
      server: 'debug.info',
      port: 80,
      cipher: 'aes-256-gcm',
      password: 'debug'
    }];

  } catch (error) {
    let errorMessage = `❌ 错误：请求订阅失败 - ${error.message}`;
    if (error.response) {
      errorMessage += ` | Status: ${error.response.status}`;
    }
    return [{ name: errorMessage, type: 'ss', server: '1.1.1.1', port: 80, cipher: 'aes-256-gcm', password: 'debug' }];
  }
}
