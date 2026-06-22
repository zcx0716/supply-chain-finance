import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
} from 'docx';
import { saveAs } from 'file-saver';
import { Order } from '../types';

// 模板变量替换映射
export interface TemplateVariables {
  [key: string]: string;
}

// 从订单生成模板变量
export function generateTemplateVariables(order: Order): TemplateVariables {
  const { mainCompany, upstreams, downstreams, receivableAmount, payableAmount, orderNo } = order;

  // 获取上游和下游第一个企业作为默认甲乙双方
  const defaultUpstream = upstreams.length > 0 ? upstreams[0].company : {
    name: '待填写',
    unifiedCreditCode: '',
    address: '',
    contactPerson: '',
    contactPhone: '',
  };
  const defaultDownstream = downstreams.length > 0 ? downstreams[0].company : {
    name: '待填写',
    unifiedCreditCode: '',
    address: '',
    contactPerson: '',
    contactPhone: '',
  };

  return {
    '{订单号}': orderNo,
    '{甲方名称}': defaultDownstream.name,
    '{甲方统一社会信用代码}': defaultDownstream.unifiedCreditCode || '',
    '{甲方地址}': defaultDownstream.address || '',
    '{甲方联系人}': defaultDownstream.contactPerson || '',
    '{甲方电话}': defaultDownstream.contactPhone || '',
    '{乙方名称}': defaultUpstream.name,
    '{乙方统一社会信用代码}': defaultUpstream.unifiedCreditCode || '',
    '{乙方地址}': defaultUpstream.address || '',
    '{乙方联系人}': defaultUpstream.contactPerson || '',
    '{乙方电话}': defaultUpstream.contactPhone || '',
    '{主体企业名称}': mainCompany.name,
    '{主体企业统一社会信用代码}': mainCompany.unifiedCreditCode || '',
    '{主体企业地址}': mainCompany.address || '',
    '{主体企业联系人}': mainCompany.contactPerson || '',
    '{主体企业电话}': mainCompany.contactPhone || '',
    '{订单金额}': receivableAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 }),
    '{应收金额}': receivableAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 }),
    '{应付金额}': payableAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 }),
    '{订单金额大写}': numberToChinese(receivableAmount),
    '{当前日期}': formatDateForDisplay(new Date()),
  };
}

// 数字转中文大写
function numberToChinese(num: number): string {
  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const units = ['', '拾', '佰', '仟', '万', '拾', '佰', '仟', '亿'];

  let result = '';
  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  // 处理整数部分
  if (integerPart === 0) {
    result = '零';
  } else {
    let temp = integerPart;
    let unitIndex = 0;
    const parts: string[] = [];

    while (temp > 0) {
      const digit = temp % 10;
      if (digit !== 0) {
        parts.unshift(digits[digit] + units[unitIndex]);
      } else if (parts.length > 0 && !parts[0].startsWith('零')) {
        parts.unshift('零');
      }
      temp = Math.floor(temp / 10);
      unitIndex++;
    }
    result = parts.join('');
  }
  result += '元';

  // 处理小数部分
  if (decimalPart > 0) {
    const jiao = Math.floor(decimalPart / 10);
    const fen = decimalPart % 10;
    if (jiao > 0) {
      result += digits[jiao] + '角';
    } else if (fen > 0) {
      result += '零';
    }
    if (fen > 0) {
      result += digits[fen] + '分';
    }
  } else {
    result += '整';
  }

  return result;
}

// 格式化日期显示
function formatDateForDisplay(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

// 从文本内容替换变量生成Word文档
export function generateWordDocumentFromText(
  textContent: string,
  variables: TemplateVariables,
  fileName: string = '合同文档.docx'
): void {
  // 替换模板变量
  let processedContent = textContent;
  Object.entries(variables).forEach(([key, value]) => {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedKey, 'g');
    processedContent = processedContent.replace(regex, value);
  });

  // 按行分割文本
  const lines = processedContent.split(/\r?\n/);

  // 创建段落
  const paragraphs = lines.map(line => {
    if (line.trim().startsWith('#')) {
      // 标题行
      return new Paragraph({
        text: line.trim().substring(1).trim(),
        heading: HeadingLevel.HEADING_1,
        spacing: {
          after: 200,
        },
      });
    }
    return new Paragraph({
      children: [new TextRun(line)],
      spacing: {
        line: 360, // 1.5倍行高
      },
    });
  });

  // 创建文档
  const doc = new Document({
    sections: [{
      properties: {},
      children: paragraphs,
    }],
  });

  // 打包并下载
  Packer.toBlob(doc).then(blob => {
    saveAs(blob, fileName);
  });
}

