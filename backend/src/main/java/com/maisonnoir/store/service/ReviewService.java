package com.maisonnoir.store.service;

import com.maisonnoir.store.api.ApiDtos.ReviewRequest;
import com.maisonnoir.store.api.ApiDtos.ReviewResponse;
import com.maisonnoir.store.model.Review;
import com.maisonnoir.store.model.StoreUser;
import com.maisonnoir.store.repository.ProductRepository;
import com.maisonnoir.store.repository.ReviewRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ReviewService {
    private final ProductRepository products;
    private final ReviewRepository reviews;

    public ReviewService(ProductRepository products, ReviewRepository reviews) {
        this.products = products;
        this.reviews = reviews;
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> list(String slug) {
        var product = products.findBySlugAndActiveTrue(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        return reviews.findByProduct_IdOrderByCreatedAtDesc(product.getId()).stream()
                .map(review -> new ReviewResponse(review.getId(), review.getUser().getName(),
                        review.getRating(), review.getBody(), review.getCreatedAt())).toList();
    }

    @Transactional
    public ReviewResponse add(String slug, ReviewRequest request, StoreUser user) {
        var product = products.findBySlugAndActiveTrue(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        product.addReview(request.rating());
        var review = reviews.save(new Review(UUID.randomUUID(), product, user,
                request.rating(), request.body().trim(), Instant.now()));
        return new ReviewResponse(review.getId(), user.getName(), review.getRating(), review.getBody(), review.getCreatedAt());
    }
}
