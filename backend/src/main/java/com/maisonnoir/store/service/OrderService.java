package com.maisonnoir.store.service;

import com.maisonnoir.store.api.ApiDtos.OrderLineRequest;
import com.maisonnoir.store.api.ApiDtos.OrderRequest;
import com.maisonnoir.store.api.ApiDtos.OrderResponse;
import com.maisonnoir.store.model.OrderItem;
import com.maisonnoir.store.model.OrderStatus;
import com.maisonnoir.store.model.Payment;
import com.maisonnoir.store.model.Product;
import com.maisonnoir.store.model.StoreOrder;
import com.maisonnoir.store.model.StoreUser;
import com.maisonnoir.store.repository.OrderItemRepository;
import com.maisonnoir.store.repository.PaymentRepository;
import com.maisonnoir.store.repository.ProductRepository;
import com.maisonnoir.store.repository.StoreOrderRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OrderService {
    private static final BigDecimal FREE_SHIPPING_THRESHOLD = BigDecimal.valueOf(250);
    private static final BigDecimal STANDARD_SHIPPING = BigDecimal.valueOf(12);

    private final StoreOrderRepository orders;
    private final OrderItemRepository orderItems;
    private final ProductRepository products;
    private final PaymentRepository payments;
    private final PaymentGateway paymentGateway;

    public OrderService(StoreOrderRepository orders, OrderItemRepository orderItems, ProductRepository products,
                       PaymentRepository payments, PaymentGateway paymentGateway) {
        this.orders = orders;
        this.orderItems = orderItems;
        this.products = products;
        this.payments = payments;
        this.paymentGateway = paymentGateway;
    }

    @Transactional
    public OrderResponse place(OrderRequest request, StoreUser user) {
        if (request.items().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "An order must contain at least one item");
        }
        Map<UUID, Integer> quantitiesByProduct = new LinkedHashMap<>();
        for (OrderLineRequest line : request.items()) {
            int currentQuantity = quantitiesByProduct.getOrDefault(line.productId(), 0);
            try {
                quantitiesByProduct.put(line.productId(), Math.addExact(currentQuantity, line.quantity()));
            } catch (ArithmeticException exception) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Combined product quantity exceeds the supported limit");
            }
        }
        List<Map.Entry<UUID, Integer>> orderLines = new ArrayList<>(quantitiesByProduct.entrySet());
        Instant now = Instant.now();
        String number = "MN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        List<Product> selected = orderLines.stream().map(line -> products.findById(line.getKey())
                .filter(Product::isActive)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"))).toList();
        BigDecimal total = BigDecimal.ZERO;
        for (int i = 0; i < selected.size(); i++) {
            Product product = selected.get(i);
            int quantity = orderLines.get(i).getValue();
            if (product.getInventory() < quantity) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Insufficient inventory for " + product.getName());
            }
            total = total.add(product.getPrice().multiply(BigDecimal.valueOf(quantity)));
        }
        BigDecimal shipping = total.compareTo(FREE_SHIPPING_THRESHOLD) >= 0 ? BigDecimal.ZERO : STANDARD_SHIPPING;
        total = total.add(shipping);
        StoreOrder order = orders.save(new StoreOrder(UUID.randomUUID(), number, user, request.email(),
                request.shippingAddress(), OrderStatus.PAYMENT_PENDING, total, now));
        for (int i = 0; i < selected.size(); i++) {
            Product product = selected.get(i);
            int quantity = orderLines.get(i).getValue();
            product.adjustInventory(-quantity);
            orderItems.save(new OrderItem(UUID.randomUUID(), order, product, quantity, product.getPrice()));
        }
        PaymentGateway.PaymentIntent intent = paymentGateway.createIntent(number, total);
        payments.save(new Payment(UUID.randomUUID(), order, intent.provider(), intent.reference(), intent.status(), total, now));
        return new OrderResponse(order.getOrderNumber(), order.getTotal(), order.getStatus(), order.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> listFor(StoreUser user) {
        return orders.findAllByUser_IdOrderByCreatedAtDesc(user.getId()).stream()
                .map(order -> new OrderResponse(order.getOrderNumber(), order.getTotal(), order.getStatus(), order.getCreatedAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> listAll() {
        return orders.findAllByOrderByCreatedAtDesc().stream()
                .map(order -> new OrderResponse(order.getOrderNumber(), order.getTotal(), order.getStatus(), order.getCreatedAt()))
                .toList();
    }
}
