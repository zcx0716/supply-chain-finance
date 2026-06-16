package com.scm.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class InstallmentDTO {
    private Long id;
    private BigDecimal amount;
    private String plannedDate;
    private String actualDate;
    private String status;
    private String notes;
}
