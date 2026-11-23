package com.maisonnoir.store.api;

import com.maisonnoir.store.api.ApiDtos.InventoryAdjustment;
import com.maisonnoir.store.api.ApiDtos.ProductCreateRequest;
import com.maisonnoir.store.api.ApiDtos.ProductResponse;
import com.maisonnoir.store.service.AdminService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminService admin;

    public AdminController(AdminService admin) {
        this.admin = admin;
    }

    @PostMapping("/products")
    public ProductResponse createProduct(@Valid @RequestBody ProductCreateRequest request) {
        return admin.create(request);
    }

    @PatchMapping("/products/{productId}/inventory")
    public ProductResponse adjustInventory(@PathVariable UUID productId,
                                           @Valid @RequestBody InventoryAdjustment adjustment) {
        return admin.adjustInventory(productId, adjustment);
    }

    @GetMapping("/orders")
    public List<AdminService.OrderSummary> orders() {
        return admin.orders();
    }
}
