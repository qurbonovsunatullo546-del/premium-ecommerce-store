package com.maisonnoir.store.api;

import com.maisonnoir.store.model.OrderStatus;
import com.maisonnoir.store.model.UserRole;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class ApiDtos {
    private ApiDtos() {}

    public record ProductResponse(
            UUID id, String slug, String name, String description, BigDecimal price,
            BigDecimal compareAtPrice, String imageUrl, String categoryName, String categorySlug,
            int inventory, boolean featured, BigDecimal rating, int reviewCount) {}

    public record UserResponse(UUID id, String email, String name, UserRole role) {}

    public record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {}

    public record RegisterRequest(
            @NotBlank @Size(max = 120) String name,
            @Email @NotBlank @Size(max = 254) String email,
            @NotBlank @Size(min = 8, max = 72) String password) {}

    public record OrderLineRequest(@NotNull UUID productId, @Min(1) int quantity) {}

    public record OrderRequest(
            @Email @NotBlank String email,
            @NotBlank @Size(max = 500) String shippingAddress,
            @NotEmpty List<@Valid OrderLineRequest> items) {}

    public record OrderResponse(String orderNumber, BigDecimal total, OrderStatus status, Instant createdAt) {}

    public record ReviewRequest(@Min(1) @jakarta.validation.constraints.Max(5) int rating,
                                @NotBlank @Size(min = 8, max = 1200) String body) {}

    public record ReviewResponse(UUID id, String customerName, int rating, String body, Instant createdAt) {}

    public record ProductCreateRequest(
            @NotBlank @Size(max = 160) String name,
            @NotBlank @Size(max = 2000) String description,
            @NotNull @jakarta.validation.constraints.DecimalMin("0.01") BigDecimal price,
            @NotBlank @Size(max = 500) String imageUrl,
            @NotBlank String categorySlug,
            @Min(0) int inventory,
            boolean featured) {}

    public record InventoryAdjustment(@jakarta.validation.constraints.NotNull Integer adjustment) {}

    public record CartLineRequest(@NotNull UUID productId, @Min(1) int quantity) {}
    public record CartRequest(@NotNull List<@Valid CartLineRequest> items) {}
    public record CartLineResponse(UUID productId, int quantity) {}
}
