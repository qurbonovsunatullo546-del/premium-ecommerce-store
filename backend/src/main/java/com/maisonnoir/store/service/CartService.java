package com.maisonnoir.store.service;

import com.maisonnoir.store.api.ApiDtos.CartLineRequest;
import com.maisonnoir.store.api.ApiDtos.CartLineResponse;
import com.maisonnoir.store.api.ApiDtos.CartRequest;
import com.maisonnoir.store.model.Cart;
import com.maisonnoir.store.model.CartItem;
import com.maisonnoir.store.model.StoreUser;
import com.maisonnoir.store.repository.CartItemRepository;
import com.maisonnoir.store.repository.CartRepository;
import com.maisonnoir.store.repository.ProductRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CartService {
    private final CartRepository carts;
    private final CartItemRepository items;
    private final ProductRepository products;

    public CartService(CartRepository carts, CartItemRepository items, ProductRepository products) {
        this.carts = carts;
        this.items = items;
        this.products = products;
    }

    @Transactional(readOnly = true)
    public List<CartLineResponse> get(StoreUser user) {
        return carts.findByUser_Id(user.getId()).map(cart -> items.findByCart_Id(cart.getId()).stream()
                .map(item -> new CartLineResponse(item.getProduct().getId(), item.getQuantity())).toList()).orElse(List.of());
    }

    @Transactional
    public List<CartLineResponse> replace(StoreUser user, CartRequest request) {
        Cart cart = carts.findByUser_Id(user.getId())
                .orElseGet(() -> carts.save(new Cart(UUID.randomUUID(), user, Instant.now())));
        items.deleteAll(items.findByCart_Id(cart.getId()));
        for (CartLineRequest line : request.items()) {
            var product = products.findById(line.productId()).filter(p -> p.isActive() && p.getInventory() >= line.quantity())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Product is unavailable or stock is insufficient"));
            items.save(new CartItem(UUID.randomUUID(), cart, product, line.quantity()));
        }
        return get(user);
    }
}
