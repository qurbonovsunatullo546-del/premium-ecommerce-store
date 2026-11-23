package com.maisonnoir.store;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

import com.maisonnoir.store.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class OrderApiTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProductRepository products;

    @Test
    void duplicateOrderLinesCannotOversellInventory() throws Exception {
        var product = products.findBySlugAndActiveTrue("the-atelier-coat").orElseThrow();
        int initialInventory = product.getInventory();
        String requestBody = """
                {
                  "email": "customer@example.com",
                  "shippingAddress": "1 Atelier Street",
                  "items": [
                    {"productId": "%s", "quantity": 7},
                    {"productId": "%s", "quantity": 7}
                  ]
                }
                """.formatted(product.getId(), product.getId());

        mockMvc.perform(post("/api/orders")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isConflict());

        assertThat(products.findById(product.getId()).orElseThrow().getInventory()).isEqualTo(initialInventory);
    }

    @Test
    void ordersBelowShippingThresholdIncludeStandardShipping() throws Exception {
        var product = products.findBySlugAndActiveTrue("evening-study-candle").orElseThrow();
        String requestBody = """
                {
                  "email": "customer@example.com",
                  "shippingAddress": "1 Atelier Street",
                  "items": [{"productId": "%s", "quantity": 1}]
                }
                """.formatted(product.getId());

        mockMvc.perform(post("/api/orders")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(80.0));
    }

    @Test
    void ordersAtOrAboveShippingThresholdReceiveFreeShipping() throws Exception {
        var product = products.findBySlugAndActiveTrue("the-atelier-coat").orElseThrow();
        String requestBody = """
                {
                  "email": "customer@example.com",
                  "shippingAddress": "1 Atelier Street",
                  "items": [{"productId": "%s", "quantity": 1}]
                }
                """.formatted(product.getId());

        mockMvc.perform(post("/api/orders")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(890.0));
    }
}
