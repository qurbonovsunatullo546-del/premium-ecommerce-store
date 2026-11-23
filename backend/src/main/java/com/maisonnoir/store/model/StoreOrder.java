package com.maisonnoir.store.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@Entity
@Table(name = "store_orders")
public class StoreOrder {
    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 32)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private StoreUser user;

    @Column(nullable = false, length = 254)
    private String email;

    @Column(nullable = false, length = 500)
    private String shippingAddress;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private OrderStatus status;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Column(nullable = false)
    private Instant createdAt;

    protected StoreOrder() {}

    public StoreOrder(UUID id, String orderNumber, StoreUser user, String email, String shippingAddress,
                      OrderStatus status, BigDecimal total, Instant createdAt) {
        this.id = id;
        this.orderNumber = orderNumber;
        this.user = user;
        this.email = email.toLowerCase(Locale.ROOT);
        this.shippingAddress = shippingAddress;
        this.status = status;
        this.total = total;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public String getOrderNumber() { return orderNumber; }
    public StoreUser getUser() { return user; }
    public String getEmail() { return email; }
    public String getShippingAddress() { return shippingAddress; }
    public OrderStatus getStatus() { return status; }
    public BigDecimal getTotal() { return total; }
    public Instant getCreatedAt() { return createdAt; }
}
