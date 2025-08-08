/**
 * Sub-Store 节点重命名脚本 - 测试版本
 * 这个版本专门用于测试和调试
 */

function operator(proxies) {
  console.log('=== 脚本开始执行 ===');
  console.log('接收到的参数:', JSON.stringify($arguments, null, 2));
  console.log('输入节点数量:', proxies ? proxies.length : 0);
  
  if (!Array.isArray(proxies)) {
    console.log('错误: 输入不是数组');
    return proxies;
  }
  
  if (proxies.length === 0) {
    console.log('警告: 没有节点需要处理');
    return proxies;
  }
  
  // 显示输入的节点信息
  console.log('=== 输入节点信息 ===');
  proxies.forEach((proxy, index) => {
    console.log(`节点 ${index + 1}:`, {
      name: proxy.name,
      server: proxy.server,
      hostname: proxy.hostname,
      host: proxy.host,
      type: proxy.type
    });
  });
  
  // 处理节点
  const results = proxies.map((proxy, index) => {
    const newProxy = { ...proxy };
    const originalName = proxy.name || `未命名节点${index + 1}`;
    
    // 添加测试标记
    newProxy.name = `✅ 已检测 ${originalName}`;
    newProxy.testProcessed = true;
    newProxy.processTime = new Date().toISOString();
    
    return newProxy;
  });
  
  console.log('=== 处理结果 ===');
  results.forEach((proxy, index) => {
    console.log(`结果 ${index + 1}: ${proxy.name}`);
  });
  
  console.log('=== 脚本执行完成 ===');
  return results;
}

// 确保函数可用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { operator };
}

console.log('脚本已加载，等待执行...');
