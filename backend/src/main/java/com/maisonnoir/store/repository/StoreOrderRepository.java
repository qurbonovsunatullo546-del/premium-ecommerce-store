package com.maisonnoir.store.repository;

import com.maisonnoir.store.model.StoreOrder;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoreOrderRepository extends JpaRepository<StoreOrder, UUID> {
    List<StoreOrder> findAllByUser_IdOrderByCreatedAtDesc(UUID userId);
    List<StoreOrder> findAllByOrderByCreatedAtDesc();
}
