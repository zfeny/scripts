/**
 * 测试IP地理位置检测脚本
 */

// 模拟Sub-Store环境
const $arguments = {
  api: 'ip-api',
  format: 'flag',
  prefix: '✅'
};

// 引入主脚本
const fs = require('fs');
const path = require('path');

// 读取并执行主脚本
const scriptPath = path.join(__dirname, 'ip_detector_simple.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

// 执行脚本
eval(scriptContent);

// 测试数据
const testProxies = [
  {
    name: 'Test SG Node',
    server: '8.8.8.8',
    port: 443,
    type: 'vmess'
  },
  {
    name: 'Test HK Node',
    server: '103.81.86.126',
    port: 443,
    type: 'trojan'
  },
  {
    name: 'Test US Node',
    server: '104.239.87.62',
    port: 443,
    type: 'ss'
  },
  {
    name: 'Test Domain Node',
    server: 'example.com',
    port: 443,
    type: 'vmess'
  }
];

console.log('开始测试IP地理位置检测...\n');

// 执行测试
const results = operator(testProxies);

console.log('\n=== 测试结果 ===');
results.forEach((proxy, index) => {
  console.log(`${index + 1}. ${proxy.name}`);
  if (proxy.realCountry) {
    console.log(`   国家: ${proxy.realCountry}, IP: ${proxy.realIP}`);
    console.log(`   检测方法: ${proxy.detectionMethod}`);
  }
  console.log('');
});
