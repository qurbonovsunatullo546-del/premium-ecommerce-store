package com.maisonnoir.store.service;

import com.maisonnoir.store.model.PaymentStatus;
import java.math.BigDecimal;

public interface PaymentGateway {
    PaymentIntent createIntent(String orderNumber, BigDecimal amount);

    record PaymentIntent(String provider, String reference, PaymentStatus status) {}
}
