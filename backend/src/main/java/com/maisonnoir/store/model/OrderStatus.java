package com.maisonnoir.store.model;

public enum OrderStatus {
    PAYMENT_PENDING,
    CONFIRMED,
    FULFILLING,
    SHIPPED,
    DELIVERED,
    CANCELLED
}
