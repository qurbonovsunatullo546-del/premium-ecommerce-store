package com.maisonnoir.store.repository;

import com.maisonnoir.store.model.Wishlist;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WishlistRepository extends JpaRepository<Wishlist, UUID> {
    Optional<Wishlist> findByUser_Id(UUID userId);
}
