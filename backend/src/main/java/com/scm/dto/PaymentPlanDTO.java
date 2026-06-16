package com.scm.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
public class PaymentPlanDTO {
    private Long id;
    private Long orderId;
    private String companyName;
    private BigDecimal totalAmount;
    private BigDecimal completedAmount;
    private List<InstallmentDTO> installments = new ArrayList<>();
    private String createdAt;
}
