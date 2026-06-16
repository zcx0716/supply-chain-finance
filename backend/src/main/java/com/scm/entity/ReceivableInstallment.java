package com.scm.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@DiscriminatorValue("RECEIVABLE")
public class ReceivableInstallment extends PaymentInstallment {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receivable_plan_id", nullable = false)
    private ReceivablePlan receivablePlan;
}
