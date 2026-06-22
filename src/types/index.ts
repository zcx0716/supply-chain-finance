export interface Customer {
  id: string;
  name: string;
  address: string;
  unifiedCreditCode: string;
  contactPerson: string;
  contactPhone: string;
  region: string;
  industry: string;
  createdAt: Date;
  updatedAt: Date;
}

export type Company = Customer;

export type CurrencyType = 'CNY' | 'JPY' | 'USD';

// 订单项
export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

// 上游供应商层级关系
export interface UpstreamNode {
  id: string;
  company: Customer;
  parentUpstreamId?: string; // 上一级上游（如果有）
  amount: number; // 该上游对应的金额
  items: OrderItem[]; // 该上游的商品
}

// 下游客户
export interface DownstreamNode {
  id: string;
  company: Customer;
  amount: number; // 该下游对应的金额
  items: OrderItem[]; // 该下游的商品
}

export interface Order {
  id: string;
  orderNo: string;
  mainCompany: Customer; // 主体企业
  upstreams: UpstreamNode[]; // 上游供应链（支持多层）
  downstreams: DownstreamNode[]; // 下游客户（支持多个）
  receivableAmount: number; // 应收总额（下游→主体）
  payableAmount: number; // 应付总额（主体→上游）
  currency: CurrencyType;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  linkedOrderIds: string[]; // 关联的订单ID
  createdAt: Date;
  updatedAt?: Date;
}

export interface PaymentInstallment {
  id: string;
  amount: number;
  plannedDate: Date;
  actualDate?: Date;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  notes?: string;
}

// 收款计划（应收：下游→主体）
export interface ReceivablePlan {
  id: string;
  orderId: string;
  downstreamId: string; // 对应的下游
  downstreamName: string;
  totalAmount: number;
  installments: PaymentInstallment[];
  createdAt: Date;
}

// 付款计划（应付：主体→上游）
export interface PayablePlan {
  id: string;
  orderId: string;
  upstreamId: string; // 对应的上游
  upstreamName: string;
  totalAmount: number;
  installments: PaymentInstallment[];
  createdAt: Date;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  amount: number;
  date: Date;
  payer: string;
  payee: string;
  notes?: string;
  createdAt: Date;
}

export interface Contract {
  id: string;
  orderId: string;
  templateName: string;
  fileName: string;
  templateContent?: string;
  status: 'draft' | 'generated';
  createdAt: Date;
}

export interface ContractTemplate {
  id: string;
  name: string;
  content: string;
  type?: 'custom' | 'system';
  createdAt: Date;
  updatedAt?: Date;
}

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export type ToastMessage = Toast;
