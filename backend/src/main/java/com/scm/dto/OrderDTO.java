package com.scm.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
public class OrderDTO {
    private Long id;
    private String orderNo;
    private Long mainCompanyId;
    private String mainCompanyName;
    private BigDecimal receivableAmount;
    private BigDecimal payableAmount;
    private String currency;
    private String status;
    private String createdAt;
    private String updatedAt;
    private List<UpstreamNodeDTO> upstreams = new ArrayList<>();
    private List<DownstreamNodeDTO> downstreams = new ArrayList<>();
}
