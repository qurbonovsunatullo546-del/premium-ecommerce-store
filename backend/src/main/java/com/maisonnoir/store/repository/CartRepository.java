package com.maisonnoir.store.repository;

import com.maisonnoir.store.model.Cart;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartRepository extends JpaRepository<Cart, UUID> {
    Optional<Cart> findByUser_Id(UUID userId);
}
