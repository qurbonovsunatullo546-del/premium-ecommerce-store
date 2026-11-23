package com.maisonnoir.store.repository;

import com.maisonnoir.store.model.CartItem;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItem, UUID> {
    List<CartItem> findByCart_Id(UUID cartId);
}
