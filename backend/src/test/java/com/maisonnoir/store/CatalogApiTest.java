package com.maisonnoir.store;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class CatalogApiTest {
    @Autowired
    private MockMvc mockMvc;

    @Test
    void catalogIsSeededAndFilterable() throws Exception {
        mockMvc.perform(get("/api/products").param("category", "objects"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].categorySlug").value("objects"));
    }

    @Test
    void productDetailIsAddressableBySlug() throws Exception {
        mockMvc.perform(get("/api/products/the-atelier-coat"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("The Atelier Coat"))
                .andExpect(jsonPath("$.price").value(890));
    }
}
