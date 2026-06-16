package com.scm.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpstreamNodeDTO {
    private Long id;
    private Long companyId;
    private String companyName;
    private Long parentUpstreamId;
    private BigDecimal amount;
    private String items;
}
