package com.scm.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class DownstreamNodeDTO {
    private Long id;
    private Long companyId;
    private String companyName;
    private BigDecimal amount;
    private String items;
}
