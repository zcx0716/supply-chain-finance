import fetch from 'node-fetch';

const API_BASE_URL = 'https://supply-chain-finance-api.cx-zhou716.workers.dev';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '123456';

let token = null;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url, options = {}, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return await response.json();
      }
      console.log(`请求失败，状态码: ${response.status}，重试 ${i + 1}/${retries}`);
    } catch (error) {
      console.log(`请求异常: ${error.message}，重试 ${i + 1}/${retries}`);
    }
    await delay(1000 * (i + 1));
  }
  throw new Error(`请求失败，已重试 ${retries} 次`);
};

const login = async () => {
  const data = await fetchWithRetry(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD })
  });
  token = data.token;
  console.log('登录成功，Token获取');
  return token;
};

const createCustomer = async (customer) => {
  await delay(200);
  const data = await fetchWithRetry(`${API_BASE_URL}/api/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(customer)
  });
  return data;
};

const createOrder = async (order) => {
  await delay(300);
  const data = await fetchWithRetry(`${API_BASE_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(order)
  });
  return data;
};

const createReceivablePlan = async (plan) => {
  await delay(200);
  const data = await fetchWithRetry(`${API_BASE_URL}/api/plans/receivable`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(plan)
  });
  return data;
};

const createPayablePlan = async (plan) => {
  await delay(200);
  const data = await fetchWithRetry(`${API_BASE_URL}/api/plans/payable`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(plan)
  });
  return data;
};

const createPayment = async (payment) => {
  await delay(200);
  const data = await fetchWithRetry(`${API_BASE_URL}/api/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payment)
  });
  return data;
};

const createContractTemplate = async (template) => {
  await delay(200);
  const data = await fetchWithRetry(`${API_BASE_URL}/api/contracts/templates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(template)
  });
  return data;
};

const generateRandomAmount = (min, max) => {
  return Math.floor(Math.random() * (max - min) + min);
};

const generateDate = (daysFromNow) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

const customerNames = [
  '北京华信科技有限公司',
  '上海恒达贸易集团',
  '广州盛达实业有限公司',
  '深圳创新科技有限公司',
  '杭州金利集团',
  '南京远景科技有限公司',
  '成都兴旺商贸有限公司',
  '武汉宏图实业集团',
  '西安伟业科技有限公司',
  '天津华茂贸易有限公司',
  '苏州腾飞科技有限公司',
  '重庆宏图商贸有限公司',
  '青岛恒利实业集团',
  '大连华盛科技有限公司',
  '厦门盛达贸易有限公司'
];

const regions = ['华北', '华东', '华南', '西南', '华中', '西北', '东北'];
const industries = ['制造业', '贸易', '科技', '金融', '物流', '零售', '服务'];

const mainCompanyNames = [
  '中国供应链集团有限公司',
  '华夏金融控股集团',
  '国际物流供应链有限公司'
];

