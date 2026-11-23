package com.maisonnoir.store.model;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ProductTest {
    @Test
    void reviewRatingsAreAggregatedFromPersistedReviews() {
        Product product = new Product(UUID.randomUUID(), "reviewed-product", "Reviewed product", "Description",
                BigDecimal.ONE, null, "https://example.com/product.jpg",
                new Category(UUID.randomUUID(), "reviewed-category", "Reviewed category"),
                1, false, BigDecimal.ZERO.setScale(1), 0);

        product.addReview(5);
        product.addReview(2);

        assertEquals(2, product.getReviewCount());
        assertEquals(new BigDecimal("3.5"), product.getRating());
    }

    @Test
    void inventoryAdjustmentRejectsIntegerOverflowWithoutChangingStock() {
        Product product = new Product(UUID.randomUUID(), "test-product", "Test product", "Description",
                BigDecimal.ONE, null, "https://example.com/product.jpg",
                new Category(UUID.randomUUID(), "test-category", "Test category"),
                1, false, BigDecimal.ZERO, 0);

        assertThrows(IllegalArgumentException.class, () -> product.adjustInventory(Integer.MAX_VALUE));
        assertEquals(1, product.getInventory());
    }
}
