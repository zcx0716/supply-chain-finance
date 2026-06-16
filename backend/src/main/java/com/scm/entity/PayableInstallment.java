package com.scm.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@DiscriminatorValue("PAYABLE")
public class PayableInstallment extends PaymentInstallment {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payable_plan_id", nullable = false)
    private PayablePlan payablePlan;
}
