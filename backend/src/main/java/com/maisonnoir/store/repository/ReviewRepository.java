package com.maisonnoir.store.repository;

import com.maisonnoir.store.model.Review;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, UUID> {
    List<Review> findByProduct_IdOrderByCreatedAtDesc(UUID productId);
}
