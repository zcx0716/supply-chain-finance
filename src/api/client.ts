const API_BASE_URL = 'http://localhost:3001/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export interface Customer {
  id: number;
  name: string;
  address: string;
  unifiedCreditCode: string;
  contactPerson: string;
  contactPhone: string;
  region: string;
  industry: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpstreamNode {
  id: number;
  companyId: number;
  companyName: string;
  parentUpstreamId: number | null;
  amount: number;
  items: string;
}

export interface DownstreamNode {
  id: number;
  companyId: number;
  companyName: string;
  amount: number;
  items: string;
}

export interface Order {
  id: number;
  orderNo: string;
  mainCompanyId: number;
  mainCompanyName: string;
  receivableAmount: number;
  payableAmount: number;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  upstreams: UpstreamNode[];
  downstreams: DownstreamNode[];
}

export interface Installment {
  id: number;
  amount: number;
  plannedDate: string;
  actualDate: string | null;
  status: string;
  notes: string | null;
}

export interface PaymentPlan {
  id: number;
  orderId: number;
  companyName: string;
  totalAmount: number;
  completedAmount: number;
  installments: Installment[];
  createdAt: string;
}

export interface Contract {
  id: number;
  orderId: number;
  templateName: string;
  fileName: string;
  templateContent: string;
  status: string;
  createdAt: string;
}

export const customerApi = {
  getAll: () => request<Customer[]>('/customers'),
  getById: (id: number) => request<Customer>(`/customers/${id}`),
  create: (data: Partial<Customer>) => request<Customer>('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: Partial<Customer>) => request<Customer>(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => request<void>(`/customers/${id}`, {
    method: 'DELETE',
  }),
};

export const orderApi = {
  getAll: () => request<Order[]>('/orders'),
  getById: (id: number) => request<Order>(`/orders/${id}`),
  getPaymentPlans: (id: number) => request<{ receivable: PaymentPlan[]; payable: PaymentPlan[] }>(`/orders/${id}/payment-plans`),
  create: (data: Partial<Order>) => request<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: Partial<Order>) => request<Order>(`/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => request<void>(`/orders/${id}`, {
    method: 'DELETE',
  }),
};

export const paymentPlanApi = {
  updateReceivableInstallment: (planId: number, installmentId: number, status: string, notes?: string) => 
    request<void>(`/payment-plans/receivable/${planId}/installments/${installmentId}`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    }),
  updatePayableInstallment: (planId: number, installmentId: number, status: string, notes?: string) => 
    request<void>(`/payment-plans/payable/${planId}/installments/${installmentId}`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    }),
};

export const contractApi = {
  getByOrderId: (orderId: number) => request<Contract[]>(`/contracts/order/${orderId}`),
  getById: (id: number) => request<Contract>(`/contracts/${id}`),
  download: (id: number) => {
    window.open(`${API_BASE_URL}/contracts/${id}/download`, '_blank');
  },
  create: (orderId: number, templateName: string, templateContent: string) => 
    request<Contract>('/contracts', {
      method: 'POST',
      body: JSON.stringify({ orderId, templateName, templateContent }),
    }),
};
