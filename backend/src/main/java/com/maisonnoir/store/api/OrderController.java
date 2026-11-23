package com.maisonnoir.store.api;

import com.maisonnoir.store.api.ApiDtos.OrderRequest;
import com.maisonnoir.store.api.ApiDtos.OrderResponse;
import com.maisonnoir.store.model.StoreUser;
import com.maisonnoir.store.service.AccountService;
import com.maisonnoir.store.service.OrderService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService orders;
    private final AccountService accounts;

    public OrderController(OrderService orders, AccountService accounts) {
        this.orders = orders;
        this.accounts = accounts;
    }

    @PostMapping
    public OrderResponse place(@Valid @RequestBody OrderRequest request, Authentication authentication) {
        StoreUser user = authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName()) ? null : accounts.getByEmail(authentication.getName());
        return orders.place(request, user);
    }

    @GetMapping("/mine")
    public List<OrderResponse> mine(Authentication authentication) {
        return orders.listFor(accounts.getByEmail(authentication.getName()));
    }
}
