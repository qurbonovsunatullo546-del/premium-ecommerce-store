package com.maisonnoir.store.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reviews")
public class Review {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private StoreUser user;

    @Column(nullable = false)
    private int rating;

    @Column(nullable = false, length = 1200)
    private String body;

    @Column(nullable = false)
    private Instant createdAt;

    protected Review() {}

    public Review(UUID id, Product product, StoreUser user, int rating, String body, Instant createdAt) {
        this.id = id;
        this.product = product;
        this.user = user;
        this.rating = rating;
        this.body = body;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public StoreUser getUser() { return user; }
    public int getRating() { return rating; }
    public String getBody() { return body; }
    public Instant getCreatedAt() { return createdAt; }
}