// 创建一个简单的合同模板文档生成器
export function generateSimpleContractDocument(
  order: Order,
  templateType: 'purchase' | 'sales' | 'service' = 'purchase',
  fileName?: string
): void {
  const variables = generateTemplateVariables(order);

  const templates = {
    purchase: `# 采购合同
合同编号：{订单号}

甲方（买方）：{主体企业名称}
统一社会信用代码：{主体企业统一社会信用代码}
地址：{主体企业地址}
联系人：{主体企业联系人}
联系电话：{主体企业电话}

乙方（卖方）：{乙方名称}
统一社会信用代码：{乙方统一社会信用代码}
地址：{乙方地址}
联系人：{乙方联系人}
联系电话：{乙方电话}

根据《中华人民共和国民法典》及相关法律法规，甲乙双方经友好协商，就甲方向乙方采购事宜达成如下协议：

一、采购标的
甲方向乙方采购货物/服务，合同总金额为人民币：{订单金额}元（大写：{订单金额大写}）。

二、交货/服务时间
双方另行约定。

三、付款方式
合同生效后，甲方按以下方式付款：
1. 
2. 
3. 

四、违约责任
双方均应严格履行本合同约定的义务，任何一方违约，应承担相应的违约责任。

五、争议解决
本合同履行过程中发生的争议，双方应友好协商解决；协商不成的，任何一方均有权向合同签订地有管辖权的人民法院提起诉讼。

六、其他
本合同自双方签字盖章之日起生效。本合同一式两份，甲乙双方各执一份，具有同等法律效力。

甲方（盖章）：{主体企业名称}
法定代表人或授权代表（签字）：
日期：{当前日期}

乙方（盖章）：{乙方名称}
法定代表人或授权代表（签字）：
日期：{当前日期}`,

    sales: `# 销售合同
合同编号：{订单号}

甲方（卖方）：{主体企业名称}
统一社会信用代码：{主体企业统一社会信用代码}
地址：{主体企业地址}
联系人：{主体企业联系人}
联系电话：{主体企业电话}

乙方（买方）：{乙方名称}
统一社会信用代码：{乙方统一社会信用代码}
地址：{乙方地址}
联系人：{乙方联系人}
联系电话：{乙方电话}

根据《中华人民共和国民法典》及相关法律法规，甲乙双方经友好协商，就甲方向乙方销售货物事宜达成如下协议：

一、销售标的
甲方向乙方销售货物/服务，合同总金额为人民币：{订单金额}元（大写：{订单金额大写}）。

二、交货时间和地点
双方另行约定。

三、付款方式
乙方应按以下方式向甲方支付货款：
1. 
2. 
3. 

四、违约责任
双方均应严格履行本合同约定的义务，任何一方违约，应承担相应的违约责任。

五、争议解决
本合同履行过程中发生的争议，双方应友好协商解决；协商不成的，任何一方均有权向合同签订地有管辖权的人民法院提起诉讼。

六、其他
本合同自双方签字盖章之日起生效。本合同一式两份，甲乙双方各执一份，具有同等法律效力。

甲方（盖章）：{主体企业名称}
法定代表人或授权代表（签字）：
日期：{当前日期}

乙方（盖章）：{乙方名称}
法定代表人或授权代表（签字）：
日期：{当前日期}`,

    service: `# 服务合同
合同编号：{订单号}

甲方（委托方）：{主体企业名称}
统一社会信用代码：{主体企业统一社会信用代码}
地址：{主体企业地址}
联系人：{主体企业联系人}
联系电话：{主体企业电话}

乙方（服务方）：{乙方名称}
统一社会信用代码：{乙方统一社会信用代码}
地址：{乙方地址}
联系人：{乙方联系人}
联系电话：{乙方电话}

根据《中华人民共和国民法典》及相关法律法规，甲乙双方经友好协商，就甲方委托乙方提供服务事宜达成如下协议：

一、服务内容
乙方应按照本合同约定向甲方提供服务，服务费用总计为人民币：{订单金额}元（大写：{订单金额大写}）。

二、服务期限
双方另行约定。

三、付款方式
甲方应按以下方式向乙方支付服务费用：
1. 
2. 
3. 

四、违约责任
双方均应严格履行本合同约定的义务，任何一方违约，应承担相应的违约责任。

五、争议解决
本合同履行过程中发生的争议，双方应友好协商解决；协商不成的，任何一方均有权向合同签订地有管辖权的人民法院提起诉讼。

六、其他
本合同自双方签字盖章之日起生效。本合同一式两份，甲乙双方各执一份，具有同等法律效力。

甲方（盖章）：{主体企业名称}
法定代表人或授权代表（签字）：
日期：{当前日期}

乙方（盖章）：{乙方名称}
法定代表人或授权代表（签字）：
日期：{当前日期}`,
  };

  const content = templates[templateType];
  generateWordDocumentFromText(content, variables, fileName || `${order.orderNo}_合同.docx`);
}
