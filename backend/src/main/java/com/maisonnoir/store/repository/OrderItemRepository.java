package com.maisonnoir.store.repository;

import com.maisonnoir.store.model.OrderItem;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, UUID> {}
