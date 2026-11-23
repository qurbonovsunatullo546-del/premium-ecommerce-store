package com.maisonnoir.store.repository;

import com.maisonnoir.store.model.Payment;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {}
