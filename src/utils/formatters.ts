export type CurrencyType = 'CNY' | 'JPY' | 'USD';

export function formatCurrency(amount: number, currency: CurrencyType = 'CNY'): string {
  const currencyConfig: Record<CurrencyType, { locale: string; currency: string; symbol?: string }> = {
    CNY: { locale: 'zh-CN', currency: 'CNY' },
    JPY: { locale: 'ja-JP', currency: 'JPY' },
    USD: { locale: 'en-US', currency: 'USD' },
  };

  const config = currencyConfig[currency];
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    minimumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(amount);
}

// 便捷函数：格式化为人民币
export function formatCNY(amount: number): string {
  return formatCurrency(amount, 'CNY');
}

// 便捷函数：格式化为日元
export function formatJPY(amount: number): string {
  return formatCurrency(amount, 'JPY');
}

// 格式化为"元"为单位，不显示符号
export function formatYuan(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + '元';
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function generateOrderNo(): string {
  const date = new Date();
  const timestamp = date.getTime().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${timestamp}${random}`;
}

export function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    draft: '草稿',
    active: '进行中',
    completed: '已完成',
    cancelled: '已取消',
    pending: '待处理',
    processing: '处理中',
  };
  return statusMap[status] || status;
}

export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    active: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
}
