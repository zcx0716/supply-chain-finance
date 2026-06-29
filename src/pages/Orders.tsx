import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../store';
import { Order, UpstreamNode, DownstreamNode, CurrencyType, Customer } from '../types';
import { formatYuan, formatDate } from '../utils/formatters';
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Search } from 'lucide-react';

const OrderStatus = ({ status }: { status: string }) => (
  <span className={`text-xs px-2 py-1 rounded-full ${
    status === 'draft' ? 'bg-gray-100 text-gray-600' :
    status === 'active' ? 'bg-blue-100 text-blue-600' :
    status === 'completed' ? 'bg-green-100 text-green-600' :
    'bg-red-100 text-red-600'
  }`}>
    {status === 'draft' ? '草稿' : status === 'active' ? '执行中' : status === 'completed' ? '已完成' : '已取消'}
  </span>
);

const SearchSelect = ({ 
  selected, 
  onChange, 
  placeholder, 
  excludeSelected = [],
  onSelect 
}: { 
  selected: string; 
  onChange: (id: string) => void; 
  placeholder: string; 
  excludeSelected?: string[];
  onSelect?: (customer: Customer) => void;
}) => {
  const { customers } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  const availableCustomers = customers.filter(c => !excludeSelected.includes(c.id));
  
  const searchResults = useMemo(() => {
    if (!searchText.trim()) {
      return availableCustomers;
    }
    
    const query = searchText.toLowerCase();
    
    const matched = availableCustomers.map(c => {
      const nameMatch = (c.name || '').toLowerCase().includes(query);
      const codeMatch = (c.unifiedCreditCode || '').toLowerCase().includes(query);
      const personMatch = (c.contactPerson || '').toLowerCase().includes(query);
      const phoneMatch = (c.contactPhone || '').includes(query);
      const regionMatch = (c.region || '').toLowerCase().includes(query);
      const addressMatch = (c.address || '').toLowerCase().includes(query);
      const industryMatch = (c.industry || '').toLowerCase().includes(query);
      
      return {
        customer: c,
        nameMatch,
        codeMatch,
        personMatch,
        phoneMatch,
        regionMatch,
        addressMatch,
        industryMatch,
      };
    }).filter(item => 
      item.nameMatch || item.codeMatch || item.personMatch || item.phoneMatch || 
      item.regionMatch || item.addressMatch || item.industryMatch
    );
    
    return matched.sort((a, b) => {
      const aName = (a.customer.name || '').toLowerCase();
      const bName = (b.customer.name || '').toLowerCase();
      
      const aScore = (a.nameMatch ? 10 : 0) + 
                     (a.codeMatch ? 5 : 0) + 
                     (a.personMatch ? 3 : 0) + 
                     (a.regionMatch ? 2 : 0) +
                     (a.addressMatch ? 1 : 0) +
                     (a.industryMatch ? 1 : 0) +
                     (a.phoneMatch ? 0.5 : 0) +
                     (aName === query ? 100 : 0) +
                     (aName.startsWith(query) ? 50 : 0);
      
      const bScore = (b.nameMatch ? 10 : 0) + 
                     (b.codeMatch ? 5 : 0) + 
                     (b.personMatch ? 3 : 0) + 
                     (b.regionMatch ? 2 : 0) +
                     (b.addressMatch ? 1 : 0) +
                     (b.industryMatch ? 1 : 0) +
                     (b.phoneMatch ? 0.5 : 0) +
                     (bName === query ? 100 : 0) +
                     (bName.startsWith(query) ? 50 : 0);
      
      if (bScore !== aScore) return bScore - aScore;
      
      const aIndex = aName.indexOf(query);
      const bIndex = bName.indexOf(query);
      return aIndex - bIndex;
    }).map(item => item.customer);
  }, [availableCustomers, searchText]);

  const selectedCustomer = customers.find(c => c.id === selected);

  const handleSelect = (customer: Customer) => {
    onChange(customer.id);
    onSelect?.(customer);
    setIsOpen(false);
    setSearchText('');
  };

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(true)}
        className="w-full px-4 py-2.5 text-left border border-slate-300 rounded-lg hover:border-slate-400 transition-colors flex items-center justify-between bg-white cursor-pointer"
      >
        <span className={selectedCustomer ? 'text-slate-700' : 'text-slate-400'}>
          {selectedCustomer ? selectedCustomer.name : placeholder}
        </span>
        <ChevronDown 
          size={18} 
          className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </div>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => {
              setIsOpen(false);
              setSearchText('');
            }} 
          />
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
            <div className="relative p-2 border-b border-slate-100">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                placeholder="搜索企业名称、信用代码、联系人..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="px-4 py-4 text-slate-400 text-sm text-center">
                  {searchText ? '未找到匹配的企业' : '暂无企业数据'}
                </div>
              ) : (
                searchResults.map(customer => (
                  <div
                    key={customer.id}
                    onClick={() => handleSelect(customer)}
                    className={`w-full px-4 py-3 text-left border-b border-slate-100 last:border-b-0 transition-colors cursor-pointer ${
                      customer.id === selected ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-medium">{customer.name || '未命名'}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {customer.unifiedCreditCode || '-'} | {customer.contactPerson || '-'} | {customer.contactPhone || '-'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const Orders: React.FC = () => {
  const { orders, customers, addOrder, updateOrder, deleteOrder, addToast, loadOrders, loadCustomers } = useAppStore();
  
  useEffect(() => {
    loadOrders();
    loadCustomers();
  }, [loadOrders, loadCustomers]);

  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [selectedMainCompany, setSelectedMainCompany] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyType>('CNY');
  const [upstreams, setUpstreams] = useState<UpstreamNode[]>([]);
  const [downstreams, setDownstreams] = useState<DownstreamNode[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (editingOrder) {
      setSelectedMainCompany(editingOrder.mainCompany.id);
      setSelectedCurrency(editingOrder.currency);
      setUpstreams(editingOrder.upstreams || []);
      setDownstreams(editingOrder.downstreams || []);
    } else {
      resetForm();
    }
  }, [editingOrder]);

  const resetForm = () => {
    setEditingOrder(null);
    setSelectedMainCompany('');
    setSelectedCurrency('CNY');
    setUpstreams([]);
    setDownstreams([]);
  };

  const calculateReceivableAmount = () => {
    return downstreams.reduce((sum, d) => sum + d.amount, 0);
  };

  const calculatePayableAmount = () => {
    return upstreams.reduce((sum, u) => sum + u.amount, 0);
  };

  const addUpstream = (companyId: string) => {
    const company = customers.find(c => c.id === companyId);
    if (company) {
      const newUpstream: UpstreamNode = {
        id: `upstream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        company,
        amount: 0,
        items: [],
      };
      setUpstreams([...upstreams, newUpstream]);
    }
  };

  const removeUpstream = (id: string) => {
    setUpstreams(upstreams.filter(u => u.id !== id));
  };

  const updateUpstreamAmount = (id: string, amount: number) => {
    setUpstreams(upstreams.map(u => u.id === id ? { ...u, amount } : u));
  };

  const addDownstream = (companyId: string) => {
    const company = customers.find(c => c.id === companyId);
    if (company) {
      const newDownstream: DownstreamNode = {
        id: `downstream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        company,
        amount: 0,
        items: [],
      };
      setDownstreams([...downstreams, newDownstream]);
    }
  };

  const removeDownstream = (id: string) => {
    setDownstreams(downstreams.filter(d => d.id !== id));
  };

  const updateDownstreamAmount = (id: string, amount: number) => {
    setDownstreams(downstreams.map(d => d.id === id ? { ...d, amount } : d));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const mainCompany = customers.find(c => c.id === selectedMainCompany);
    if (!mainCompany) {
      addToast({ type: 'error', message: '请选择主体企业' });
      return;
    }

    if (downstreams.length === 0) {
      addToast({ type: 'error', message: '请至少添加一个下游客户' });
      return;
    }

    if (upstreams.length === 0) {
      addToast({ type: 'error', message: '请至少添加一个上游供应商' });
      return;
    }

    const receivableAmount = calculateReceivableAmount();
    const payableAmount = calculatePayableAmount();

    if (receivableAmount <= 0 || payableAmount <= 0) {
      addToast({ type: 'error', message: '应收和应付金额必须大于0' });
      return;
    }

    const orderData = {
      mainCompany,
      upstreams,
      downstreams,
      receivableAmount,
      payableAmount,
      currency: selectedCurrency,
      status: 'draft' as const,
      linkedOrderIds: [],
    };

    if (editingOrder) {
      updateOrder(editingOrder.id, orderData);
      addToast({ type: 'success', message: '订单已更新' });
    } else {
      addOrder(orderData);
      addToast({ type: 'success', message: '订单创建成功' });
    }
    setShowModal(false);
    resetForm();
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这个订单吗？')) {
      deleteOrder(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">订单管理</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
        >
          <Plus size={20} />
          新建订单
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">订单号</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">主体企业</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">应收金额</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">应付金额</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">状态</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">创建时间</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {orders.map((order) => (
                <React.Fragment key={order.id}>
                  <tr className="hover:bg-slate-50 transition-colors cursor-pointer">
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">
                      <button
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        className="flex items-center gap-2 hover:text-blue-600"
                      >
                        {expandedOrder === order.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        {order.orderNo}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{order.mainCompany.name}</td>
                    <td className="px-6 py-4 text-sm font-medium text-green-600">{formatYuan(order.receivableAmount)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-red-600">{formatYuan(order.payableAmount)}</td>
                    <td className="px-6 py-4"><OrderStatus status={order.status} /></td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatDate(order.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(order)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedOrder === order.id && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 bg-slate-50">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-slate-800 mb-3">上游供应商</h4>
                            <div className="space-y-2">
                              {order.upstreams.map((upstream) => (
                                <div key={upstream.id} className="flex justify-between bg-white px-3 py-2 rounded-lg border border-slate-200">
                                  <span className="text-sm text-slate-600">{upstream.company.name}</span>
                                  <span className="text-sm font-medium text-red-600">{formatYuan(upstream.amount)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800 mb-3">下游客户</h4>
                            <div className="space-y-2">
                              {order.downstreams.map((downstream) => (
                                <div key={downstream.id} className="flex justify-between bg-white px-3 py-2 rounded-lg border border-slate-200">
                                  <span className="text-sm text-slate-600">{downstream.company.name}</span>
                                  <span className="text-sm font-medium text-green-600">{formatYuan(downstream.amount)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            暂无订单数据
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingOrder ? '编辑订单' : '新建订单'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">主体企业 *</label>
                <SearchSelect
                  selected={selectedMainCompany}
                  onChange={setSelectedMainCompany}
                  placeholder="选择主体企业"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  上游供应商 * (点击添加)
                </label>
                <div className="space-y-3">
                  {upstreams.map((upstream) => (
                    <div key={upstream.id} className="flex gap-3 items-center bg-slate-50 p-3 rounded-lg">
                      <span className="text-sm text-slate-700 flex-1">{upstream.company.name}</span>
                      <input
                        type="number"
                        value={upstream.amount}
                        onChange={(e) => updateUpstreamAmount(upstream.id, Number(e.target.value) || 0)}
                        className="w-40 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="金额"
                        min="0"
                      />
                      <button
                        type="button"
                        onClick={() => removeUpstream(upstream.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  <SearchSelect
                    selected=""
                    onChange={addUpstream}
                    placeholder="添加上游供应商"
                    excludeSelected={upstreams.map(u => u.company.id)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  下游客户 * (点击添加)
                </label>
                <div className="space-y-3">
                  {downstreams.map((downstream) => (
                    <div key={downstream.id} className="flex gap-3 items-center bg-slate-50 p-3 rounded-lg">
                      <span className="text-sm text-slate-700 flex-1">{downstream.company.name}</span>
                      <input
                        type="number"
                        value={downstream.amount}
                        onChange={(e) => updateDownstreamAmount(downstream.id, Number(e.target.value) || 0)}
                        className="w-40 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="金额"
                        min="0"
                      />
                      <button
                        type="button"
                        onClick={() => removeDownstream(downstream.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  <SearchSelect
                    selected=""
                    onChange={addDownstream}
                    placeholder="添加下游客户"
                    excludeSelected={downstreams.map(d => d.company.id)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700">应收总额</span>
                  <span className="text-lg font-bold text-green-600">{formatYuan(calculateReceivableAmount())}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700">应付总额</span>
                  <span className="text-lg font-bold text-red-600">{formatYuan(calculatePayableAmount())}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
                >
                  {editingOrder ? '保存修改' : '创建订单'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
