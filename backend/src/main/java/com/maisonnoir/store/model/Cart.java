package com.maisonnoir.store.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "carts")
public class Cart {
    @Id
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private StoreUser user;

    @Column(nullable = false)
    private Instant updatedAt;

    protected Cart() {}

    public Cart(UUID id, StoreUser user, Instant updatedAt) {
        this.id = id;
        this.user = user;
        this.updatedAt = updatedAt;
    }

    public UUID getId() { return id; }
}
