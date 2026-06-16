package com.scm.service;

import com.scm.dto.*;
import com.scm.entity.*;
import com.scm.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final ReceivablePlanRepository receivablePlanRepository;
    private final PayablePlanRepository payablePlanRepository;

    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private final Random random = new Random();

    public List<OrderDTO> getAllOrders() {
        return orderRepository.findAllWithDetails().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public OrderDTO getOrderById(Long id) {
        return orderRepository.findByIdWithDetails(id)
                .map(this::convertToDTO)
                .orElse(null);
    }

    @Transactional
    public OrderDTO createOrder(OrderDTO orderDTO) {
        Order order = new Order();
        order.setOrderNo(generateOrderNo());
        order.setCurrency(orderDTO.getCurrency());
        order.setStatus("draft");

        // 设置主体企业
        Customer mainCompany = customerRepository.findById(orderDTO.getMainCompanyId())
                .orElseThrow(() -> new RuntimeException("Main company not found"));
        order.setMainCompany(mainCompany);

        // 计算应收和应付金额
        BigDecimal totalReceivable = BigDecimal.ZERO;
        BigDecimal totalPayable = BigDecimal.ZERO;

        // 添加上游节点
        for (UpstreamNodeDTO upstreamDTO : orderDTO.getUpstreams()) {
            UpstreamNode upstream = new UpstreamNode();
            Customer upstreamCompany = customerRepository.findById(upstreamDTO.getCompanyId())
                    .orElseThrow(() -> new RuntimeException("Upstream company not found"));
            upstream.setCompany(upstreamCompany);
            upstream.setAmount(upstreamDTO.getAmount());
            upstream.setItems(upstreamDTO.getItems());
            upstream.setParentUpstreamId(upstreamDTO.getParentUpstreamId());
            order.addUpstream(upstream);
            totalPayable = totalPayable.add(upstreamDTO.getAmount());
        }

        // 添加下游节点
        for (DownstreamNodeDTO downstreamDTO : orderDTO.getDownstreams()) {
            DownstreamNode downstream = new DownstreamNode();
            Customer downstreamCompany = customerRepository.findById(downstreamDTO.getCompanyId())
                    .orElseThrow(() -> new RuntimeException("Downstream company not found"));
            downstream.setCompany(downstreamCompany);
            downstream.setAmount(downstreamDTO.getAmount());
            downstream.setItems(downstreamDTO.getItems());
            order.addDownstream(downstream);
            totalReceivable = totalReceivable.add(downstreamDTO.getAmount());
        }

        order.setReceivableAmount(totalReceivable);
        order.setPayableAmount(totalPayable);

        // 保存订单
        Order savedOrder = orderRepository.save(order);

        // 生成资金计划
        generatePaymentPlans(savedOrder);

        return convertToDTO(savedOrder);
    }

    private void generatePaymentPlans(Order order) {
        // 为每个下游生成应收计划
        for (DownstreamNode downstream : order.getDownstreams()) {
            ReceivablePlan plan = new ReceivablePlan();
            plan.setDownstreamName(downstream.getCompany().getName());
            plan.setTotalAmount(downstream.getAmount());
            order.addReceivablePlan(plan);

            // 生成分期
            generateInstallments(downstream.getAmount(), plan);
        }

        // 为每个上游生成应付计划
        for (UpstreamNode upstream : order.getUpstreams()) {
            PayablePlan plan = new PayablePlan();
            plan.setUpstreamName(upstream.getCompany().getName());
            plan.setTotalAmount(upstream.getAmount());
            order.addPayablePlan(plan);

            // 生成分期
            generatePayableInstallments(upstream.getAmount(), plan, order.getDownstreams().size());
        }
    }

    private void generateInstallments(BigDecimal totalAmount, ReceivablePlan plan) {
        BigDecimal remaining = totalAmount;
        LocalDate currentDate = LocalDate.now();
        int dayOffset = 0;

        while (remaining.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal installmentAmount;
            if (remaining.compareTo(new BigDecimal("500000")) <= 0) {
                installmentAmount = remaining;
            } else {
                // 1万到50万之间的随机金额，取整千
                double minAmount = 10000.0;
                double maxAmount = Math.min(remaining.doubleValue(), 500000.0);
                double randomAmount = minAmount + (maxAmount - minAmount) * random.nextDouble();
                long roundedAmount = Math.round(randomAmount / 1000.0) * 1000;
                installmentAmount = new BigDecimal(roundedAmount);
            }

            ReceivableInstallment installment = new ReceivableInstallment();
            installment.setAmount(installmentAmount);
            installment.setPlannedDate(currentDate.plusDays(dayOffset));
            installment.setStatus("pending");
            plan.addInstallment(installment);

            remaining = remaining.subtract(installmentAmount);
            dayOffset++;
        }
    }

    private void generatePayableInstallments(BigDecimal totalAmount, PayablePlan plan, int delayDays) {
        BigDecimal remaining = totalAmount;
        LocalDate currentDate = LocalDate.now().plusDays(delayDays + 1);
        int dayOffset = 0;

        while (remaining.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal installmentAmount;
            if (remaining.compareTo(new BigDecimal("500000")) <= 0) {
                installmentAmount = remaining;
            } else {
                double minAmount = 10000.0;
                double maxAmount = Math.min(remaining.doubleValue(), 500000.0);
                double randomAmount = minAmount + (maxAmount - minAmount) * random.nextDouble();
                long roundedAmount = Math.round(randomAmount / 1000.0) * 1000;
                installmentAmount = new BigDecimal(roundedAmount);
            }

            PayableInstallment installment = new PayableInstallment();
            installment.setAmount(installmentAmount);
            installment.setPlannedDate(currentDate.plusDays(dayOffset));
            installment.setStatus("pending");
            plan.addInstallment(installment);

            remaining = remaining.subtract(installmentAmount);
            dayOffset++;
        }
    }

    public OrderDTO updateOrder(Long id, OrderDTO orderDTO) {
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) return null;

        if (orderDTO.getStatus() != null) {
            order.setStatus(orderDTO.getStatus());
        }

        Order savedOrder = orderRepository.save(order);
        return convertToDTO(savedOrder);
    }

    public void deleteOrder(Long id) {
        orderRepository.deleteById(id);
    }

    private String generateOrderNo() {
        String prefix = "ORD";
        String timestamp = String.valueOf(System.currentTimeMillis()).substring(7);
        String random = String.format("%04d", new Random().nextInt(10000));
        return prefix + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + timestamp + random;
    }

    private OrderDTO convertToDTO(Order order) {
        OrderDTO dto = new OrderDTO();
        dto.setId(order.getId());
        dto.setOrderNo(order.getOrderNo());
        dto.setMainCompanyId(order.getMainCompany().getId());
        dto.setMainCompanyName(order.getMainCompany().getName());
        dto.setReceivableAmount(order.getReceivableAmount());
        dto.setPayableAmount(order.getPayableAmount());
        dto.setCurrency(order.getCurrency());
        dto.setStatus(order.getStatus());
        dto.setCreatedAt(order.getCreatedAt().format(dateFormatter));
        if (order.getUpdatedAt() != null) {
            dto.setUpdatedAt(order.getUpdatedAt().format(dateFormatter));
        }

        // 转换上游节点
        List<UpstreamNodeDTO> upstreamDTOs = order.getUpstreams().stream()
                .map(upstream -> {
                    UpstreamNodeDTO upstreamDTO = new UpstreamNodeDTO();
                    upstreamDTO.setId(upstream.getId());
                    upstreamDTO.setCompanyId(upstream.getCompany().getId());
                    upstreamDTO.setCompanyName(upstream.getCompany().getName());
                    upstreamDTO.setAmount(upstream.getAmount());
                    upstreamDTO.setItems(upstream.getItems());
                    upstreamDTO.setParentUpstreamId(upstream.getParentUpstreamId());
                    return upstreamDTO;
                })
                .collect(Collectors.toList());
        dto.setUpstreams(upstreamDTOs);

        // 转换下游节点
        List<DownstreamNodeDTO> downstreamDTOs = order.getDownstreams().stream()
                .map(downstream -> {
                    DownstreamNodeDTO downstreamDTO = new DownstreamNodeDTO();
                    downstreamDTO.setId(downstream.getId());
                    downstreamDTO.setCompanyId(downstream.getCompany().getId());
                    downstreamDTO.setCompanyName(downstream.getCompany().getName());
                    downstreamDTO.setAmount(downstream.getAmount());
                    downstreamDTO.setItems(downstream.getItems());
                    return downstreamDTO;
                })
                .collect(Collectors.toList());
        dto.setDownstreams(downstreamDTOs);

        return dto;
    }
}
