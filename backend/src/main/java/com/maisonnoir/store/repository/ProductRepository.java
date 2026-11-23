package com.maisonnoir.store.repository;

import com.maisonnoir.store.model.Product;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, UUID> {
    List<Product> findAllByActiveTrue();
    List<Product> findByCategory_SlugAndActiveTrue(String slug);
    Optional<Product> findBySlugAndActiveTrue(String slug);
}
