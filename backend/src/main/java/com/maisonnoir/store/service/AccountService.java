package com.maisonnoir.store.service;

import com.maisonnoir.store.api.ApiDtos.RegisterRequest;
import com.maisonnoir.store.model.StoreUser;
import com.maisonnoir.store.model.UserRole;
import com.maisonnoir.store.repository.StoreUserRepository;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AccountService {
    private final StoreUserRepository users;
    private final PasswordEncoder passwordEncoder;

    public AccountService(StoreUserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public StoreUser register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (users.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account already exists for this email");
        }
        return users.save(new StoreUser(UUID.randomUUID(), email, request.name().trim(),
                passwordEncoder.encode(request.password()), UserRole.CUSTOMER));
    }

    @Transactional(readOnly = true)
    public StoreUser getByEmail(String email) {
        return users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));
    }
}
