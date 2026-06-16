package com.scm.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_no", nullable = false, unique = true, length = 50)
    private String orderNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "main_company_id", nullable = false)
    private Customer mainCompany;

    @Column(name = "receivable_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal receivableAmount;

    @Column(name = "payable_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal payableAmount;

    @Column(length = 20)
    private String currency = "CNY";

    @Column(length = 50)
    private String status = "draft";

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UpstreamNode> upstreams = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DownstreamNode> downstreams = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReceivablePlan> receivablePlans = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PayablePlan> payablePlans = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // 辅助方法
    public void addUpstream(UpstreamNode upstream) {
        upstreams.add(upstream);
        upstream.setOrder(this);
    }

    public void addDownstream(DownstreamNode downstream) {
        downstreams.add(downstream);
        downstream.setOrder(this);
    }

    public void addReceivablePlan(ReceivablePlan plan) {
        receivablePlans.add(plan);
        plan.setOrder(this);
    }

    public void addPayablePlan(PayablePlan plan) {
        payablePlans.add(plan);
        plan.setOrder(this);
    }
}
