package com.maisonnoir.store.api;

import com.maisonnoir.store.api.ApiDtos.ProductResponse;
import com.maisonnoir.store.service.AccountService;
import com.maisonnoir.store.service.WishlistService;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {
    private final WishlistService wishlists;
    private final AccountService accounts;

    public WishlistController(WishlistService wishlists, AccountService accounts) {
        this.wishlists = wishlists;
        this.accounts = accounts;
    }

    @GetMapping
    public List<ProductResponse> get(Authentication authentication) {
        return wishlists.get(accounts.getByEmail(authentication.getName()));
    }

    @PostMapping("/{productId}")
    public void add(@PathVariable UUID productId, Authentication authentication) {
        wishlists.add(accounts.getByEmail(authentication.getName()), productId);
    }

    @DeleteMapping("/{productId}")
    public void remove(@PathVariable UUID productId, Authentication authentication) {
        wishlists.remove(accounts.getByEmail(authentication.getName()), productId);
    }
}
