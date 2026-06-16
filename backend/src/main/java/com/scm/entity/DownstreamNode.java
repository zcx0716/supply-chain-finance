package com.scm.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Entity
@Table(name = "downstream_nodes")
public class DownstreamNode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Customer company;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(columnDefinition = "TEXT")
    private String items;
}
