import React, { useState, useRef, useEffect } from 'react';
import { Plus, Edit, Trash2, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAppStore } from '../store';
import { Customer } from '../types';

export function Customers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer, addToast, loadCustomers } = useAppStore();

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const templateData = [
      ['企业名称', '统一信用代码', '联系人', '联系电话', '地址', '区域', '行业'],
      ['示例企业有限公司', '91110101MA00000000', '张三', '13800138000', '北京市朝阳区xxx街道xxx号', '华北', '制造业'],
      ['示例科技有限公司', '91110102MA00000001', '李四', '13900139000', '上海市浦东新区xxx路xxx号', '华东', '信息技术'],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '客户导入模板');
    
    worksheet['!cols'] = [
      { wch: 20 },
      { wch: 20 },
      { wch: 12 },
      { wch: 15 },
      { wch: 30 },
      { wch: 10 },
      { wch: 15 },
    ];

    XLSX.writeFile(workbook, '客户导入模板.xlsx');
    addToast({ type: 'success', message: '模板下载成功' });
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: ['name', 'unifiedCreditCode', 'contactPerson', 'contactPhone', 'address', 'region', 'industry'] });
        
        jsonData.shift();
        
        let successCount = 0;
        let failCount = 0;

        jsonData.forEach((row: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>) => {
          if (row.name && row.name.trim()) {
            try {
              addCustomer({
                name: row.name?.trim() || '',
                unifiedCreditCode: row.unifiedCreditCode?.trim() || '',
                contactPerson: row.contactPerson?.trim() || '',
                contactPhone: row.contactPhone?.trim() || '',
                address: row.address?.trim() || '',
                region: row.region?.trim() || '',
                industry: row.industry?.trim() || '',
              });
              successCount++;
            } catch {
              failCount++;
            }
          }
        });

        addToast({ 
          type: 'success', 
          message: `导入完成！成功: ${successCount} 条，失败: ${failCount} 条` 
        });
      } catch (error) {
        addToast({ type: 'error', message: '导入失败，请检查Excel文件格式' });
        console.error('Excel import error:', error);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        updateCustomer(editingCustomer.id, formData);
        addToast({ type: 'success', message: '客户更新成功' });
      } else {
        addCustomer(formData as Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>);
        addToast({ type: 'success', message: '客户添加成功' });
      }
      setShowModal(false);
      setEditingCustomer(null);
      setFormData({});
    } catch (err) {
      console.error('Failed to save customer:', err);
      addToast({ type: 'error', message: '保存失败' });
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData(customer);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('确定要删除此客户吗？')) {
      try {
        deleteCustomer(id);
        addToast({ type: 'success', message: '客户删除成功' });
      } catch (err) {
        console.error('Failed to delete customer:', err);
        addToast({ type: 'error', message: '删除失败' });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">客户/企业管理</h1>
        <div className="flex gap-3">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-all shadow-md"
          >
            <Download size={20} />
            下载模板
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg"
          >
            <Upload size={20} />
            导入Excel
          </button>
          <button
            onClick={() => {
              setEditingCustomer(null);
              setFormData({});
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
          >
            <Plus size={20} />
            新增客户
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">企业名称</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">统一信用代码</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">联系人</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">联系电话</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">区域</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">行业</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">{customer.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{customer.unifiedCreditCode || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{customer.contactPerson || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{customer.contactPhone || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{customer.region || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{customer.industry || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(customer)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {customers.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            暂无客户数据
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingCustomer ? '编辑客户' : '新增客户'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingCustomer(null);
                  setFormData({});
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">企业名称 *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">统一信用代码</label>
                  <input
                    type="text"
                    value={formData.unifiedCreditCode || ''}
                    onChange={(e) => setFormData({ ...formData, unifiedCreditCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">联系人</label>
                  <input
                    type="text"
                    value={formData.contactPerson || ''}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">联系电话</label>
                  <input
                    type="text"
                    value={formData.contactPhone || ''}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">区域</label>
                  <input
                    type="text"
                    value={formData.region || ''}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">行业</label>
                  <input
                    type="text"
                    value={formData.industry || ''}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">地址</label>
                <textarea
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCustomer(null);
                    setFormData({});
                  }}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
