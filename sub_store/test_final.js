/**
 * 测试最终版IP地理位置检测脚本
 */

// 模拟Sub-Store环境
const $arguments = {
  api: 'ip-api',
  format: 'flag',
  prefix: '✅',
  debug: 'true'
};

// 引入主脚本
const fs = require('fs');
const path = require('path');

// 读取并执行主脚本
const scriptPath = path.join(__dirname, 'ip_detector_final.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

// 执行脚本
eval(scriptContent);

// 测试数据 - 包含各种原始节点名称格式
const testProxies = [
  {
    name: '🇸🇬 新加坡1-HY2协议',
    server: '154.18.239.101',
    port: 26315,
    type: 'vmess'
  },
  {
    name: '🇯🇵 日本三网优化',
    server: '96.62.214.247',
    port: 6569,
    type: 'trojan'
  },
  {
    name: '🇺🇸 美国-ChatGPT',
    server: '206.206.123.187',
    port: 8502,
    type: 'ss'
  },
  {
    name: '🇺🇸 2美国-三网优化',
    server: '38.146.28.92',
    port: 8819,
    type: 'vmess'
  },
  {
    name: 'hysteria2 香港节点01',
    server: '103.81.86.126',
    port: 443,
    type: 'hysteria2'
  },
  {
    name: '新加坡高速专线',
    server: '8.8.8.8',
    port: 443,
    type: 'vmess'
  },
  {
    name: '日本东京BGP线路',
    server: '104.239.87.62',
    port: 443,
    type: 'trojan'
  },
  {
    name: '美国洛杉矶IPLC',
    server: '1.1.1.1',
    port: 443,
    type: 'ss'
  },
  {
    name: '域名节点测试',
    server: 'example.com',
    port: 443,
    type: 'vmess'
  }
];

console.log('🧪 开始测试最终版IP地理位置检测脚本...\n');

// 执行测试
const results = operator(testProxies);

console.log('\n=== 📊 测试结果对比 ===');
results.forEach((proxy, index) => {
  const originalProxy = testProxies[index];
  console.log(`\n${index + 1}. 原始: ${originalProxy.name}`);
  console.log(`   新名: ${proxy.name}`);
  
  if (proxy.realCountry) {
    console.log(`   📍 检测: ${proxy.realCountry} (${proxy.realCountryCode}), IP: ${proxy.realIP}`);
    console.log(`   🧹 清理: "${proxy.originalName}" → "${proxy.cleanedName}"`);
    console.log(`   🌐 方法: ${proxy.detectionMethod}`);
  } else {
    console.log(`   ⚠️  状态: 未检测 (可能是域名节点)`);
  }
});

console.log('\n=== 🎯 功能验证 ===');
console.log(`✅ 地区标识清理: 检查是否成功移除原有国旗和地区文字`);
console.log(`✅ API精准检测: 检查是否通过API获取真实地理位置`);
console.log(`✅ 格式化输出: 检查是否按照指定格式生成新名称`);
console.log(`✅ 域名处理: 检查域名节点是否正确跳过`);

console.log('\n🏁 测试完成！');
