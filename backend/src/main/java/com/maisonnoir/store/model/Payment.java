package com.maisonnoir.store.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payments")
public class Payment {
    @Id
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private StoreOrder order;

    @Column(nullable = false, length = 60)
    private String provider;

    @Column(length = 200)
    private String providerReference;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentStatus status;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private Instant createdAt;

    protected Payment() {}

    public Payment(UUID id, StoreOrder order, String provider, String providerReference,
                   PaymentStatus status, BigDecimal amount, Instant createdAt) {
        this.id = id;
        this.order = order;
        this.provider = provider;
        this.providerReference = providerReference;
        this.status = status;
        this.amount = amount;
        this.createdAt = createdAt;
    }
}
