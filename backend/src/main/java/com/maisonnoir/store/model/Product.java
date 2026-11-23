package com.maisonnoir.store.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "products")
public class Product {
    @Id
    private UUID id;

    @Column(nullable = false, unique = true, length = 120)
    private String slug;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(precision = 12, scale = 2)
    private BigDecimal compareAtPrice;

    @Column(nullable = false, length = 500)
    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false)
    private int inventory;

    @Column(nullable = false)
    private boolean featured;

    @Column(nullable = false, precision = 2, scale = 1)
    private BigDecimal rating;

    @Column(nullable = false)
    private int reviewCount;

    @Column(nullable = false)
    private boolean active = true;

    @Version
    private long version;

    protected Product() {}

    public Product(UUID id, String slug, String name, String description, BigDecimal price,
                   BigDecimal compareAtPrice, String imageUrl, Category category, int inventory,
                   boolean featured, BigDecimal rating, int reviewCount) {
        this.id = id;
        this.slug = slug;
        this.name = name;
        this.description = description;
        this.price = price;
        this.compareAtPrice = compareAtPrice;
        this.imageUrl = imageUrl;
        this.category = category;
        this.inventory = inventory;
        this.featured = featured;
        this.rating = rating;
        this.reviewCount = reviewCount;
        this.active = true;
    }

    public void adjustInventory(int adjustment) {
        long updatedInventory = (long) inventory + adjustment;
        if (updatedInventory < 0 || updatedInventory > Integer.MAX_VALUE) {
            throw new IllegalArgumentException("Inventory must remain within the supported range");
        }
        inventory = (int) updatedInventory;
    }

    public void addReview(int reviewRating) {
        if (reviewRating < 1 || reviewRating > 5) {
            throw new IllegalArgumentException("A review rating must be between 1 and 5");
        }
        rating = rating.multiply(BigDecimal.valueOf(reviewCount))
                .add(BigDecimal.valueOf(reviewRating))
                .divide(BigDecimal.valueOf((long) reviewCount + 1), 1, java.math.RoundingMode.HALF_UP);
        reviewCount++;
    }

    public UUID getId() { return id; }
    public String getSlug() { return slug; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public BigDecimal getPrice() { return price; }
    public BigDecimal getCompareAtPrice() { return compareAtPrice; }
    public String getImageUrl() { return imageUrl; }
    public Category getCategory() { return category; }
    public int getInventory() { return inventory; }
    public boolean isFeatured() { return featured; }
    public BigDecimal getRating() { return rating; }
    public int getReviewCount() { return reviewCount; }
    public boolean isActive() { return active; }
}
