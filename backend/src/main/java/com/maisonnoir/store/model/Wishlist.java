package com.maisonnoir.store.model;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "wishlists")
public class Wishlist {
    @Id
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private StoreUser user;

    protected Wishlist() {}

    public Wishlist(UUID id, StoreUser user) {
        this.id = id;
        this.user = user;
    }

    public UUID getId() { return id; }
}
