package com.maisonnoir.store.api;

import com.maisonnoir.store.api.ApiDtos.CartLineResponse;
import com.maisonnoir.store.api.ApiDtos.CartRequest;
import com.maisonnoir.store.service.AccountService;
import com.maisonnoir.store.service.CartService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cart")
public class CartController {
    private final CartService carts;
    private final AccountService accounts;

    public CartController(CartService carts, AccountService accounts) {
        this.carts = carts;
        this.accounts = accounts;
    }

    @GetMapping
    public List<CartLineResponse> get(Authentication authentication) {
        return carts.get(accounts.getByEmail(authentication.getName()));
    }

    @PutMapping
    public List<CartLineResponse> replace(@Valid @RequestBody CartRequest request, Authentication authentication) {
        return carts.replace(accounts.getByEmail(authentication.getName()), request);
    }
}
