import { useState, useRef } from 'react';
import { Plus, FileText, Download, Upload, Trash2 } from 'lucide-react';
import mammoth from 'mammoth';
import { useAppStore } from '../store';
import { formatYuan, formatDate } from '../utils/formatters';
import { 
  generateWordDocumentFromText, 
  generateSimpleContractDocument 
} from '../utils/wordDocument';

export function Contracts() {
  const { orders, contracts, contractFiles, addContract, addContractFile, deleteContract, addToast } = useAppStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateList, setShowTemplateList] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string>('');
  const [templateName, setTemplateName] = useState('');
  const [customTemplate, setCustomTemplate] = useState<File | null>(null);
  const [templateContent, setTemplateContent] = useState<string>('');
  const [downloadFormat, setDownloadFormat] = useState<'docx'>('docx');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const predefinedTemplates: Record<string, string> = {
    '采购合同模板': `合同编号：{订单号}

甲方：{主体企业名称}
统一社会信用代码：{主体企业信用代码}
地址：{主体企业地址}
联系人：{主体企业联系人}
联系电话：{主体企业电话}

乙方：
统一社会信用代码：
地址：
联系人：
联系电话：

一、合同标的
合同金额：{订单金额}

二、付款方式
按以下计划付款：
1. 
2. 
3. 

三、其他条款
1.
2.
3.

甲方签字：__________
日期：{当前日期}

乙方签字：__________
日期：__________

合同模板：{模板名称}
生成时间：{当前日期}`,

    '销售合同模板': `销售合同

合同编号：{订单号}

甲方（卖方）：{主体企业名称}
统一社会信用代码：{主体企业信用代码}
地址：{主体企业地址}
联系人：{主体企业联系人}
联系电话：{主体企业电话}

乙方（买方）：
统一社会信用代码：
地址：
联系人：
联系电话：

第一条 产品名称、规格、数量、价格
产品明细：
{订单明细列表}
总价：{订单金额}

第二条 交货时间和地点
第三条 付款方式
第四条 违约责任

甲方签字：__________
日期：{当前日期}

乙方签字：__________
日期：__________`,

    '服务合同模板': `服务合同

合同编号：{订单号}

甲方：{主体企业名称}
乙方：

一、服务内容
二、服务期限
三、服务费用：{订单金额}
四、付款方式
五、其他约定

甲方签章：
日期：{当前日期}

乙方签章：
日期：{当前日期}`
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCustomTemplate(file);
      
      const fileName = file.name.toLowerCase();
      
      try {
        let content = '';
        
        if (fileName.endsWith('.txt')) {
          content = await file.text();
        } else if (fileName.endsWith('.docx')) {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          content = result.value;
          
          if (result.messages.length > 0) {
            addToast({ type: 'info', message: `模板文件 "${file.name}" 解析完成，部分内容可能未完全解析` });
          }
        }
        
        setTemplateContent(content);
        
        addContractFile({
          name: file.name,
          content,
          type: 'custom' as const,
        });
        addToast({ type: 'success', message: `模板文件 "${file.name}" 上传成功` });
      } catch {
        setTemplateContent('');
        addToast({ type: 'warning', message: `文件 "${file.name}" 解析失败，请使用其他文件` });
      }
    }
  };

  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileName = file.name.toLowerCase();
      
      try {
        let content = '';
        
        if (fileName.endsWith('.txt')) {
          content = await file.text();
        } else if (fileName.endsWith('.docx')) {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          content = result.value;
          
          if (result.messages.length > 0) {
            addToast({ type: 'info', message: `模板文件 "${file.name}" 解析完成，部分内容可能未完全解析` });
          }
        }
        
        addContractFile({
          name: file.name,
          content,
          type: 'custom' as const,
        });
        addToast({ type: 'success', message: `模板文件 "${file.name}" 上传成功` });
      } catch {
        addContractFile({
          name: file.name,
          content: '',
          type: 'custom' as const,
        });
        addToast({ type: 'warning', message: `文件 "${file.name}" 内容解析失败，将使用默认模板` });
      }
      
      // 重置文件输入
      e.target.value = '';
    }
  };

  const generateOrderItemsList = (orderId: string): string => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return '';
    
    const downstreamItems = order.downstreams.map((ds, idx) => 
      `${idx + 1}. 下游客户: ${ds.company.name} - 金额: ${formatYuan(ds.amount)}`
    ).join('\n');
    
    const upstreamItems = order.upstreams.map((us, idx) => 
      `${idx + 1 + order.downstreams.length}. 上游供应商: ${us.company.name} - 金额: ${formatYuan(us.amount)}`
    ).join('\n');
    
    return downstreamItems + (downstreamItems && upstreamItems ? '\n' : '') + upstreamItems;
  };

  const generateContractContent = (orderId: string, templateContentStr: string): string => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return templateContentStr;

    let content = templateContentStr;
    
    const defaultUpstream = order.upstreams.length > 0 ? order.upstreams[0].company : {
      name: '待填写',
      unifiedCreditCode: '',
      address: '',
      contactPerson: '',
      contactPhone: '',
    };
    const defaultDownstream = order.downstreams.length > 0 ? order.downstreams[0].company : {
      name: '待填写',
      unifiedCreditCode: '',
      address: '',
      contactPerson: '',
      contactPhone: '',
    };
    
    const replacements: Record<string, string> = {
      '{订单号}': order.orderNo,
      '{合同编号}': order.orderNo,
      '{contractNo}': order.orderNo,
      '{ORD}': order.orderNo,
      '{主体企业名称}': order.mainCompany.name,
      '{主体企业信用代码}': order.mainCompany.unifiedCreditCode || '-',
      '{主体企业地址}': order.mainCompany.address || '-',
      '{主体企业联系人}': order.mainCompany.contactPerson || '-',
      '{主体企业电话}': order.mainCompany.contactPhone || '-',
      '{订单金额}': formatYuan(order.receivableAmount),
      '{当前日期}': formatDate(new Date()),
      '{模板名称}': templateName || '自定义模板',
      '{订单明细列表}': generateOrderItemsList(orderId),
      '{partyAName}': defaultDownstream.name || '待填写',
      '{partyAAddress}': defaultDownstream.address || '-',
      '{partyAContact}': defaultDownstream.contactPerson || '-',
      '{partyAPhone}': defaultDownstream.contactPhone || '-',
      '{甲方}': defaultDownstream.name || '待填写',
      '{甲方名称}': defaultDownstream.name || '待填写',
      '{甲方地址}': defaultDownstream.address || '-',
      '{甲方联系人}': defaultDownstream.contactPerson || '-',
      '{甲方电话}': defaultDownstream.contactPhone || '-',
      '{partyBName}': defaultUpstream.name || '待填写',
      '{partyBAddress}': defaultUpstream.address || '-',
      '{partyBContact}': defaultUpstream.contactPerson || '-',
      '{partyBPhone}': defaultUpstream.contactPhone || '-',
      '{乙方}': defaultUpstream.name || '待填写',
      '{乙方名称}': defaultUpstream.name || '待填写',
      '{乙方地址}': defaultUpstream.address || '-',
      '{乙方联系人}': defaultUpstream.contactPerson || '-',
      '{乙方电话}': defaultUpstream.contactPhone || '-',
    };

    Object.entries(replacements).forEach(([key, value]) => {
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      content = content.replace(new RegExp(escapedKey, 'g'), value);
    });

    return content;
  };

  const handleCreateContract = () => {
    if (!selectedOrder || !templateName) {
      addToast({ type: 'error', message: '请选择订单和合同模板' });
      return;
    }

    const order = orders.find(o => o.id === selectedOrder);
    if (!order) return;

    let content: string;
    let displayTemplateName: string;

    if (templateName.startsWith('preset-')) {
      // 预设模板
      const presetName = templateName.replace('preset-', '');
      displayTemplateName = presetName;
      content = generateContractContent(selectedOrder, predefinedTemplates[presetName] || predefinedTemplates['采购合同模板']);
    } else if (templateName.startsWith('uploaded-')) {
      // 已上传的模板
      const templateId = templateName.replace('uploaded-', '');
      const template = contractFiles.find(t => t.id === templateId);
      if (template) {
        displayTemplateName = template.name;
        if (template.content) {
          content = generateContractContent(selectedOrder, template.content);
        } else {
        // 如果模板内容为空（如docx文件），使用默认模板
        content = generateContractContent(selectedOrder, predefinedTemplates['采购合同模板']);
      }
      } else {
        addToast({ type: 'error', message: '模板不存在' });
        return;
      }
    } else if (templateName === 'custom-upload') {
      // 上传新模板
      if (templateContent) {
        displayTemplateName = customTemplate?.name || '自定义模板';
        content = generateContractContent(selectedOrder, templateContent);
      } else {
        addToast({ type: 'info', message: '使用默认模板生成合同，请使用.txt格式上传自定义模板' });
        displayTemplateName = '采购合同模板';
        content = generateContractContent(selectedOrder, predefinedTemplates['采购合同模板']);
      }
    } else {
      // 默认使用采购合同模板
      displayTemplateName = '采购合同模板';
      content = generateContractContent(selectedOrder, predefinedTemplates['采购合同模板']);
    }

    const fileName = `${displayTemplateName.replace(/合同模板/g, '').replace(/\.txt$/g, '')}_${order.orderNo}.txt`;
    
    addContract({
      orderId: selectedOrder,
      templateName: displayTemplateName,
      fileName,
      templateContent: content,
      status: 'generated',
    });

    addToast({ type: 'success', message: '合同生成成功' });
    setShowCreateModal(false);
    setSelectedOrder('');
    setTemplateName('');
    setCustomTemplate(null);
    setTemplateContent('');
  };

  const handleDownload = (contractId: string, fileName: string, contractTemplateName: string) => {
    const contract = contracts.find(c => c.id === contractId);
    const order = orders.find(o => o.id === contract?.orderId);
    
    if (!order) {
      addToast({ type: 'error', message: '订单不存在' });
      return;
    }

    let content = contract?.templateContent || '';

    if (!content) {
      content = generateContractContent(order.id, predefinedTemplates['采购合同模板']);
    }

    if (downloadFormat === 'docx') {
      const docFileName = fileName.replace('.txt', '.docx');
      if (contractTemplateName === '采购合同模板' || contractTemplateName === '销售合同模板' || contractTemplateName === '服务合同模板') {
        const templateType: 'purchase' | 'sales' | 'service' = 
          contractTemplateName === '采购合同模板' ? 'purchase' : 
          contractTemplateName === '销售合同模板' ? 'sales' : 'service';
        generateSimpleContractDocument(order, templateType, docFileName);
      } else {
        const defaultUpstream = order.upstreams.length > 0 ? order.upstreams[0].company : {
          name: '待填写', unifiedCreditCode: '', address: '', contactPerson: '', contactPhone: '',
        };
        const defaultDownstream = order.downstreams.length > 0 ? order.downstreams[0].company : {
          name: '待填写', unifiedCreditCode: '', address: '', contactPerson: '', contactPhone: '',
        };
        
        const variables = {
          '{订单号}': order.orderNo,
          '{合同编号}': order.orderNo,
          '{主体企业名称}': order.mainCompany.name,
          '{主体企业信用代码}': order.mainCompany.unifiedCreditCode || '-',
          '{主体企业地址}': order.mainCompany.address || '-',
          '{主体企业联系人}': order.mainCompany.contactPerson || '-',
          '{主体企业电话}': order.mainCompany.contactPhone || '-',
          '{订单金额}': formatYuan(order.receivableAmount),
          '{当前日期}': formatDate(new Date()),
          '{甲方}': defaultDownstream.name || '待填写',
          '{甲方名称}': defaultDownstream.name || '待填写',
          '{甲方地址}': defaultDownstream.address || '-',
          '{甲方联系人}': defaultDownstream.contactPerson || '-',
          '{甲方电话}': defaultDownstream.contactPhone || '-',
          '{乙方}': defaultUpstream.name || '待填写',
          '{乙方名称}': defaultUpstream.name || '待填写',
          '{乙方地址}': defaultUpstream.address || '-',
          '{乙方联系人}': defaultUpstream.contactPerson || '-',
          '{乙方电话}': defaultUpstream.contactPhone || '-',
        };
        
        generateWordDocumentFromText(content, variables, docFileName);
      }
    } else {
      // 原有的 TXT 下载
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    addToast({ type: 'success', message: '合同下载成功' });
  };

  const orderContractMap = orders.map(order => {
    const contract = contracts.find(c => c.orderId === order.id);
    return { order, contract };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">合同管理</h1>
          <p className="text-slate-500 mt-1">管理订单合同，生成和下载</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowTemplateList(!showTemplateList)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showTemplateList
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-5 h-5" />
            模板管理 ({contractFiles.length})
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            生成合同
          </button>
        </div>
      </div>

      {showTemplateList && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">已上传的模板文件</h2>
            <button
              onClick={() => document.getElementById('template-upload-input')?.click()}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              上传模板
            </button>
          </div>
          
          <input
            id="template-upload-input"
            type="file"
            accept=".txt,.docx,.pdf"
            onChange={handleTemplateUpload}
            className="hidden"
          />
          
          {contractFiles.length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-12 text-center">
              <Upload className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 mb-2">暂无上传的模板文件</p>
              <p className="text-sm text-slate-400">点击上方"上传模板"按钮上传合同模板</p>
              <p className="text-xs text-slate-400 mt-1">支持 .txt, .docx, .pdf 格式</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contractFiles.map((template) => (
                <div
                  key={template.id}
                  className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-800">{template.name}</span>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {template.type === 'custom' ? '自定义' : '系统'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    上传时间：{formatDate(template.createdAt)}
                  </p>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                    {template.content.substring(0, 100)}...
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orderContractMap.map(({ order, contract }) => (
          <div
            key={order.id}
            className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              {contract ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  已生成
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                  未生成
                </span>
              )}
            </div>

            <h3 className="font-semibold text-slate-800 mb-1">{order.orderNo}</h3>
            <p className="text-sm text-slate-500 mb-4">{order.mainCompany.name}</p>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">应收金额</span>
                <span className="font-medium text-green-600">{formatYuan(order.receivableAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">应付金额</span>
                <span className="font-medium text-red-600">{formatYuan(order.payableAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">订单编号</span>
                <span className="text-slate-600">{order.orderNo}</span>
              </div>
              {contract && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">模板</span>
                  <span className="text-slate-600">{contract.templateName}</span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              {contract ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">{contract.fileName}</span>
                    <span className="text-xs text-slate-400">{formatDate(contract.createdAt)}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="downloadFormat"
                        value="docx"
                        checked={downloadFormat === 'docx'}
                        onChange={() => setDownloadFormat('docx')}
                        className="hidden"
                      />
                      <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                        Word 文档 (.docx)
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownload(contract.id, contract.fileName, contract.templateName)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        下载合同
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`确定要删除合同 "${contract.fileName}" 吗？`)) {
                            deleteContract(contract.id);
                            addToast({ type: 'success', message: '合同已删除' });
                          }
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setSelectedOrder(order.id);
                    setShowCreateModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  生成合同
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {orderContractMap.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
          <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">暂无合同数据</p>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-semibold text-slate-800">生成合同</h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  选择订单 *
                </label>
                <select
                  value={selectedOrder}
                  onChange={(e) => setSelectedOrder(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">请选择订单</option>
                  {orders.map(order => (
                    <option key={order.id} value={order.id}>
                      {order.orderNo} - {order.mainCompany.name} - 应收: {formatYuan(order.receivableAmount)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  下载格式
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="createFormat"
                    value="docx"
                    checked={downloadFormat === 'docx'}
                    onChange={() => setDownloadFormat('docx')}
                    className="hidden"
                  />
                  <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                    Word 文档 (.docx)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  选择模板 *
                </label>
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-200 max-h-80 overflow-y-auto">
                  {Object.keys(predefinedTemplates).map((name) => (
                    <label key={name} className="flex items-center gap-2 p-3 cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        name="template"
                        value={`preset-${name}`}
                        checked={templateName === `preset-${name}`}
                        onChange={(e) => {
                          setTemplateName(e.target.value);
                          setCustomTemplate(null);
                          setTemplateContent('');
                        }}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{name}</p>
                        <p className="text-sm text-slate-500">预设模板</p>
                      </div>
                    </label>
                  ))}
                  {contractFiles.length > 0 && (
                    <>
                      <div className="bg-slate-50 px-3 py-2">
                        <p className="text-xs font-medium text-slate-500">已上传的模板</p>
                      </div>
                      {contractFiles.map((template) => (
                        <label key={template.id} className="flex items-center gap-2 p-3 cursor-pointer hover:bg-slate-50">
                          <input
                            type="radio"
                            name="template"
                            value={`uploaded-${template.id}`}
                            checked={templateName === `uploaded-${template.id}`}
                            onChange={(e) => {
                              setTemplateName(e.target.value);
                              setCustomTemplate(null);
                              setTemplateContent(template.content);
                            }}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-slate-800">{template.name}</p>
                            <p className="text-sm text-slate-500">已上传模板</p>
                          </div>
                        </label>
                      ))}
                    </>
                  )}
                  <label className="flex items-center gap-2 p-3 cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="template"
                      value="custom-upload"
                      checked={templateName === 'custom-upload'}
                      onChange={(e) => {
                        setTemplateName(e.target.value);
                        setCustomTemplate(null);
                        setTemplateContent('');
                      }}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">上传新模板</p>
                      <p className="text-sm text-slate-500">选择本地文件上传</p>
                    </div>
                  </label>
                </div>
              </div>

              {(templateName === 'custom-upload' || templateName.startsWith('uploaded-')) && (
                <div>
                  {templateName === 'custom-upload' && (
                    <>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        上传模板文件
                      </label>
                      <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-slate-300 transition-colors cursor-pointer">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".txt,.docx,.pdf"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <div
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                          <p className="text-sm text-slate-500">
                            {customTemplate ? `已选择：${customTemplate.name}` : '点击上传模板文件'}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">支持 .txt, .docx, .pdf 格式</p>
                        </div>
                      </div>
                    </>
                  )}
                  {templateContent && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        模板内容预览（使用 {'{变量名}'} 标记占位）
                      </label>
                      <textarea
                        value={templateContent}
                        onChange={(e) => setTemplateContent(e.target.value)}
                        rows={8}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm font-mono"
                      />
                      <div className="mt-2 text-xs text-slate-500">
                        可用变量：{'{订单号}'}, {'{主体企业名称}'}, {'{主体企业信用代码}'}, {'{订单金额}'}, {'{当前日期}'}, {'{订单明细列表}'}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedOrder('');
                  setTemplateName('');
                  setCustomTemplate(null);
                  setTemplateContent('');
                }}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateContract}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                生成合同
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
