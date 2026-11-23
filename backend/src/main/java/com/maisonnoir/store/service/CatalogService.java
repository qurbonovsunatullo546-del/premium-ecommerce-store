package com.maisonnoir.store.service;

import com.maisonnoir.store.api.ApiDtos.ProductResponse;
import com.maisonnoir.store.model.Product;
import com.maisonnoir.store.repository.ProductRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
@Transactional(readOnly = true)
public class CatalogService {
    private final ProductRepository products;

    public CatalogService(ProductRepository products) {
        this.products = products;
    }

    public List<ProductResponse> list(String query, String category, String sort) {
        var result = category == null || category.isBlank()
                ? products.findAllByActiveTrue()
                : products.findByCategory_SlugAndActiveTrue(category);
        if (query != null && !query.isBlank()) {
            String normalized = query.toLowerCase(Locale.ROOT);
            result = result.stream().filter(product ->
                    (product.getName() + " " + product.getDescription() + " " + product.getCategory().getName())
                            .toLowerCase(Locale.ROOT).contains(normalized)).toList();
        }
        Comparator<Product> comparator = switch (sort == null ? "featured" : sort) {
            case "price-low" -> Comparator.comparing(Product::getPrice);
            case "price-high" -> Comparator.comparing(Product::getPrice).reversed();
            default -> Comparator.comparing(Product::isFeatured).reversed().thenComparing(Product::getName);
        };
        return result.stream().sorted(comparator).map(this::toResponse).toList();
    }

    public ProductResponse getBySlug(String slug) {
        return products.findBySlugAndActiveTrue(slug).map(this::toResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    public Product getEntity(java.util.UUID id) {
        return products.findById(id).filter(Product::isActive)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    public ProductResponse toResponse(Product product) {
        return new ProductResponse(product.getId(), product.getSlug(), product.getName(), product.getDescription(),
                product.getPrice(), product.getCompareAtPrice(), product.getImageUrl(), product.getCategory().getName(),
                product.getCategory().getSlug(), product.getInventory(), product.isFeatured(),
                product.getRating(), product.getReviewCount());
    }
}
