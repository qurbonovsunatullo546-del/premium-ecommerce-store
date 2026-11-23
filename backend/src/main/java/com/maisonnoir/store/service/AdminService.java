package com.maisonnoir.store.service;

import com.maisonnoir.store.api.ApiDtos.InventoryAdjustment;
import com.maisonnoir.store.api.ApiDtos.ProductCreateRequest;
import com.maisonnoir.store.api.ApiDtos.ProductResponse;
import com.maisonnoir.store.model.Product;
import com.maisonnoir.store.model.StoreOrder;
import com.maisonnoir.store.model.Category;
import com.maisonnoir.store.repository.CategoryRepository;
import com.maisonnoir.store.repository.ProductRepository;
import com.maisonnoir.store.repository.StoreOrderRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminService {
    private static final Pattern SLUG_SEPARATOR = Pattern.compile("[^a-z0-9]+");
    private final ProductRepository products;
    private final CategoryRepository categories;
    private final StoreOrderRepository orders;
    private final CatalogService catalog;

    public AdminService(ProductRepository products, CategoryRepository categories,
                        StoreOrderRepository orders, CatalogService catalog) {
        this.products = products;
        this.categories = categories;
        this.orders = orders;
        this.catalog = catalog;
    }

    @Transactional
    public ProductResponse create(ProductCreateRequest request) {
        Category category = categories.findBySlug(request.categorySlug())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category not found"));
        String slug = SLUG_SEPARATOR.matcher(request.name().trim().toLowerCase(Locale.ROOT))
                .replaceAll("-").replaceAll("(^-|-$)", "");
        if (slug.isBlank() || products.findBySlugAndActiveTrue(slug).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A product with this name already exists");
        }
        Product product = new Product(UUID.randomUUID(), slug, request.name().trim(), request.description().trim(),
                request.price().setScale(2, java.math.RoundingMode.HALF_UP), null, request.imageUrl().trim(),
                category, request.inventory(), request.featured(), BigDecimal.ZERO.setScale(1), 0);
        return catalog.toResponse(products.save(product));
    }

    @Transactional
    public ProductResponse adjustInventory(UUID productId, InventoryAdjustment request) {
        Product product = products.findById(productId).filter(Product::isActive)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
        try {
            product.adjustInventory(request.adjustment());
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, exception.getMessage());
        }
        return catalog.toResponse(product);
    }

    @Transactional(readOnly = true)
    public List<OrderSummary> orders() {
        return orders.findAllByOrderByCreatedAtDesc().stream()
                .map(order -> new OrderSummary(order.getOrderNumber(), order.getEmail(), order.getStatus().name(),
                        order.getTotal(), order.getCreatedAt())).toList();
    }

    public record OrderSummary(String orderNumber, String email, String status, BigDecimal total,
                               java.time.Instant createdAt) {}
}
