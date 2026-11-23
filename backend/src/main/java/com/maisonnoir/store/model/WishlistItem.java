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
@Table(name = "wishlist_items")
public class WishlistItem {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "wishlist_id", nullable = false)
    private Wishlist wishlist;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Instant addedAt;

    protected WishlistItem() {}

    public WishlistItem(UUID id, Wishlist wishlist, Product product, Instant addedAt) {
        this.id = id;
        this.wishlist = wishlist;
        this.product = product;
        this.addedAt = addedAt;
    }

    public Product getProduct() { return product; }
}
