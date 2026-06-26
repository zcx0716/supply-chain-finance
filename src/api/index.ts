import { User, Customer, Order, ReceivablePlan, PayablePlan, PaymentInstallment, PaymentRecord, Contract, ContractTemplate } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const getAuthToken = () => {
  return localStorage.getItem('token');
};

const request = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const authAPI = {
  login: async (username: string, password: string) => {
    return request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  getMe: async () => {
    return request<{ user: User }>('/auth/me');
  },

  getUsers: async () => {
    return request<User[]>('/auth/users');
  },

  getUser: async (id: string) => {
    return request<User>(`/auth/users/${id}`);
  },

  createUser: async (user: Omit<User, 'id' | 'createdAt'>) => {
    return request<User>('/auth/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  },

  updateUser: async (id: string, user: Partial<User>) => {
    return request<User>(`/auth/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  },

  deleteUser: async (id: string) => {
    return request<{ message: string }>(`/auth/users/${id}`, {
      method: 'DELETE',
    });
  },
};

export const customerAPI = {
  getAll: async () => {
    return request<Customer[]>('/customers');
  },

  getById: async (id: string) => {
    return request<Customer>(`/customers/${id}`);
  },

  create: async (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    return request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  },

  update: async (id: string, customer: Partial<Customer>) => {
    return request<Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    });
  },

  delete: async (id: string) => {
    return request<{ message: string }>(`/customers/${id}`, {
      method: 'DELETE',
    });
  },
};

export const orderAPI = {
  getAll: async () => {
    return request<Order[]>('/orders');
  },

  getById: async (id: string) => {
    return request<Order>(`/orders/${id}`);
  },

  create: async (order: Omit<Order, 'id' | 'orderNo' | 'createdAt' | 'updatedAt'>) => {
    return request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  },

  update: async (id: string, order: Partial<Order>) => {
    return request<Order>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(order),
    });
  },

  delete: async (id: string) => {
    return request<{ message: string }>(`/orders/${id}`, {
      method: 'DELETE',
    });
  },
};

export const planAPI = {
  getReceivable: async () => {
    return request<ReceivablePlan[]>('/plans/receivable');
  },

  getReceivableById: async (id: string) => {
    return request<ReceivablePlan>(`/plans/receivable/${id}`);
  },

  createReceivable: async (plan: Omit<ReceivablePlan, 'id' | 'createdAt'>) => {
    return request<ReceivablePlan>('/plans/receivable', {
      method: 'POST',
      body: JSON.stringify(plan),
    });
  },

  updateReceivable: async (id: string, plan: Partial<ReceivablePlan>) => {
    return request<{ message: string }>(`/plans/receivable/${id}`, {
      method: 'PUT',
      body: JSON.stringify(plan),
    });
  },

  deleteReceivable: async (id: string) => {
    return request<{ message: string }>(`/plans/receivable/${id}`, {
      method: 'DELETE',
    });
  },

  getPayable: async () => {
    return request<PayablePlan[]>('/plans/payable');
  },

  getPayableById: async (id: string) => {
    return request<PayablePlan>(`/plans/payable/${id}`);
  },

  createPayable: async (plan: Omit<PayablePlan, 'id' | 'createdAt'>) => {
    return request<PayablePlan>('/plans/payable', {
      method: 'POST',
      body: JSON.stringify(plan),
    });
  },

  updatePayable: async (id: string, plan: Partial<PayablePlan>) => {
    return request<{ message: string }>(`/plans/payable/${id}`, {
      method: 'PUT',
      body: JSON.stringify(plan),
    });
  },

  deletePayable: async (id: string) => {
    return request<{ message: string }>(`/plans/payable/${id}`, {
      method: 'DELETE',
    });
  },

  updateInstallment: async (id: string, updates: Partial<PaymentInstallment>) => {
    return request<{ message: string }>(`/plans/installment/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
};

export const paymentAPI = {
  getAll: async () => {
    return request<PaymentRecord[]>('/payments');
  },

  getById: async (id: string) => {
    return request<PaymentRecord>(`/payments/${id}`);
  },

  create: async (record: Omit<PaymentRecord, 'id' | 'createdAt'>) => {
    return request<PaymentRecord>('/payments', {
      method: 'POST',
      body: JSON.stringify(record),
    });
  },

  update: async (id: string, record: Partial<PaymentRecord>) => {
    return request<PaymentRecord>(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(record),
    });
  },

  delete: async (id: string) => {
    return request<{ message: string }>(`/payments/${id}`, {
      method: 'DELETE',
    });
  },
};

export const contractAPI = {
  getAll: async () => {
    return request<Contract[]>('/contracts');
  },

  getById: async (id: string) => {
    return request<Contract>(`/contracts/${id}`);
  },

  create: async (contract: Omit<Contract, 'id' | 'createdAt'>) => {
    return request<Contract>('/contracts', {
      method: 'POST',
      body: JSON.stringify(contract),
    });
  },

  update: async (id: string, contract: Partial<Contract>) => {
    return request<Contract>(`/contracts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contract),
    });
  },

  delete: async (id: string) => {
    return request<{ message: string }>(`/contracts/${id}`, {
      method: 'DELETE',
    });
  },

  getTemplates: async () => {
    return request<ContractTemplate[]>('/contracts/templates');
  },

  getTemplateById: async (id: string) => {
    return request<ContractTemplate>(`/contracts/templates/${id}`);
  },

  createTemplate: async (template: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    return request<ContractTemplate>('/contracts/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    });
  },

  updateTemplate: async (id: string, template: Partial<ContractTemplate>) => {
    return request<ContractTemplate>(`/contracts/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(template),
    });
  },

  deleteTemplate: async (id: string) => {
    return request<{ message: string }>(`/contracts/templates/${id}`, {
      method: 'DELETE',
    });
  },
};
