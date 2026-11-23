package com.maisonnoir.store.repository;

import com.maisonnoir.store.model.StoreUser;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoreUserRepository extends JpaRepository<StoreUser, UUID> {
    Optional<StoreUser> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
}
