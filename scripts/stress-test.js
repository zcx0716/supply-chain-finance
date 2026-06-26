import http from 'http';
import https from 'https';

const API_BASE_URL = 'https://supply-chain-finance-api.cx-zhou716.workers.dev';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '123456';

const MAX_CONCURRENT_REQUESTS = 50;
const TOTAL_REQUESTS = 200;

let token = null;
let completedRequests = 0;
let failedRequests = 0;
let totalLatency = 0;
let startTime = 0;
let endTime = 0;
const latencies = [];

const log = (msg) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${msg}`);
};

const fetch = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const parsedUrl = new URL(url);
    
    const req = protocol.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (url.startsWith('https') ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : {},
            headers: res.headers
          });
        } catch (e) {
          resolve({ status: res.statusCode, body: data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
};

const login = async () => {
  log('开始登录...');
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { username: ADMIN_USERNAME, password: ADMIN_PASSWORD }
  });
  
  if (response.status === 200) {
    token = response.body.token;
    log(`登录成功，Token获取`);
    return true;
  }
  
  log(`登录失败: ${response.status}`);
  return false;
};

const testEndpoint = async (endpoint, method = 'GET', body = null) => {
  const requestStart = Date.now();
  
  try {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body
    });
    
    const latency = Date.now() - requestStart;
    latencies.push(latency);
    totalLatency += latency;
    
    if (response.status >= 200 && response.status < 300) {
      completedRequests++;
      return { success: true, latency, status: response.status };
    } else {
      failedRequests++;
      return { success: false, latency, status: response.status };
    }
  } catch (error) {
    const latency = Date.now() - requestStart;
    latencies.push(latency);
    failedRequests++;
    return { success: false, latency, error: error.message };
  }
};

const runStressTest = async () => {
  const loginSuccess = await login();
  if (!loginSuccess) {
    log('登录失败，无法进行压力测试');
    return;
  }
  
  startTime = Date.now();
  log(`开始压力测试: ${TOTAL_REQUESTS} 请求, 并发: ${MAX_CONCURRENT_REQUESTS}`);
  
  const endpoints = [
    { endpoint: '/api/customers', method: 'GET' },
    { endpoint: '/api/orders', method: 'GET' },
    { endpoint: '/api/plans/receivable', method: 'GET' },
    { endpoint: '/api/plans/payable', method: 'GET' },
    { endpoint: '/api/payments', method: 'GET' },
    { endpoint: '/api/contracts/templates', method: 'GET' },
    { endpoint: '/api/auth/me', method: 'GET' }
  ];
  
  const queue = [];
  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    const randomEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    queue.push(() => testEndpoint(randomEndpoint.endpoint, randomEndpoint.method));
  }
  
  const executeBatch = async (batch) => {
    return Promise.all(batch.map(fn => fn()));
  };
  
  const results = [];
  for (let i = 0; i < queue.length; i += MAX_CONCURRENT_REQUESTS) {
    const batch = queue.slice(i, Math.min(i + MAX_CONCURRENT_REQUESTS, queue.length));
    const batchResults = await executeBatch(batch);
    results.push(...batchResults);
    
    const progress = Math.min(i + MAX_CONCURRENT_REQUESTS, queue.length);
    const progressPercent = ((progress / queue.length) * 100).toFixed(1);
    log(`进度: ${progress}/${queue.length} (${progressPercent}%)`);
  }
  
  endTime = Date.now();
  const totalTime = endTime - startTime;
  
  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)];
  const p90 = latencies[Math.floor(latencies.length * 0.9)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];
  
  console.log('\n' + '='.repeat(60));
  console.log('压力测试报告');
  console.log('='.repeat(60));
  console.log(`总请求数: ${TOTAL_REQUESTS}`);
  console.log(`成功请求: ${completedRequests}`);
  console.log(`失败请求: ${failedRequests}`);
  console.log(`成功率: ${((completedRequests / TOTAL_REQUESTS) * 100).toFixed(2)}%`);
  console.log(`总耗时: ${totalTime}ms`);
  console.log(`QPS: ${(TOTAL_REQUESTS / (totalTime / 1000)).toFixed(2)}`);
  console.log('\n延迟统计:');
  console.log(`最小延迟: ${latencies[0]}ms`);
  console.log(`最大延迟: ${latencies[latencies.length - 1]}ms`);
  console.log(`平均延迟: ${(totalLatency / TOTAL_REQUESTS).toFixed(2)}ms`);
  console.log(`P50延迟: ${p50}ms`);
  console.log(`P90延迟: ${p90}ms`);
  console.log(`P99延迟: ${p99}ms`);
  console.log('='.repeat(60));
  
  const errorResults = results.filter(r => !r.success);
  if (errorResults.length > 0) {
    console.log('\n失败请求详情 (前10条):');
    errorResults.slice(0, 10).forEach((r, i) => {
      console.log(`${i + 1}. 延迟: ${r.latency}ms, 状态: ${r.status || 'error'}, 错误: ${r.error || 'N/A'}`);
    });
  }
};

runStressTest().catch(console.error);