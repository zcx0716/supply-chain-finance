import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatYuan } from '../utils/formatters';
import { Eye, DollarSign, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';
import { ReceivablePlan, PayablePlan, Order, PaymentInstallment } from '../types';

const Payments: React.FC = () => {
  const { orders, receivablePlans, payablePlans, loadOrders, loadReceivablePlans, loadPayablePlans } = useAppStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'receivable' | 'payable'>('receivable');

  useEffect(() => {
    loadOrders();
    loadReceivablePlans();
    loadPayablePlans();
  }, [loadOrders, loadReceivablePlans, loadPayablePlans]);

  const totalReceivable = receivablePlans.reduce((sum, p) => sum + p.totalAmount, 0);
  const completedReceivable = receivablePlans.reduce((sum, p) => {
    return sum + p.installments.filter(i => i.status === 'completed').reduce((s, i) => s + i.amount, 0);
  }, 0);

  const totalPayable = payablePlans.reduce((sum, p) => sum + p.totalAmount, 0);
  const completedPayable = payablePlans.reduce((sum, p) => {
    return sum + p.installments.filter(i => i.status === 'completed').reduce((s, i) => s + i.amount, 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">资金管理</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">应收总额</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{formatYuan(totalReceivable)}</p>
            </div>
            <div className="p-3 bg-green-200 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-700" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-green-800">
              <span>已收</span>
              <span className="font-semibold">{formatYuan(completedReceivable)}</span>
            </div>
            <div className="mt-2 h-2 bg-green-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-600 rounded-full transition-all duration-500"
                style={{ width: totalReceivable > 0 ? `${(completedReceivable / totalReceivable) * 100}%` : '0%' }}
              />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700">待收金额</p>
              <p className="text-2xl font-bold text-orange-900 mt-1">{formatYuan(totalReceivable - completedReceivable)}</p>
            </div>
            <div className="p-3 bg-orange-200 rounded-lg">
              <DollarSign className="w-6 h-6 text-orange-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700">应付总额</p>
              <p className="text-2xl font-bold text-red-900 mt-1">{formatYuan(totalPayable)}</p>
            </div>
            <div className="p-3 bg-red-200 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-700" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-red-800">
              <span>已付</span>
              <span className="font-semibold">{formatYuan(completedPayable)}</span>
            </div>
            <div className="mt-2 h-2 bg-red-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-600 rounded-full transition-all duration-500"
                style={{ width: totalPayable > 0 ? `${(completedPayable / totalPayable) * 100}%` : '0%' }}
              />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">待付金额</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">{formatYuan(totalPayable - completedPayable)}</p>
            </div>
            <div className="p-3 bg-purple-200 rounded-lg">
              <CreditCard className="w-6 h-6 text-purple-700" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('receivable')}
          className={`pb-4 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'receivable'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          应收款（下游→主体）
        </button>
        <button
          onClick={() => setActiveTab('payable')}
          className={`pb-4 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'payable'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          应付款（主体→上游）
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'receivable' ? (
            <ReceivableTable plans={receivablePlans} orders={orders} onView={(id) => navigate(`/orders/${id}/payments`)} />
          ) : (
            <PayableTable plans={payablePlans} orders={orders} onView={(id) => navigate(`/orders/${id}/payments`)} />
          )}
        </div>
      </div>
    </div>
  );
};

interface ReceivableTableProps {
  plans: ReceivablePlan[];
  orders: Order[];
  onView: (id: string) => void;
}

const ReceivableTable: React.FC<ReceivableTableProps> = ({ plans, orders, onView }) => {
  return (
    <table className="w-full">
      <thead className="bg-slate-50 border-b border-slate-200">
        <tr>
          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">订单号</th>
          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">下游客户</th>
          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">总额</th>
          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">已收</th>
          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">待收</th>
          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">创建时间</th>
          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">操作</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-200">
        {plans.map((plan) => {
          const order = orders.find(o => o.id === plan.orderId);
          const completed = plan.installments.filter((i: PaymentInstallment) => i.status === 'completed').reduce((s: number, i: PaymentInstallment) => s + i.amount, 0);
          return (
            <tr key={plan.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 text-sm text-slate-800">{order?.orderNo || '-'}</td>
              <td className="px-6 py-4 text-sm text-slate-600">{plan.downstreamName}</td>
              <td className="px-6 py-4 text-sm font-medium text-slate-800">{formatYuan(plan.totalAmount)}</td>
              <td className="px-6 py-4 text-sm font-medium text-green-600">{formatYuan(completed)}</td>
              <td className="px-6 py-4 text-sm font-medium text-orange-600">{formatYuan(plan.totalAmount - completed)}</td>
              <td className="px-6 py-4 text-sm text-slate-500">{formatDate(plan.createdAt)}</td>
              <td className="px-6 py-4">
                <button
                  onClick={() => onView(plan.orderId)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="查看详情"
                >
                  <Eye size={16} />
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

interface PayableTableProps {
  plans: PayablePlan[];
  orders: Order[];
  onView: (id: string) => void;
}

const PayableTable: React.FC<PayableTableProps> = ({ plans, orders, onView }) => {
  return (
    <table className="w-full">
      <thead className="bg-slate-50 border-b border-slate-200">
        <tr>
          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">订单号</th>
          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">上游供应商</th>
          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">总额</th>
          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">已付</th>
          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">待付</th>
          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">创建时间</th>
          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">操作</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-200">
        {plans.map((plan) => {
          const order = orders.find(o => o.id === plan.orderId);
          const completed = plan.installments.filter((i: PaymentInstallment) => i.status === 'completed').reduce((s: number, i: PaymentInstallment) => s + i.amount, 0);
          return (
            <tr key={plan.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 text-sm text-slate-800">{order?.orderNo || '-'}</td>
              <td className="px-6 py-4 text-sm text-slate-600">{plan.upstreamName}</td>
              <td className="px-6 py-4 text-sm font-medium text-slate-800">{formatYuan(plan.totalAmount)}</td>
              <td className="px-6 py-4 text-sm font-medium text-red-600">{formatYuan(completed)}</td>
              <td className="px-6 py-4 text-sm font-medium text-orange-600">{formatYuan(plan.totalAmount - completed)}</td>
              <td className="px-6 py-4 text-sm text-slate-500">{formatDate(plan.createdAt)}</td>
              <td className="px-6 py-4">
                <button
                  onClick={() => onView(plan.orderId)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="查看详情"
                >
                  <Eye size={16} />
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default Payments;
