import { create } from 'zustand';
import { Company, Customer, Order, ReceivablePlan, PayablePlan, PaymentRecord, Contract, Toast, User, PaymentInstallment, ContractTemplate } from '../types';
import { generateInstallments } from '../utils/paymentCalculator';

const STORAGE_KEYS = {
  USERS: 'scm_users',
  COMPANIES: 'scm_companies',
  CUSTOMERS: 'scm_customers',
  ORDERS: 'scm_orders',
  RECEIVABLE_PLANS: 'scm_receivable_plans',
  PAYABLE_PLANS: 'scm_payable_plans',
  PAYMENT_RECORDS: 'scm_payment_records',
  CONTRACTS: 'scm_contracts',
  CONTRACT_FILES: 'scm_contract_files',
};

const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed.map(item => {
        if (item.createdAt) item.createdAt = new Date(item.createdAt);
        if (item.updatedAt) item.updatedAt = new Date(item.updatedAt);
        if (item.plannedDate) item.plannedDate = new Date(item.plannedDate);
        if (item.actualDate) item.actualDate = new Date(item.actualDate);
        if (item.date) item.date = new Date(item.date);
        if (!item.currency && key === STORAGE_KEYS.ORDERS) item.currency = 'CNY';
        if (!item.linkedOrderIds) item.linkedOrderIds = [];
        if (!item.upstreams) item.upstreams = [];
        if (!item.downstreams) item.downstreams = [];
        if (!item.receivableAmount) item.receivableAmount = 0;
        if (!item.payableAmount) item.payableAmount = 0;
        if (item.installments) {
          item.installments = item.installments.map((inst: PaymentInstallment) => ({
            ...inst,
            plannedDate: new Date(inst.plannedDate),
            actualDate: inst.actualDate ? new Date(inst.actualDate) : undefined,
          }));
        }
        return item;
      }) as T;
    }
    return parsed;
  } catch (error) {
    console.error(`Error loading ${key} from storage:`, error);
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to storage:`, error);
  }
};

interface AppState {
  user: User | null;
  isLoggedIn: boolean;
  isAuthenticated: boolean;
  companies: Company[];
  customers: Customer[];
  orders: Order[];
  receivablePlans: ReceivablePlan[];
  payablePlans: PayablePlan[];
  paymentRecords: PaymentRecord[];
  contracts: Contract[];
  contractFiles: ContractTemplate[];
  toasts: Toast[];

  login: (username: string, password: string) => boolean;
  logout: () => void;

  addCompany: (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCompany: (id: string, company: Partial<Company>) => void;
  deleteCompany: (id: string) => void;

  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  addOrder: (order: Omit<Order, 'id' | 'orderNo' | 'createdAt' | 'updatedAt'>) => void;
  updateOrder: (id: string, order: Partial<Order>) => void;
  deleteOrder: (id: string) => void;

  addReceivablePlan: (plan: Omit<ReceivablePlan, 'id' | 'createdAt'>) => void;
  updateReceivablePlan: (id: string, plan: Partial<ReceivablePlan>) => void;
  deleteReceivablePlan: (id: string) => void;
  updateReceivableInstallment: (planId: string, installmentId: string, updates: Partial<PaymentInstallment>) => void;

  addPayablePlan: (plan: Omit<PayablePlan, 'id' | 'createdAt'>) => void;
  updatePayablePlan: (id: string, plan: Partial<PayablePlan>) => void;
  deletePayablePlan: (id: string) => void;
  updatePayableInstallment: (planId: string, installmentId: string, updates: Partial<PaymentInstallment>) => void;

  addPaymentRecord: (record: Omit<PaymentRecord, 'id' | 'createdAt'>) => void;
  updatePaymentRecord: (id: string, record: Partial<PaymentRecord>) => void;
  deletePaymentRecord: (id: string) => void;

  addContract: (contract: Omit<Contract, 'id' | 'createdAt'>) => void;
  updateContract: (id: string, contract: Partial<Contract>) => void;
  deleteContract: (id: string) => void;

  addContractFile: (file: Omit<ContractTemplate, 'id' | 'createdAt'>) => void;
  updateContractFile: (id: string, file: Partial<ContractTemplate>) => void;
  deleteContractFile: (id: string) => void;

  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;

  clearAllData: () => void;
}

const initialUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    name: '系统管理员',
    role: 'admin',
    createdAt: new Date(),
  },
];

const initialCustomers: Customer[] = [
  {
    id: 'c1',
    name: '北京主体企业有限公司',
    unifiedCreditCode: '91110000MA001ABC12',
    contactPerson: '张三',
    contactPhone: '13800138001',
    address: '北京市朝阳区建国路88号',
    region: '北京',
    industry: '贸易',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'c2',
    name: '上海供应商A',
    unifiedCreditCode: '91310000MA002DEF34',
    contactPerson: '李四',
    contactPhone: '13900139002',
    address: '上海市浦东新区张江高科技园区',
    region: '上海',
    industry: '制造业',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-20'),
  },
  {
    id: 'c3',
    name: '深圳供应商B',
    unifiedCreditCode: '91440000MA003GHI56',
    contactPerson: '王五',
    contactPhone: '13700137003',
    address: '深圳市南山区科技园',
    region: '深圳',
    industry: '制造业',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-10'),
  },
  {
    id: 'c4',
    name: '哆买熊科技有限公司',
    unifiedCreditCode: '91440300MA004JKL78',
    contactPerson: '赵六',
    contactPhone: '13600136004',
    address: '广东省深圳市福田区科技园',
    region: '广东',
    industry: '电子商务',
    createdAt: new Date('2024-04-15'),
    updatedAt: new Date('2024-04-15'),
  },
  {
    id: 'c5',
    name: '如禾农业发展有限公司',
    unifiedCreditCode: '91410000MA005MNO90',
    contactPerson: '孙七',
    contactPhone: '13500135005',
    address: '河南省郑州市农业路',
    region: '河南',
    industry: '农业',
    createdAt: new Date('2024-05-20'),
    updatedAt: new Date('2024-05-20'),
  },
  {
    id: 'c6',
    name: '江苏鑫启旺贸易有限公司',
    unifiedCreditCode: '91320000MA006PQR12',
    contactPerson: '周八',
    contactPhone: '13400134006',
    address: '江苏省南京市中山路',
    region: '江苏',
    industry: '贸易',
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: 'c7',
    name: '江西哲丰实业有限公司',
    unifiedCreditCode: '91360000MA007STU34',
    contactPerson: '吴九',
    contactPhone: '13300133007',
    address: '江西省南昌市红谷滩新区',
    region: '江西',
    industry: '制造业',
    createdAt: new Date('2024-07-10'),
    updatedAt: new Date('2024-07-10'),
  },
  {
    id: 'c8',
    name: '猫猫头食品有限公司',
    unifiedCreditCode: '91330000MA008VWX56',
    contactPerson: '郑十',
    contactPhone: '13200132008',
    address: '浙江省杭州市西湖区',
    region: '浙江',
    industry: '食品加工',
    createdAt: new Date('2024-08-15'),
    updatedAt: new Date('2024-08-15'),
  },
  {
    id: 'c9',
    name: '温州制造业集团',
    unifiedCreditCode: '91330300MA009YZ12',
    contactPerson: '钱十一',
    contactPhone: '13100131009',
    address: '浙江省温州市鹿城区',
    region: '浙江',
    industry: '制造业',
    createdAt: new Date('2024-09-01'),
    updatedAt: new Date('2024-09-01'),
  },
  {
    id: 'c10',
    name: '温州贸易有限公司',
    unifiedCreditCode: '91330300MA010AB34',
    contactPerson: '刘十二',
    contactPhone: '13000130010',
    address: '浙江省温州市瓯海区',
    region: '浙江',
    industry: '贸易',
    createdAt: new Date('2024-10-15'),
    updatedAt: new Date('2024-10-15'),
  },
];

const generateOrderNo = () => {
  const date = new Date();
  const timestamp = date.getTime().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${timestamp}${random}`;
};

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  isLoggedIn: false,
  isAuthenticated: false,
  companies: loadFromStorage(STORAGE_KEYS.COMPANIES, []),
  customers: loadFromStorage(STORAGE_KEYS.CUSTOMERS, initialCustomers),
  orders: loadFromStorage(STORAGE_KEYS.ORDERS, []),
  receivablePlans: loadFromStorage(STORAGE_KEYS.RECEIVABLE_PLANS, []),
  payablePlans: loadFromStorage(STORAGE_KEYS.PAYABLE_PLANS, []),
  paymentRecords: loadFromStorage(STORAGE_KEYS.PAYMENT_RECORDS, []),
  contracts: loadFromStorage(STORAGE_KEYS.CONTRACTS, []),
  contractFiles: loadFromStorage(STORAGE_KEYS.CONTRACT_FILES, []),
  toasts: [],

  login: (username, password) => {
    const users = loadFromStorage(STORAGE_KEYS.USERS, initialUsers);
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      set({ user, isLoggedIn: true, isAuthenticated: true });
      return true;
    }
    return false;
  },

  logout: () => {
    set({ user: null, isLoggedIn: false, isAuthenticated: false });
  },

  addCompany: (company) => {
    const newCompany = {
      ...company,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => {
      const newCompanies = [...state.companies, newCompany];
      saveToStorage(STORAGE_KEYS.COMPANIES, newCompanies);
      return { companies: newCompanies };
    });
    get().addToast({ type: 'success', message: '企业添加成功' });
  },

  updateCompany: (id, company) => {
    set((state) => {
      const newCompanies = state.companies.map(c => c.id === id ? { ...c, ...company, updatedAt: new Date() } : c);
      saveToStorage(STORAGE_KEYS.COMPANIES, newCompanies);
      return { companies: newCompanies };
    });
    get().addToast({ type: 'success', message: '企业更新成功' });
  },

  deleteCompany: (id) => {
    set((state) => {
      const newCompanies = state.companies.filter(c => c.id !== id);
      saveToStorage(STORAGE_KEYS.COMPANIES, newCompanies);
      return { companies: newCompanies };
    });
    get().addToast({ type: 'success', message: '企业删除成功' });
  },

  addCustomer: (customer) => {
    const newCustomer = {
      ...customer,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => {
      const newCustomers = [...state.customers, newCustomer];
      saveToStorage(STORAGE_KEYS.CUSTOMERS, newCustomers);
      return { customers: newCustomers };
    });
    get().addToast({ type: 'success', message: '客户添加成功' });
  },

  updateCustomer: (id, customer) => {
    set((state) => {
      const newCustomers = state.customers.map(c => c.id === id ? { ...c, ...customer, updatedAt: new Date() } : c);
      saveToStorage(STORAGE_KEYS.CUSTOMERS, newCustomers);
      return { customers: newCustomers };
    });
    get().addToast({ type: 'success', message: '客户更新成功' });
  },

  deleteCustomer: (id) => {
    set((state) => {
      const newCustomers = state.customers.filter(c => c.id !== id);
      saveToStorage(STORAGE_KEYS.CUSTOMERS, newCustomers);
      return { customers: newCustomers };
    });
    get().addToast({ type: 'success', message: '客户删除成功' });
  },

  addOrder: (order) => {
    const newOrder = {
      ...order,
      id: Date.now().toString(),
      orderNo: generateOrderNo(),
      linkedOrderIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => {
      const newOrders = [...state.orders, newOrder];
      saveToStorage(STORAGE_KEYS.ORDERS, newOrders);
      return { orders: newOrders };
    });
    
    // 为每个下游生成收款计划
    newOrder.downstreams.forEach(downstream => {
      const installments = generateInstallments(downstream.amount);
      get().addReceivablePlan({
        orderId: newOrder.id,
        downstreamId: downstream.id,
        downstreamName: downstream.company.name,
        totalAmount: downstream.amount,
        installments,
      });
    });
    
    // 为每个上游生成付款计划
    newOrder.upstreams.forEach(upstream => {
      const installments = generateInstallments(upstream.amount);
      get().addPayablePlan({
        orderId: newOrder.id,
        upstreamId: upstream.id,
        upstreamName: upstream.company.name,
        totalAmount: upstream.amount,
        installments,
      });
    });
    
    get().addToast({ type: 'success', message: '订单创建成功' });
  },

  updateOrder: (id, order) => {
    set((state) => {
      const newOrders = state.orders.map(o => o.id === id ? { ...o, ...order, updatedAt: new Date() } : o);
      saveToStorage(STORAGE_KEYS.ORDERS, newOrders);
      return { orders: newOrders };
    });
    get().addToast({ type: 'success', message: '订单更新成功' });
  },

  deleteOrder: (id) => {
    set((state) => {
      // 删除订单及其相关数据
      const newOrders = state.orders.filter(o => o.id !== id);
      const newContracts = state.contracts.filter(c => c.orderId !== id);
      const newReceivablePlans = state.receivablePlans.filter(p => p.orderId !== id);
      const newPayablePlans = state.payablePlans.filter(p => p.orderId !== id);
      const newPaymentRecords = state.paymentRecords.filter(r => r.orderId !== id);
      
      saveToStorage(STORAGE_KEYS.ORDERS, newOrders);
      saveToStorage(STORAGE_KEYS.CONTRACTS, newContracts);
      saveToStorage(STORAGE_KEYS.RECEIVABLE_PLANS, newReceivablePlans);
      saveToStorage(STORAGE_KEYS.PAYABLE_PLANS, newPayablePlans);
      saveToStorage(STORAGE_KEYS.PAYMENT_RECORDS, newPaymentRecords);
      
      return { 
        orders: newOrders,
        contracts: newContracts,
        receivablePlans: newReceivablePlans,
        payablePlans: newPayablePlans,
        paymentRecords: newPaymentRecords,
      };
    });
    get().addToast({ type: 'success', message: '订单删除成功' });
  },

  addReceivablePlan: (plan) => {
    const newPlan = {
      ...plan,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    set((state) => {
      const newPlans = [...state.receivablePlans, newPlan];
      saveToStorage(STORAGE_KEYS.RECEIVABLE_PLANS, newPlans);
      return { receivablePlans: newPlans };
    });
  },

  updateReceivablePlan: (id, plan) => {
    set((state) => {
      const newPlans = state.receivablePlans.map(p => p.id === id ? { ...p, ...plan } : p);
      saveToStorage(STORAGE_KEYS.RECEIVABLE_PLANS, newPlans);
      return { receivablePlans: newPlans };
    });
  },

  deleteReceivablePlan: (id) => {
    set((state) => {
      const newPlans = state.receivablePlans.filter(p => p.id !== id);
      saveToStorage(STORAGE_KEYS.RECEIVABLE_PLANS, newPlans);
      return { receivablePlans: newPlans };
    });
  },

  updateReceivableInstallment: (planId, installmentId, updates) => {
    set((state) => {
      const newPlans = state.receivablePlans.map(plan => {
        if (plan.id !== planId) return plan;
        const newInstallments = plan.installments.map(inst => {
          if (inst.id !== installmentId) return inst;
          return { ...inst, ...updates };
        });
        return { ...plan, installments: newInstallments };
      });
      saveToStorage(STORAGE_KEYS.RECEIVABLE_PLANS, newPlans);
      return { receivablePlans: newPlans };
    });
  },

  addPayablePlan: (plan) => {
    const newPlan = {
      ...plan,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    set((state) => {
      const newPlans = [...state.payablePlans, newPlan];
      saveToStorage(STORAGE_KEYS.PAYABLE_PLANS, newPlans);
      return { payablePlans: newPlans };
    });
  },

  updatePayablePlan: (id, plan) => {
    set((state) => {
      const newPlans = state.payablePlans.map(p => p.id === id ? { ...p, ...plan } : p);
      saveToStorage(STORAGE_KEYS.PAYABLE_PLANS, newPlans);
      return { payablePlans: newPlans };
    });
  },

  deletePayablePlan: (id) => {
    set((state) => {
      const newPlans = state.payablePlans.filter(p => p.id !== id);
      saveToStorage(STORAGE_KEYS.PAYABLE_PLANS, newPlans);
      return { payablePlans: newPlans };
    });
  },

  updatePayableInstallment: (planId, installmentId, updates) => {
    set((state) => {
      const newPlans = state.payablePlans.map(plan => {
        if (plan.id !== planId) return plan;
        const newInstallments = plan.installments.map(inst => {
          if (inst.id !== installmentId) return inst;
          return { ...inst, ...updates };
        });
        return { ...plan, installments: newInstallments };
      });
      saveToStorage(STORAGE_KEYS.PAYABLE_PLANS, newPlans);
      return { payablePlans: newPlans };
    });
  },

  addPaymentRecord: (record) => {
    const newRecord = {
      ...record,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    set((state) => {
      const newRecords = [...state.paymentRecords, newRecord];
      saveToStorage(STORAGE_KEYS.PAYMENT_RECORDS, newRecords);
      return { paymentRecords: newRecords };
    });
    get().addToast({ type: 'success', message: '回款记录添加成功' });
  },

  updatePaymentRecord: (id, record) => {
    set((state) => {
      const newRecords = state.paymentRecords.map(r => r.id === id ? { ...r, ...record } : r);
      saveToStorage(STORAGE_KEYS.PAYMENT_RECORDS, newRecords);
      return { paymentRecords: newRecords };
    });
    get().addToast({ type: 'success', message: '回款记录更新成功' });
  },

  deletePaymentRecord: (id) => {
    set((state) => {
      const newRecords = state.paymentRecords.filter(r => r.id !== id);
      saveToStorage(STORAGE_KEYS.PAYMENT_RECORDS, newRecords);
      return { paymentRecords: newRecords };
    });
    get().addToast({ type: 'success', message: '回款记录删除成功' });
  },

  addContract: (contract) => {
    const newContract = {
      ...contract,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    set((state) => {
      const newContracts = [...state.contracts, newContract];
      saveToStorage(STORAGE_KEYS.CONTRACTS, newContracts);
      return { contracts: newContracts };
    });
  },

  updateContract: (id, contract) => {
    set((state) => {
      const newContracts = state.contracts.map(c => c.id === id ? { ...c, ...contract } : c);
      saveToStorage(STORAGE_KEYS.CONTRACTS, newContracts);
      return { contracts: newContracts };
    });
  },

  deleteContract: (id) => {
    set((state) => {
      const newContracts = state.contracts.filter(c => c.id !== id);
      saveToStorage(STORAGE_KEYS.CONTRACTS, newContracts);
      return { contracts: newContracts };
    });
  },

  addContractFile: (file) => {
    const newFile = {
      ...file,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    set((state) => {
      const newFiles = [...state.contractFiles, newFile];
      saveToStorage(STORAGE_KEYS.CONTRACT_FILES, newFiles);
      return { contractFiles: newFiles };
    });
    get().addToast({ type: 'success', message: '合同模板上传成功' });
  },

  updateContractFile: (id, file) => {
    set((state) => {
      const newFiles = state.contractFiles.map(f => f.id === id ? { ...f, ...file, updatedAt: new Date() } : f);
      saveToStorage(STORAGE_KEYS.CONTRACT_FILES, newFiles);
      return { contractFiles: newFiles };
    });
    get().addToast({ type: 'success', message: '合同模板更新成功' });
  },

  deleteContractFile: (id) => {
    set((state) => {
      const newFiles = state.contractFiles.filter(f => f.id !== id);
      saveToStorage(STORAGE_KEYS.CONTRACT_FILES, newFiles);
      return { contractFiles: newFiles };
    });
    get().addToast({ type: 'success', message: '合同模板删除成功' });
  },

  addToast: (toast) => {
    const newToast = {
      ...toast,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    set((state) => ({ toasts: [...state.toasts, newToast] }));
    
    setTimeout(() => {
      get().removeToast(newToast.id);
    }, 3000);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }));
  },

  clearAllData: () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    set({
      companies: [],
      customers: [],
      orders: [],
      receivablePlans: [],
      payablePlans: [],
      paymentRecords: [],
      contracts: [],
      contractFiles: [],
    });
    get().addToast({ type: 'success', message: '所有数据已清空' });
  },
}));
