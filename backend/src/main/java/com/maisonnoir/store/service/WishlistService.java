package com.maisonnoir.store.service;

import com.maisonnoir.store.api.ApiDtos.ProductResponse;
import com.maisonnoir.store.model.Wishlist;
import com.maisonnoir.store.model.WishlistItem;
import com.maisonnoir.store.model.StoreUser;
import com.maisonnoir.store.repository.ProductRepository;
import com.maisonnoir.store.repository.WishlistItemRepository;
import com.maisonnoir.store.repository.WishlistRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class WishlistService {
    private final WishlistRepository wishlists;
    private final WishlistItemRepository items;
    private final ProductRepository products;
    private final CatalogService catalog;

    public WishlistService(WishlistRepository wishlists, WishlistItemRepository items,
                           ProductRepository products, CatalogService catalog) {
        this.wishlists = wishlists;
        this.items = items;
        this.products = products;
        this.catalog = catalog;
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> get(StoreUser user) {
        return wishlists.findByUser_Id(user.getId()).map(wishlist -> items.findByWishlist_Id(wishlist.getId()).stream()
                .map(item -> catalog.toResponse(item.getProduct())).toList()).orElse(List.of());
    }

    @Transactional
    public void add(StoreUser user, UUID productId) {
        Wishlist wishlist = wishlists.findByUser_Id(user.getId())
                .orElseGet(() -> wishlists.save(new Wishlist(UUID.randomUUID(), user)));
        if (items.findByWishlist_IdAndProduct_Id(wishlist.getId(), productId).isPresent()) return;
        var product = products.findById(productId).filter(p -> p.isActive())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        items.save(new WishlistItem(UUID.randomUUID(), wishlist, product, Instant.now()));
    }

    @Transactional
    public void remove(StoreUser user, UUID productId) {
        wishlists.findByUser_Id(user.getId()).ifPresent(wishlist ->
                items.deleteByWishlist_IdAndProduct_Id(wishlist.getId(), productId));
    }
}
