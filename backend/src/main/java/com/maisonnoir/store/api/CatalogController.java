package com.maisonnoir.store.api;

import com.maisonnoir.store.api.ApiDtos.ProductResponse;
import com.maisonnoir.store.api.ApiDtos.ReviewRequest;
import com.maisonnoir.store.api.ApiDtos.ReviewResponse;
import com.maisonnoir.store.model.StoreUser;
import com.maisonnoir.store.service.AccountService;
import com.maisonnoir.store.service.CatalogService;
import com.maisonnoir.store.service.ReviewService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class CatalogController {
    private final CatalogService catalog;
    private final ReviewService reviews;
    private final AccountService accounts;

    public CatalogController(CatalogService catalog, ReviewService reviews, AccountService accounts) {
        this.catalog = catalog;
        this.reviews = reviews;
        this.accounts = accounts;
    }

    @GetMapping("/products")
    public List<ProductResponse> products(@RequestParam(required = false) String query,
                                          @RequestParam(required = false) String category,
                                          @RequestParam(required = false) String sort) {
        return catalog.list(query, category, sort);
    }

    @GetMapping("/products/{slug}")
    public ProductResponse product(@PathVariable String slug) {
        return catalog.getBySlug(slug);
    }

    @GetMapping("/products/{slug}/reviews")
    public List<ReviewResponse> reviews(@PathVariable String slug) {
        return reviews.list(slug);
    }

    @PostMapping("/products/{slug}/reviews")
    public ReviewResponse addReview(@PathVariable String slug, @Valid @RequestBody ReviewRequest request,
                                    Authentication authentication) {
        StoreUser user = accounts.getByEmail(authentication.getName());
        return reviews.add(slug, request, user);
    }
}
