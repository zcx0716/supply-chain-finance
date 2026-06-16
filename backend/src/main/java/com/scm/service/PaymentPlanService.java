package com.scm.service;

import com.scm.dto.InstallmentDTO;
import com.scm.dto.PaymentPlanDTO;
import com.scm.entity.*;
import com.scm.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentPlanService {

    private final ReceivablePlanRepository receivablePlanRepository;
    private final PayablePlanRepository payablePlanRepository;
    private final ReceivableInstallmentRepository receivableInstallmentRepository;
    private final PayableInstallmentRepository payableInstallmentRepository;

    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public List<PaymentPlanDTO> getReceivablePlansByOrderId(Long orderId) {
        return receivablePlanRepository.findByOrderIdWithInstallments(orderId).stream()
                .map(this::convertReceivableToDTO)
                .collect(Collectors.toList());
    }

    public List<PaymentPlanDTO> getPayablePlansByOrderId(Long orderId) {
        return payablePlanRepository.findByOrderIdWithInstallments(orderId).stream()
                .map(this::convertPayableToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateReceivableInstallmentStatus(Long planId, Long installmentId, String status, String notes) {
        ReceivablePlan plan = receivablePlanRepository.findById(planId).orElse(null);
        if (plan == null) return;

        ReceivableInstallment installment = plan.getInstallments().stream()
                .filter(i -> i.getId().equals(installmentId))
                .findFirst()
                .orElse(null);

        if (installment != null) {
            installment.setStatus(status);
            if (notes != null) {
                installment.setNotes(notes);
            }
            if ("completed".equals(status)) {
                installment.setActualDate(LocalDate.now());
            }
            receivableInstallmentRepository.save(installment);
        }
    }

    @Transactional
    public void updatePayableInstallmentStatus(Long planId, Long installmentId, String status, String notes) {
        PayablePlan plan = payablePlanRepository.findById(planId).orElse(null);
        if (plan == null) return;

        PayableInstallment installment = plan.getInstallments().stream()
                .filter(i -> i.getId().equals(installmentId))
                .findFirst()
                .orElse(null);

        if (installment != null) {
            installment.setStatus(status);
            if (notes != null) {
                installment.setNotes(notes);
            }
            if ("completed".equals(status)) {
                installment.setActualDate(LocalDate.now());
            }
            payableInstallmentRepository.save(installment);
        }
    }

    private PaymentPlanDTO convertReceivableToDTO(ReceivablePlan plan) {
        PaymentPlanDTO dto = new PaymentPlanDTO();
        dto.setId(plan.getId());
        dto.setOrderId(plan.getOrder().getId());
        dto.setCompanyName(plan.getDownstreamName());
        dto.setTotalAmount(plan.getTotalAmount());

        BigDecimal completedAmount = plan.getInstallments().stream()
                .filter(i -> "completed".equals(i.getStatus()))
                .map(PaymentInstallment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setCompletedAmount(completedAmount);

        List<InstallmentDTO> installmentDTOs = plan.getInstallments().stream()
                .map(this::convertInstallmentToDTO)
                .collect(Collectors.toList());
        dto.setInstallments(installmentDTOs);
        dto.setCreatedAt(plan.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        return dto;
    }

    private PaymentPlanDTO convertPayableToDTO(PayablePlan plan) {
        PaymentPlanDTO dto = new PaymentPlanDTO();
        dto.setId(plan.getId());
        dto.setOrderId(plan.getOrder().getId());
        dto.setCompanyName(plan.getUpstreamName());
        dto.setTotalAmount(plan.getTotalAmount());

        BigDecimal completedAmount = plan.getInstallments().stream()
                .filter(i -> "completed".equals(i.getStatus()))
                .map(PaymentInstallment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setCompletedAmount(completedAmount);

        List<InstallmentDTO> installmentDTOs = plan.getInstallments().stream()
                .map(this::convertInstallmentToDTO)
                .collect(Collectors.toList());
        dto.setInstallments(installmentDTOs);
        dto.setCreatedAt(plan.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        return dto;
    }

    private InstallmentDTO convertInstallmentToDTO(PaymentInstallment installment) {
        InstallmentDTO dto = new InstallmentDTO();
        dto.setId(installment.getId());
        dto.setAmount(installment.getAmount());
        dto.setPlannedDate(installment.getPlannedDate().format(dateFormatter));
        if (installment.getActualDate() != null) {
            dto.setActualDate(installment.getActualDate().format(dateFormatter));
        }
        dto.setStatus(installment.getStatus());
        dto.setNotes(installment.getNotes());
        return dto;
    }
}
