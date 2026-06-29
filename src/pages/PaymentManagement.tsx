import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { formatDate, formatYuan } from '../utils/formatters';
import { ArrowLeft, CheckCircle, Clock, XCircle, Play, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';
import { generateInstallments } from '../utils/paymentCalculator';

const PaymentManagement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    orders, 
    receivablePlans, 
    payablePlans,
    updateReceivableInstallment,
    updatePayableInstallment,
    addToast,
    loadOrders,
    loadReceivablePlans,
    loadPayablePlans
  } = useAppStore();

  useEffect(() => {
    loadOrders();
    loadReceivablePlans();
    loadPayablePlans();
  }, [loadOrders, loadReceivablePlans, loadPayablePlans]);

  const [expandedReceivable, setExpandedReceivable] = useState<string | null>(null);
  const [expandedPayable, setExpandedPayable] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustType, setAdjustType] = useState<'upstream' | 'downstream' | 'order' | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  const order = orders.find(o => o.id === id);
  const orderReceivablePlans = receivablePlans.filter(p => p.orderId === id);
  const orderPayablePlans = payablePlans.filter(p => p.orderId === id);

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-slate-500 mb-4">订单不存在</p>
          <button
            onClick={() => navigate('/payments')}
            className="text-blue-600 hover:text-blue-800"
          >
            返回资金管理
          </button>
        </div>
      </div>
    );
  }

  const totalReceivable = orderReceivablePlans.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalPayable = orderPayablePlans.reduce((sum, p) => sum + p.totalAmount, 0);

  const handleStartReceivable = (planId: string, installmentId: string) => {
    updateReceivableInstallment(planId, installmentId, { status: 'processing' });
    addToast({ type: 'success', message: '已开始催收' });
  };

  const handleCompleteReceivable = (planId: string, installmentId: string) => {
    updateReceivableInstallment(planId, installmentId, { status: 'completed', actualDate: new Date() });
    addToast({ type: 'success', message: '收款已确认' });
  };

  const handleStartPayable = (planId: string, installmentId: string) => {
    updatePayableInstallment(planId, installmentId, { status: 'processing' });
    addToast({ type: 'success', message: '已开始付款' });
  };

  const handleCompletePayable = (planId: string, installmentId: string) => {
    updatePayableInstallment(planId, installmentId, { status: 'completed', actualDate: new Date() });
    addToast({ type: 'success', message: '付款已确认' });
  };

  const handleCancel = (planId: string, installmentId: string, type: 'receivable' | 'payable') => {
    if (type === 'receivable') {
      updateReceivableInstallment(planId, installmentId, { status: 'cancelled' });
    } else {
      updatePayableInstallment(planId, installmentId, { status: 'cancelled' });
    }
    addToast({ type: 'success', message: '已取消' });
  };

  const handleNoteChange = (key: string, value: string) => {
    setNoteInputs(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveNote = (planId: string, installmentId: string, type: 'receivable' | 'payable') => {
    const note = noteInputs[`${planId}-${installmentId}`];
    if (type === 'receivable') {
      updateReceivableInstallment(planId, installmentId, { notes: note });
    } else {
      updatePayableInstallment(planId, installmentId, { notes: note });
    }
    addToast({ type: 'success', message: '备注已保存' });
  };

  const handleOpenAdjustModal = (type: 'upstream' | 'downstream' | 'order', planId?: string) => {
    setAdjustType(type);
    setSelectedPlanId(planId || '');
    setAdjustAmount(0);
    setShowAdjustModal(true);
  };

  const handleAdjustAmount = () => {
    if (!adjustType || adjustAmount <= 0) {
      addToast({ type: 'error', message: '请输入有效的调整金额' });
      return;
    }

    if (adjustType === 'order') {
      // 调整订单金额，重新生成所有分期计划
      generateInstallments(adjustAmount, new Date());
      addToast({ type: 'success', message: `订单金额已调整为 ${formatYuan(adjustAmount)}，分期计划已重新生成` });
    } else if (adjustType === 'upstream' && selectedPlanId) {
      // 调整上游金额
      const plan = orderPayablePlans.find(p => p.id === selectedPlanId);
      if (plan) {
        generateInstallments(adjustAmount, new Date());
        addToast({ type: 'success', message: `上游金额已调整为 ${formatYuan(adjustAmount)}` });
      }
    } else if (adjustType === 'downstream' && selectedPlanId) {
      // 调整下游金额
      const plan = orderReceivablePlans.find(p => p.id === selectedPlanId);
      if (plan) {
        generateInstallments(adjustAmount, new Date());
        addToast({ type: 'success', message: `下游金额已调整为 ${formatYuan(adjustAmount)}` });
      }
    }

    setShowAdjustModal(false);
    setAdjustType(null);
    setAdjustAmount(0);
    setSelectedPlanId('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/payments')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">资金计划详情</h1>
          <p className="text-slate-500 mt-1">订单号: {order.orderNo}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-800">订单信息</h3>
          <button
            onClick={() => handleOpenAdjustModal('order')}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit2 size={16} />
            调整订单金额
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-sm font-medium text-slate-500">主体企业</p>
            <p className="text-lg font-semibold text-slate-800 mt-1">{order.mainCompany.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">应收总额</p>
            <p className="text-lg font-semibold text-green-600 mt-1">{formatYuan(totalReceivable)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">应付总额</p>
            <p className="text-lg font-semibold text-red-600 mt-1">{formatYuan(totalPayable)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">订单状态</p>
            <p className="text-lg font-semibold text-slate-800 mt-1">
              {order.status === 'draft' ? '草稿' : order.status === 'active' ? '执行中' : order.status === 'completed' ? '已完成' : '已取消'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            应收款计划（下游→主体）
          </h2>
          {orderReceivablePlans.map((plan) => {
            const completed = plan.installments.filter(i => i.status === 'completed').reduce((s, i) => s + i.amount, 0);
            const isExpanded = expandedReceivable === plan.id;
            return (
              <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-4">
                <div 
                  className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedReceivable(isExpanded ? null : plan.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                      <div>
                        <h3 className="font-semibold text-slate-800">{plan.downstreamName}</h3>
                        <p className="text-sm text-slate-500">总额: {formatYuan(plan.totalAmount)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAdjustModal('downstream', plan.id);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="调整金额"
                      >
                        <Edit2 size={16} />
                      </button>
                      <div className="text-right">
                        <p className="text-sm text-slate-500">已收</p>
                        <p className="font-semibold text-green-600">{formatYuan(completed)}</p>
                      </div>
                      <div className="w-48">
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all duration-500"
                            style={{ width: `${(completed / plan.totalAmount) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-slate-200">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">期次</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">金额</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">计划日期</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">实际日期</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">状态</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">备注</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {plan.installments.map((installment, index) => (
                            <tr key={installment.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-sm text-slate-600">第 {index + 1} 期</td>
                              <td className="px-4 py-3 text-sm font-medium text-slate-800">{formatYuan(installment.amount)}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{formatDate(installment.plannedDate)}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{installment.actualDate ? formatDate(installment.actualDate) : '-'}</td>
                              <td className="px-4 py-3">
                                {installment.status === 'pending' && (
                                  <span className="flex items-center gap-1 text-sm text-slate-500">
                                    <Clock size={14} />
                                    待收
                                  </span>
                                )}
                                {installment.status === 'processing' && (
                                  <span className="flex items-center gap-1 text-sm text-blue-600">
                                    <Play size={14} />
                                    催收中
                                  </span>
                                )}
                                {installment.status === 'completed' && (
                                  <span className="flex items-center gap-1 text-sm text-green-600">
                                    <CheckCircle size={14} />
                                    已收
                                  </span>
                                )}
                                {installment.status === 'cancelled' && (
                                  <span className="flex items-center gap-1 text-sm text-red-600">
                                    <XCircle size={14} />
                                    已取消
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="添加备注..."
                                    value={noteInputs[`${plan.id}-${installment.id}`] ?? installment.notes ?? ''}
                                    onChange={(e) => handleNoteChange(`${plan.id}-${installment.id}`, e.target.value)}
                                    className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                  <button
                                    onClick={() => handleSaveNote(plan.id, installment.id, 'receivable')}
                                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                  >
                                    保存
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {installment.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => handleStartReceivable(plan.id, installment.id)}
                                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                      >
                                        开始催收
                                      </button>
                                      <button
                                        onClick={() => handleCancel(plan.id, installment.id, 'receivable')}
                                        className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                                      >
                                        取消
                                      </button>
                                    </>
                                  )}
                                  {installment.status === 'processing' && (
                                    <>
                                      <button
                                        onClick={() => handleCompleteReceivable(plan.id, installment.id)}
                                        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                      >
                                        确认收款
                                      </button>
                                      <button
                                        onClick={() => handleCancel(plan.id, installment.id, 'receivable')}
                                        className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                                      >
                                        取消
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            应付款计划（主体→上游）
          </h2>
          {orderPayablePlans.map((plan) => {
            const completed = plan.installments.filter(i => i.status === 'completed').reduce((s, i) => s + i.amount, 0);
            const isExpanded = expandedPayable === plan.id;
            return (
              <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-4">
                <div 
                  className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedPayable(isExpanded ? null : plan.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                      <div>
                        <h3 className="font-semibold text-slate-800">{plan.upstreamName}</h3>
                        <p className="text-sm text-slate-500">总额: {formatYuan(plan.totalAmount)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAdjustModal('upstream', plan.id);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="调整金额"
                      >
                        <Edit2 size={16} />
                      </button>
                      <div className="text-right">
                        <p className="text-sm text-slate-500">已付</p>
                        <p className="font-semibold text-red-600">{formatYuan(completed)}</p>
                      </div>
                      <div className="w-48">
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-500 rounded-full transition-all duration-500"
                            style={{ width: `${(completed / plan.totalAmount) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-slate-200">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">期次</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">金额</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">计划日期</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">实际日期</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">状态</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">备注</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {plan.installments.map((installment, index) => (
                            <tr key={installment.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-sm text-slate-600">第 {index + 1} 期</td>
                              <td className="px-4 py-3 text-sm font-medium text-slate-800">{formatYuan(installment.amount)}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{formatDate(installment.plannedDate)}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{installment.actualDate ? formatDate(installment.actualDate) : '-'}</td>
                              <td className="px-4 py-3">
                                {installment.status === 'pending' && (
                                  <span className="flex items-center gap-1 text-sm text-slate-500">
                                    <Clock size={14} />
                                    待付
                                  </span>
                                )}
                                {installment.status === 'processing' && (
                                  <span className="flex items-center gap-1 text-sm text-blue-600">
                                    <Play size={14} />
                                    付款中
                                  </span>
                                )}
                                {installment.status === 'completed' && (
                                  <span className="flex items-center gap-1 text-sm text-green-600">
                                    <CheckCircle size={14} />
                                    已付
                                  </span>
                                )}
                                {installment.status === 'cancelled' && (
                                  <span className="flex items-center gap-1 text-sm text-red-600">
                                    <XCircle size={14} />
                                    已取消
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="添加备注..."
                                    value={noteInputs[`${plan.id}-${installment.id}`] ?? installment.notes ?? ''}
                                    onChange={(e) => handleNoteChange(`${plan.id}-${installment.id}`, e.target.value)}
                                    className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                  <button
                                    onClick={() => handleSaveNote(plan.id, installment.id, 'payable')}
                                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                  >
                                    保存
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {installment.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => handleStartPayable(plan.id, installment.id)}
                                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                      >
                                        开始付款
                                      </button>
                                      <button
                                        onClick={() => handleCancel(plan.id, installment.id, 'payable')}
                                        className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                                      >
                                        取消
                                      </button>
                                    </>
                                  )}
                                  {installment.status === 'processing' && (
                                    <>
                                      <button
                                        onClick={() => handleCompletePayable(plan.id, installment.id)}
                                        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                      >
                                        确认付款
                                      </button>
                                      <button
                                        onClick={() => handleCancel(plan.id, installment.id, 'payable')}
                                        className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                                      >
                                        取消
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showAdjustModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">
                {adjustType === 'order' ? '调整订单金额' : adjustType === 'upstream' ? '调整上游金额' : '调整下游金额'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  新金额（元）
                </label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入新的金额"
                  min="0"
                  step="1000"
                />
                <p className="text-xs text-slate-500 mt-1">
                  系统将自动按照小额多笔原则（每笔不超过50万元）生成新的分期计划
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAdjustModal(false);
                  setAdjustType(null);
                  setAdjustAmount(0);
                  setSelectedPlanId('');
                }}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAdjustAmount}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                确认调整
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentManagement;