const generateTestData = async () => {
  console.log('开始生成测试数据...');
  
  await login();
  
  const mainCompanies = [];
  for (let i = 0; i < mainCompanyNames.length; i++) {
    const company = await createCustomer({
      name: mainCompanyNames[i],
      unified_credit_code: `91100000${String(i + 1).padStart(12, '0')}`,
      contact_person: `负责人${i + 1}`,
      contact_phone: `1380000${String(i + 1).padStart(4, '0')}`,
      address: `${['北京', '上海', '深圳'][i]}市朝阳区`,
      region: ['华北', '华东', '华南'][i],
      industry: '金融'
    });
    mainCompanies.push(company);
    console.log(`创建主公司: ${company.name || '未知'}`);
  }
  
  const customers = [];
  for (let i = 0; i < customerNames.length; i++) {
    const customer = await createCustomer({
      name: customerNames[i],
      unified_credit_code: `91${String(i + 100).padStart(14, '0')}`,
      contact_person: ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'][i % 8],
      contact_phone: `139${String(i + 1000).padStart(8, '0')}`,
      address: `${['北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉'][i % 8]}市`,
      region: regions[i % regions.length],
      industry: industries[i % industries.length]
    });
    customers.push(customer);
    console.log(`创建客户: ${customer.name || '未知'}`);
  }
  
  const orders = [];
  for (let i = 0; i < 20; i++) {
    const mainCompany = mainCompanies[i % mainCompanies.length];
    const upstreamCount = Math.floor(Math.random() * 2) + 1;
    const downstreamCount = Math.floor(Math.random() * 2) + 1;
    
    const upstreams = [];
    let totalUpstreamAmount = 0;
    for (let j = 0; j < upstreamCount; j++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const amount = generateRandomAmount(50000, 500000);
      upstreams.push({ company: customer, amount });
      totalUpstreamAmount += amount;
    }
    
    const downstreams = [];
    let totalDownstreamAmount = 0;
    for (let j = 0; j < downstreamCount; j++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const amount = generateRandomAmount(50000, 500000);
      downstreams.push({ company: customer, amount });
      totalDownstreamAmount += amount;
    }
    
    const order = await createOrder({
      mainCompany,
      upstreams,
      downstreams,
      receivableAmount: totalDownstreamAmount,
      payableAmount: totalUpstreamAmount,
      currency: 'CNY'
    });
    orders.push(order);
    console.log(`创建订单: ${order.orderNo || '未知'}, 应收: ${totalDownstreamAmount}, 应付: ${totalUpstreamAmount}`);
  }
  
  for (const order of orders) {
    for (const downstream of order.downstreams || []) {
      const installmentCount = Math.floor(Math.random() * 3) + 1;
      const installments = [];
      let remainingAmount = downstream.amount;
      
      for (let i = 0; i < installmentCount; i++) {
        const amount = i === installmentCount - 1 ? remainingAmount : Math.floor(remainingAmount / (installmentCount - i));
        remainingAmount -= amount;
        installments.push({
          amount,
          plannedDate: generateDate(i * 30 + 30),
          actualDate: Math.random() > 0.7 ? generateDate(Math.floor(Math.random() * 30)) : null,
          status: Math.random() > 0.7 ? 'completed' : Math.random() > 0.5 ? 'partial' : 'pending',
          notes: `收款计划${i + 1}`
        });
      }
      
      await createReceivablePlan({
        orderId: order.id,
        downstreamId: downstream.company?.id,
        downstreamName: downstream.company?.name,
        totalAmount: downstream.amount,
        installments
      });
    }
    
    for (const upstream of order.upstreams || []) {
      const installmentCount = Math.floor(Math.random() * 3) + 1;
      const installments = [];
      let remainingAmount = upstream.amount;
      
      for (let i = 0; i < installmentCount; i++) {
        const amount = i === installmentCount - 1 ? remainingAmount : Math.floor(remainingAmount / (installmentCount - i));
        remainingAmount -= amount;
        installments.push({
          amount,
          plannedDate: generateDate(i * 30 + 15),
          actualDate: Math.random() > 0.6 ? generateDate(Math.floor(Math.random() * 30)) : null,
          status: Math.random() > 0.6 ? 'completed' : Math.random() > 0.5 ? 'partial' : 'pending',
          notes: `付款计划${i + 1}`
        });
      }
      
      await createPayablePlan({
        orderId: order.id,
        upstreamId: upstream.company?.id,
        upstreamName: upstream.company?.name,
        totalAmount: upstream.amount,
        installments
      });
    }
    
    if (Math.random() > 0.5) {
      const paymentAmount = generateRandomAmount(10000, 100000);
      await createPayment({
        orderId: order.id,
        amount: paymentAmount,
        date: generateDate(Math.floor(Math.random() * 10)),
        payer: order.mainCompany?.name || '未知',
        payee: order.downstreams?.[0]?.company?.name || '未知',
        notes: `预付款${paymentAmount}`
      });
    }
  }
  
  const templates = [
    {
      name: '采购合同模板',
      content: `甲方：{mainCompanyName}
乙方：{customerName}
合同金额：{totalAmount}元
应付金额：{payableAmount}元
应收金额：{receivableAmount}元
签订日期：{signDate}`,
      type: 'purchase'
    },
    {
      name: '销售合同模板',
      content: `卖方：{mainCompanyName}
买方：{customerName}
合同总额：{totalAmount}元
付款方式：分期
付款计划：{installmentPlan}`,
      type: 'sales'
    },
    {
      name: '融资协议模板',
      content: `甲方（借款人）：{customerName}
乙方（出借人）：{mainCompanyName}
融资本金：{principal}元
利率：{interestRate}%
还款日期：{repaymentDate}`,
      type: 'financing'
    }
  ];
  
  for (const template of templates) {
    await createContractTemplate(template);
    console.log(`创建合同模板: ${template.name}`);
  }
  
  console.log('\n测试数据生成完成！');
  console.log(`主公司: ${mainCompanies.length}个`);
  console.log(`客户: ${customers.length}个`);
  console.log(`订单: ${orders.length}个`);
};

generateTestData().catch(console.error);