package com.maisonnoir.store.service;

import com.maisonnoir.store.model.PaymentStatus;
import java.math.BigDecimal;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class DemoPaymentGateway implements PaymentGateway {
    @Override
    public PaymentIntent createIntent(String orderNumber, BigDecimal amount) {
        return new PaymentIntent("demo-unconfigured", "demo-" + UUID.randomUUID(), PaymentStatus.PENDING);
    }
}
