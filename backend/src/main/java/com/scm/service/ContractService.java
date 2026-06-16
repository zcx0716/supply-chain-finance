package com.scm.service;

import com.scm.dto.CustomerDTO;
import com.scm.dto.OrderDTO;
import com.scm.dto.UpstreamNodeDTO;
import com.scm.dto.DownstreamNodeDTO;
import com.scm.entity.Contract;
import com.scm.entity.Order;
import com.scm.repository.ContractRepository;
import com.scm.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ContractService {

    private final ContractRepository contractRepository;
    private final OrderRepository orderRepository;
    private final OrderService orderService;

    public List<Contract> getContractsByOrderId(Long orderId) {
        return contractRepository.findByOrderId(orderId);
    }

    public Contract getContractById(Long id) {
        return contractRepository.findById(id).orElse(null);
    }

    @Transactional
    public Contract createContract(Long orderId, String templateName, String templateContent) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) return null;

        Contract contract = new Contract();
        contract.setOrder(order);
        contract.setTemplateName(templateName);
        contract.setTemplateContent(templateContent);
        contract.setStatus("draft");

        // 生成Word文档
        byte[] fileData = generateContractDocument(order, templateContent);
        contract.setFileData(fileData);
        contract.setFileName(templateName + "_" + order.getOrderNo() + ".docx");

        return contractRepository.save(contract);
    }

    public byte[] generateContractDocument(Order order, String templateContent) {
        try (XWPFDocument document = new XWPFDocument();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            // 创建标题
            XWPFParagraph title = document.createParagraph();
            title.setAlignment(ParagraphAlignment.CENTER);
            XWPFRun titleRun = title.createRun();
            titleRun.setText("合同");
            titleRun.setBold(true);
            titleRun.setFontSize(18);
            titleRun.setFontFamily("宋体");

            // 订单详情
            XWPFParagraph infoTitle = document.createParagraph();
            XWPFRun infoTitleRun = infoTitle.createRun();
            infoTitleRun.setText("一、订单信息");
            infoTitleRun.setBold(true);
            infoTitleRun.setFontSize(14);
            infoTitleRun.setFontFamily("宋体");

            XWPFTable infoTable = document.createTable();
            infoTable.setWidth("100%");
            addTableRow(infoTable, "订单编号", order.getOrderNo());
            addTableRow(infoTable, "主体企业", order.getMainCompany().getName());
            addTableRow(infoTable, "应收金额", formatAmount(order.getReceivableAmount()));
            addTableRow(infoTable, "应付金额", formatAmount(order.getPayableAmount()));
            addTableRow(infoTable, "状态", getStatusText(order.getStatus()));

            // 下游客户
            XWPFParagraph downstreamTitle = document.createParagraph();
            XWPFRun downstreamTitleRun = downstreamTitle.createRun();
            downstreamTitleRun.setText("二、下游客户");
            downstreamTitleRun.setBold(true);
            downstreamTitleRun.setFontSize(14);
            downstreamTitleRun.setFontFamily("宋体");

            XWPFTable downstreamTable = document.createTable();
            downstreamTable.setWidth("100%");
            addTableHeader(downstreamTable, "序号", "客户名称", "金额");
            int idx = 1;
            for (var downstream : order.getDownstreams()) {
                addTableRow(downstreamTable,
                        String.valueOf(idx++),
                        downstream.getCompany().getName(),
                        formatAmount(downstream.getAmount()));
            }

            // 上游供应商
            XWPFParagraph upstreamTitle = document.createParagraph();
            XWPFRun upstreamTitleRun = upstreamTitle.createRun();
            upstreamTitleRun.setText("三、上游供应商");
            upstreamTitleRun.setBold(true);
            upstreamTitleRun.setFontSize(14);
            upstreamTitleRun.setFontFamily("宋体");

            XWPFTable upstreamTable = document.createTable();
            upstreamTable.setWidth("100%");
            addTableHeader(upstreamTable, "序号", "供应商名称", "金额");
            idx = 1;
            for (var upstream : order.getUpstreams()) {
                addTableRow(upstreamTable,
                        String.valueOf(idx++),
                        upstream.getCompany().getName(),
                        formatAmount(upstream.getAmount()));
            }

            document.write(outputStream);
            return outputStream.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate contract document", e);
        }
    }

    private void addTableHeader(XWPFTable table, String... headers) {
        XWPFTableRow row = table.getRow(0);
        for (int i = 0; i < headers.length; i++) {
            XWPFTableCell cell = i == 0 ? row.getCell(i) : row.createCell();
            XWPFRun run = cell.addParagraph().createRun();
            run.setText(headers[i]);
            run.setBold(true);
            cell.setColor("F2F2F2");
        }
    }

    private void addTableRow(XWPFTable table, String... values) {
        XWPFTableRow row = table.createRow();
        for (int i = 0; i < values.length; i++) {
            XWPFTableCell cell = row.getCell(i);
            XWPFRun run = cell.addParagraph().createRun();
            run.setText(values[i]);
        }
    }

    private String formatAmount(java.math.BigDecimal amount) {
        if (amount == null) return "0.00";
        return String.format("¥%.2f", amount);
    }

    private String getStatusText(String status) {
        if (status == null) return "未知";
        switch (status) {
            case "draft": return "草稿";
            case "active": return "执行中";
            case "completed": return "已完成";
            case "cancelled": return "已取消";
            default: return status;
        }
    }

    public byte[] getContractFile(Long id) {
        Contract contract = contractRepository.findById(id).orElse(null);
        return contract != null ? contract.getFileData() : null;
    }
}
