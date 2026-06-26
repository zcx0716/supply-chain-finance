import { create } from 'zustand';
import { Company, Customer, Order, ReceivablePlan, PayablePlan, PaymentRecord, Contract, Toast, User, ContractTemplate } from '../types';
import { authAPI, customerAPI, orderAPI, planAPI, paymentAPI, contractAPI } from '../api';
import { generateInstallments } from '../utils/paymentCalculator';

interface AppState {
  user: User | null;
  isLoggedIn: boolean;
  isAuthenticated: boolean;
  users: User[];
  companies: Company[];
  customers: Customer[];
  orders: Order[];
  receivablePlans: ReceivablePlan[];
  payablePlans: PayablePlan[];
  paymentRecords: PaymentRecord[];
  contracts: Contract[];
  contractFiles: ContractTemplate[];
  toasts: Toast[];
  isLoading: boolean;

  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loadUser: () => Promise<void>;

  addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  loadUsers: () => Promise<void>;

  addCompany: (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCompany: (id: string, company: Partial<Company>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  loadCompanies: () => Promise<void>;

  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  loadCustomers: () => Promise<void>;

  addOrder: (order: Omit<Order, 'id' | 'orderNo' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateOrder: (id: string, order: Partial<Order>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  loadOrders: () => Promise<void>;

  addReceivablePlan: (plan: Omit<ReceivablePlan, 'id' | 'createdAt'>) => Promise<void>;
  updateReceivablePlan: (id: string, plan: Partial<ReceivablePlan>) => Promise<void>;
  deleteReceivablePlan: (id: string) => Promise<void>;
  updateReceivableInstallment: (planId: string, installmentId: string, updates: Partial<PaymentInstallment>) => Promise<void>;
  loadReceivablePlans: () => Promise<void>;

  addPayablePlan: (plan: Omit<PayablePlan, 'id' | 'createdAt'>) => Promise<void>;
  updatePayablePlan: (id: string, plan: Partial<PayablePlan>) => Promise<void>;
  deletePayablePlan: (id: string) => Promise<void>;
  updatePayableInstallment: (planId: string, installmentId: string, updates: Partial<PaymentInstallment>) => Promise<void>;
  loadPayablePlans: () => Promise<void>;

  addPaymentRecord: (record: Omit<PaymentRecord, 'id' | 'createdAt'>) => Promise<void>;
  updatePaymentRecord: (id: string, record: Partial<PaymentRecord>) => Promise<void>;
  deletePaymentRecord: (id: string) => Promise<void>;
  loadPaymentRecords: () => Promise<void>;

  addContract: (contract: Omit<Contract, 'id' | 'createdAt'>) => Promise<void>;
  updateContract: (id: string, contract: Partial<Contract>) => Promise<void>;
  deleteContract: (id: string) => Promise<void>;
  loadContracts: () => Promise<void>;

  addContractFile: (file: Omit<ContractTemplate, 'id' | 'createdAt'>) => Promise<void>;
  updateContractFile: (id: string, file: Partial<ContractTemplate>) => Promise<void>;
  deleteContractFile: (id: string) => Promise<void>;
  loadContractFiles: () => Promise<void>;

  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;

  clearAllData: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  isLoggedIn: false,
  isAuthenticated: false,
  users: [],
  companies: [],
  customers: [],
  orders: [],
  receivablePlans: [],
  payablePlans: [],
  paymentRecords: [],
  contracts: [],
  contractFiles: [],
  toasts: [],
  isLoading: false,

  login: async (username, password) => {
    try {
      const result = await authAPI.login(username, password);
      localStorage.setItem('token', result.token);
      set({ user: result.user, isLoggedIn: true, isAuthenticated: true });
      return true;
    } catch (error) {
      get().addToast({ type: 'error', message: '登录失败: ' + (error as Error).message });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, isLoggedIn: false, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const result = await authAPI.getMe();
      set({ user: result.user, isLoggedIn: true, isAuthenticated: true });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, isLoggedIn: false, isAuthenticated: false });
    }
  },

  addUser: async (user) => {
    try {
      const newUser = await authAPI.createUser(user);
      set((state) => ({ users: [...state.users, newUser] }));
      get().addToast({ type: 'success', message: '用户添加成功' });
    } catch (error) {
      get().addToast({ type: 'error', message: '添加失败: ' + (error as Error).message });
    }
  },

  updateUser: async (id, user) => {
    try {
      const updatedUser = await authAPI.updateUser(id, user);
      set((state) => ({ users: state.users.map(u => u.id === id ? updatedUser : u) }));
      get().addToast({ type: 'success', message: '用户更新成功' });
    } catch (error) {
      get().addToast({ type: 'error', message: '更新失败: ' + (error as Error).message });
    }
  },

  deleteUser: async (id) => {
    try {
      await authAPI.deleteUser(id);
      set((state) => ({ users: state.users.filter(u => u.id !== id) }));
      get().addToast({ type: 'success', message: '用户删除成功' });
    } catch (error) {
      get().addToast({ type: 'error', message: '删除失败: ' + (error as Error).message });
    }
  },

  loadUsers: async () => {
    try {
      const users = await authAPI.getUsers();
      set({ users });
    } catch (error) {
      get().addToast({ type: 'error', message: '加载用户失败: ' + (error as Error).message });
    }
  },

  addCompany: async (company) => {
    try {
      const newCompany = await customerAPI.create(company);
      set((state) => ({ companies: [...state.companies, newCompany] }));
      get().addToast({ type: 'success', message: '企业添加成功' });
    } catch (error) {
      get().addToast({ type: 'error', message: '添加失败: ' + (error as Error).message });
    }
  },

  updateCompany: async (id, company) => {
    try {
      const updatedCompany = await customerAPI.update(id, company);
      set((state) => ({ companies: state.companies.map(c => c.id === id ? updatedCompany : c) }));
      get().addToast({ type: 'success', message: '企业更新成功' });
    } catch (error) {
      get().addToast({ type: 'error', message: '更新失败: ' + (error as Error).message });
    }
  },

  deleteCompany: async (id) => {
    try {
      await customerAPI.delete(id);
      set((state) => ({ companies: state.companies.filter(c => c.id !== id) }));
      get().addToast({ type: 'success', message: '企业删除成功' });
    } catch (error) {
      get().addToast({ type: 'error', message: '删除失败: ' + (error as Error).message });
    }
  },

  loadCompanies: async () => {
    try {
      const companies = await customerAPI.getAll();
      set({ companies });
    } catch (error) {
      get().addToast({ type: 'error', message: '加载企业失败: ' + (error as Error).message });
    }
  },

  addCustomer: async (customer) => {
    try {
      const newCustomer = await customerAPI.create(customer);
      set((state) => ({ customers: [...state.customers, newCustomer] }));
      get().addToast({ type: 'success', message: '客户添加成功' });
    } catch (error) {
      get().addToast({ type: 'error', message: '添加失败: ' + (error as Error).message });
    }
  },

  updateCustomer: async (id, customer) => {
    try {
      const updatedCustomer = await customerAPI.update(id, customer);
      set((state) => ({ customers: state.customers.map(c => c.id === id ? updatedCustomer : c) }));
      get().addToast({ type: 'success', message: '客户更新成功' });
    } catch (error) {
      get().addToast({ type: 'error', message: '更新失败: ' + (error as Error).message });
    }
  },

  deleteCustomer: async (id) => {
    try {
      await customerAPI.delete(id);
      set((state) => ({ customers: state.customers.filter(c => c.id !== id) }));
      get().addToast({ type: 'success', message: '客户删除成功' });
    } catch (error) {
      get().addToast({ type: 'error', message: '删除失败: ' + (error as Error).message });
    }
  },

  loadCustomers: async () => {
    try {
      const customers = await customerAPI.getAll();
      set({ customers });
    } catch (error) {
      get().addToast({ type: 'error', message: '加载客户失败: ' + (error as Error).message });
    }
  },

  addOrder: async (order) => {
    try {
      const newOrder = await orderAPI.create(order);
      set((state) => ({ orders: [...state.orders, newOrder] }));
      
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
    } catch (error) {
      get().addToast({ type: 'error', message: '创建失败: ' + (error as Error).message });
    }
  },

  updateOrder: async (id, order) => {
    try {
      const updatedOrder = await orderAPI.update(id, order);
      set((state) => ({ orders: state.orders.map(o => o.id === id ? { ...o, ...updatedOrder } : o) }));
      get().addToast({ type: 'success', message: '订单更新成功' });
    } catch (error) {
      get().addToast({ type: 'error', message: '更新失败: ' + (error as Error).message });
    }
  },

  deleteOrder: async (id) => {
    try {
      await orderAPI.delete(id);
      set((state) => ({ 
        orders: state.orders.filter(o => o.id !== id),
        contracts: state.contracts.filter(c => c.orderId !== id),
        receivablePlans: state.receivablePlans.filter(p => p.orderId !== id),
        payablePlans: state.payablePlans.filter(p => p.orderId !== id),
        paymentRecords: state.paymentRecords.filter(r => r.orderId !== id),
      }));
      get().addToast({ type: 'success', message: '订单删除成功' });
    } catch (error) {
      get().addToast({ type: 'error', message: '删除失败: ' + (error as Error).message });
    }
  },

  loadOrders: async () => {
    try {
      const orders = await orderAPI.getAll();
      set({ orders });
    } catch (error) {
      get().addToast({ type: 'error', message: '加载订单失败: ' + (error as Error).message });
    }
  },

  addReceivablePlan: async (plan) => {
    try {
      const newPlan = await planAPI.createReceivable(plan);
      set((state) => ({ receivablePlans: [...state.receivablePlans, newPlan] }));
    } catch (error) {
      get().addToast({ type: 'error', message: '添加收款计划失败: ' + (error as Error).message });
    }
  },

  updateReceivablePlan: async (id, plan) => {
    try {
      await planAPI.updateReceivable(id, plan);
      set((state) => ({ receivablePlans: state.receivablePlans.map(p => p.id === id ? { ...p, ...plan } : p) }));
    } catch (error) {
      get().addToast({ type: 'error', message: '更新收款计划失败: ' + (error as Error).message });
    }
  },

  deleteReceivablePlan: async (id) => {
    try {
      await planAPI.deleteReceivable(id);
      set((state) => ({ receivablePlans: state.receivablePlans.filter(p => p.id !== id) }));
    } catch (error) {
      get().addToast({ type: 'error', message: '删除收款计划失败: ' + (error as Error).message });
    }
  },

  updateReceivableInstallment: async (planId, installmentId, updates) => {
    try {
      await planAPI.updateInstallment(installmentId, updates);
      set((state) => ({
        receivablePlans: state.receivablePlans.map(plan => {
          if (plan.id !== planId) return plan;
          return {
            ...plan,
            installments: plan.installments.map(inst => inst.id === installmentId ? { ...inst, ...updates } : inst)
          };
        })
      }));
    } catch (error) {
      get().addToast({ type: 'error', message: '更新分期失败: ' + (error as Error).message });
    }
  },

  loadReceivablePlans: async () => {
    try {
      const plans = await planAPI.getReceivable();
      set({ receivablePlans: plans });
    } catch (error) {
      get().addToast({ type: 'error', message: '加载收款计划失败: ' + (error as Error).message });
    }
  },

  addPayablePlan: async (plan) => {
    try {
      const newPlan = await planAPI.createPayable(plan);
      set((state) => ({ payablePlans: [...state.payablePlans, newPlan] }));
    } catch (error) {
      get().addToast({ type: 'error', message: '添加付款计划失败: ' + (error as Error).message });
    }
  },

  updatePayablePlan: async (id, plan) => {
    try {
      await planAPI.updatePayable(id, plan);
      set((state) => ({ payablePlans: state.payablePlans.map(p => p.id === id ? { ...p, ...plan } : p) }));
    } catch (error) {
      get().addToast({ type: 'error', message: '更新付款计划失败: ' + (error as Error).message });
    }
  },

  deletePayablePlan: async (id) => {
    try {
      await planAPI.deletePayable(id);
      set((state) => ({ payablePlans: state.payablePlans.filter(p => p.id !== id) }));
    } catch (error) {
      get().addToast({ type: 'error', message: '删除付款计划失败: ' + (error as Error).message });
    }
  },

  updatePayableInstallment: async (planId, installmentId, updates) => {
    try {
      await planAPI.updateInstallment(installmentId, updates);
      set((state) => ({
        payablePlans: state.payablePlans.map(plan => {
          if (plan.id !== planId) return plan;
          return {
            ...plan,
            installments: plan.installments.map(inst => inst.id === installmentId ? { ...inst, ...updates } : inst)
          };
        })
      }));
    } catch (error) {
      get().addToast({ type: 'error', message: '更新分期失败: ' + (error as Error).message });
    }
  },

  loadPayablePlans: async () => {
    try {
      const plans = await planAPI.getPayable();
      set({ payablePlans: plans });
    } catch (error) {
      get().addToast({ type: 'error', message: '加载付款计划失败: ' + (error as Error).message });
    }
  },

  addPaymentRecord: async (record) => {
    try {
      const newRecord = await paymentAPI.create(record);
      set((state) => ({ paymentRecords: [...state.paymentRecords, newRecord] }));
      get().addToast({ type: 'success', message: '回款记录添加成功' });
    } catch (error) {
      get().addToast({ type: 'error', message: '添加失败: ' + (error as Error).message });
    }
  },

  updatePaymentRecord: async (id, record) => {
    try {
      const updatedRecord = await paymentAPI.update(id, record);
      set((state) => ({ paymentRecords: state.paymentRecords.map(r => r.id === id ? updatedRecord : r) }));
      get().addToast({ type: 'success', message: '回款记录更新成功' });
    } catch (error) {
      get().addToast({ type: 'error', message: '更新失败: ' + (error as Error).message });
    }
  },

  deletePaymentRecord: async (id) => {
    try {
      await paymentAPI.delete(id);
      set((state) => ({ paymentRecords: state.paymentRecords.filter(r => r.id !== id) }));
      get().addToast({ type: 'success', message: '回款记录删除成功' });
    } catch (error) {
      get().addToast({ type: 'error', message: '删除失败: ' + (error as Error).message });
    }
  },

  loadPaymentRecords: async () => {
    try {
      const records = await paymentAPI.getAll();
      set({ paymentRecords: records });
    } catch (error) {
      get().addToast({ type: 'error', message: '加载回款记录失败: ' + (error as Error).message });
    }
  },

  addContract: async (contract) => {
    try {
      const newContract = await contractAPI.create(contract);
      set((state) => ({ contracts: [...state.contracts, newContract] }));
    } catch (error) {
      get().addToast({ type: 'error', message: '添加合同失败: ' + (error as Error).message });
    }
  },

  updateContract: async (id, contract) => {
    try {
      await contractAPI.update(id, contract);
      set((state) => ({ contracts: state.contracts.map(c => c.id === id ? { ...c, ...contract } : c) }));
    } catch (error) {
      get().addToast({ type: 'error', message: '更新合同失败: ' + (error as Error).message });
    }
  },

  deleteContract: async (id) => {
    try {
      await contractAPI.delete(id);
      set((state) => ({ contracts: state.contracts.filter(c => c.id !== id) }));
    } catch (error) {
      get().addToast({ type: 'error', message: '删除合同失败: ' + (error as Error).message });
    }
  },

  loadContracts: async () => {
    try {
      const contracts = await contractAPI.getAll();
      set({ contracts });
    } catch (error) {
      get().addToast({ type: 'error', message: '加载合同失败: ' + (error as Error).message });
    }
  },

  addContractFile: async (file) => {
    try {
      const newFile = await contractAPI.createTemplate(file);
      set((state) => ({ contractFiles: [...state.contractFiles, newFile] }));
      get().addToast({ type: 'success', message: '合同模板上传成功' });
    } catch (error) {
      get().addToast({ type: 'error', message: '上传失败: ' + (error as Error).message });
    }
  },

  updateContractFile: async (id, file) => {
    try {
      const updatedFile = await contractAPI.updateTemplate(id, file);
      set((state) => ({ contractFiles: state.contractFiles.map(f => f.id === id ? updatedFile : f) }));
      get().addToast({ type: 'success', message: '合同模板更新成功' });
    } catch (error) {
      get().addToast({ type: 'error', message: '更新失败: ' + (error as Error).message });
    }
  },

  deleteContractFile: async (id) => {
    try {
      await contractAPI.deleteTemplate(id);
      set((state) => ({ contractFiles: state.contractFiles.filter(f => f.id !== id) }));
      get().addToast({ type: 'success', message: '合同模板删除成功' });
    } catch (error) {
      get().addToast({ type: 'error', message: '删除失败: ' + (error as Error).message });
    }
  },

  loadContractFiles: async () => {
    try {
      const files = await contractAPI.getTemplates();
      set({ contractFiles: files });
    } catch (error) {
      get().addToast({ type: 'error', message: '加载合同模板失败: ' + (error as Error).message });
    }
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
    set({
      users: [],
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

import { PaymentInstallment } from '../types';