package com.scm.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "receivable_plans")
public class ReceivablePlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "downstream_id")
    private DownstreamNode downstream;

    @Column(name = "downstream_name", length = 200)
    private String downstreamName;

    @Column(name = "total_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalAmount;

    @OneToMany(mappedBy = "receivablePlan", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReceivableInstallment> installments = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public void addInstallment(ReceivableInstallment installment) {
        installments.add(installment);
        installment.setReceivablePlan(this);
    }
}
