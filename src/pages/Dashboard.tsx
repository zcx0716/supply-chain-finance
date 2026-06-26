import { useEffect } from 'react';
import { Users, FileText, DollarSign, FileSignature, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useAppStore } from '../store';
import { formatYuan } from '../utils/formatters';

export function Dashboard() {
  const { 
    customers, 
    orders, 
    receivablePlans, 
    payablePlans,
    loadCustomers,
    loadOrders,
    loadReceivablePlans,
    loadPayablePlans
  } = useAppStore();

  useEffect(() => {
    loadCustomers();
    loadOrders();
    loadReceivablePlans();
    loadPayablePlans();
  }, [loadCustomers, loadOrders, loadReceivablePlans, loadPayablePlans]);

  const totalReceivableAmount = receivablePlans.reduce((sum, plan) => sum + plan.totalAmount, 0);
  const completedReceivable = receivablePlans.reduce((sum, plan) => {
    return sum + plan.installments
      .filter(inst => inst.status === 'completed')
      .reduce((s, i) => s + i.amount, 0);
  }, 0);

  const totalPayableAmount = payablePlans.reduce((sum, plan) => sum + plan.totalAmount, 0);
  const completedPayable = payablePlans.reduce((sum, plan) => {
    return sum + plan.installments
      .filter(inst => inst.status === 'completed')
      .reduce((s, i) => s + i.amount, 0);
  }, 0);

  const stats = [
    {
      label: '客户总数',
      value: customers.length,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: '订单总数',
      value: orders.length,
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: '+8%',
      trendUp: true,
    },
    {
      label: '应收总额',
      value: formatYuan(totalReceivableAmount),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: '+15%',
      trendUp: true,
    },
    {
      label: '应付总额',
      value: formatYuan(totalPayableAmount),
      icon: FileSignature,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      trend: '+5%',
      trendUp: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">工作台</h1>
          <p className="text-slate-500 mt-1">欢迎回来，这是您的业务概览</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            新建订单
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-4">
              {stat.trendUp ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                {stat.trend}
              </span>
              <span className="text-sm text-slate-400">较上月</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-800">回款趋势</h2>
            <select className="text-sm border border-slate-200 rounded-lg px-3 py-1.5">
              <option>最近30天</option>
              <option>最近90天</option>
              <option>最近1年</option>
            </select>
          </div>
          <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
            <div className="text-center text-slate-400">
              <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>图表区域</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">资金进度</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-3">应收款（下游→主体）</h3>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600">已收</span>
                <span className="font-medium text-green-600">{formatYuan(completedReceivable)}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: totalReceivableAmount > 0 ? `${(completedReceivable / totalReceivableAmount) * 100}%` : '0%' }}
                ></div>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-slate-600">待收</span>
                <span className="font-medium text-orange-600">{formatYuan(totalReceivableAmount - completedReceivable)}</span>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-600">应收总额</span>
                  <span className="font-bold text-slate-800">{formatYuan(totalReceivableAmount)}</span>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-medium text-slate-700 mb-3">应付款（主体→上游）</h3>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600">已付</span>
                <span className="font-medium text-red-600">{formatYuan(completedPayable)}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all duration-500"
                  style={{ width: totalPayableAmount > 0 ? `${(completedPayable / totalPayableAmount) * 100}%` : '0%' }}
                ></div>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-slate-600">待付</span>
                <span className="font-medium text-orange-600">{formatYuan(totalPayableAmount - completedPayable)}</span>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-600">应付总额</span>
                  <span className="font-bold text-slate-800">{formatYuan(totalPayableAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-800">最近活动</h2>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">查看全部</button>
        </div>
        <div className="space-y-4">
          {customers.slice(0, 3).map((customer) => (
            <div key={customer.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">{customer.name}</p>
                <p className="text-xs text-slate-500">{customer.contactPerson} · {customer.region}</p>
              </div>
              <span className="text-xs text-slate-400">刚刚</span>
            </div>
          ))}
          {customers.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              暂无活动记录
            </div>
          )}
        </div>
      </div>
    </div>
  );
}