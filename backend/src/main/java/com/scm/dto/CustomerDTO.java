package com.scm.dto;

import lombok.Data;

@Data
public class CustomerDTO {
    private Long id;
    private String name;
    private String address;
    private String unifiedCreditCode;
    private String contactPerson;
    private String contactPhone;
    private String region;
    private String industry;
    private String createdAt;
    private String updatedAt;
}
