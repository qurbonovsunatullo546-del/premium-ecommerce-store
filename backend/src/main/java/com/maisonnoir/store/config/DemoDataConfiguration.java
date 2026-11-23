package com.maisonnoir.store.config;

import com.maisonnoir.store.model.Category;
import com.maisonnoir.store.model.Product;
import com.maisonnoir.store.model.StoreUser;
import com.maisonnoir.store.model.UserRole;
import com.maisonnoir.store.repository.CategoryRepository;
import com.maisonnoir.store.repository.ProductRepository;
import com.maisonnoir.store.repository.StoreUserRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

@Configuration
public class DemoDataConfiguration {
    @Bean
    ApplicationRunner demoData(CategoryRepository categories, ProductRepository products,
                               StoreUserRepository users, PasswordEncoder passwordEncoder,
                               @Value("${STORE_ADMIN_EMAIL:}") String adminEmail,
                               @Value("${STORE_ADMIN_PASSWORD:}") String adminPassword) {
        return args -> seed(categories, products, users, passwordEncoder, adminEmail, adminPassword);
    }

    @Transactional
    void seed(CategoryRepository categories, ProductRepository products, StoreUserRepository users,
              PasswordEncoder passwordEncoder, String adminEmail, String adminPassword) {
        Category apparel = category(categories, "ready-to-wear", "Ready to wear", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
        Category accessories = category(categories, "accessories", "Accessories", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
        Category objects = category(categories, "objects", "Objects", "cccccccc-cccc-4ccc-8ccc-cccccccccccc");
        if (products.count() == 0) {
            products.saveAll(List.of(
                    product("11111111-1111-4111-8111-111111111111", "the-atelier-coat", "The Atelier Coat", "A quietly assured silhouette in double-faced Italian wool. Cut for a generous drape and finished with considered details.", 890, "photo-1539109136881-3be0616acf4b", apparel, 12, true),
                    product("22222222-2222-4222-8222-222222222222", "forma-shoulder-bag", "Forma Shoulder Bag", "Sculptural lines meet supple Italian leather. Made in a small family-run atelier with a softly structured interior.", 560, "photo-1584917865442-de89df76afd3", accessories, 8, true),
                    product("33333333-3333-4333-8333-333333333333", "object-no-04-chair", "Object No. 04 Chair", "An honest study in proportion, crafted from solid ash and hand-finished in a warm, natural oil.", 1240, "photo-1598300056393-4aac492f4344", objects, 4, true),
                    product("44444444-4444-4444-8444-444444444444", "cashmere-crew", "Cashmere Crew", "A light, beautifully soft layer in traceable cashmere, knitted in Scotland for years of everyday wear.", 420, "photo-1576566588028-4147f3842f27", apparel, 16, false),
                    product("55555555-5555-4555-8555-555555555555", "evening-study-candle", "Evening Study Candle", "Black tea, cedar, and a hint of bergamot. Hand-poured in small batches with a clean-burning wax blend.", 68, "photo-1602874801007-bd458bb1b8b6", objects, 32, false),
                    product("66666666-6666-4666-8666-666666666666", "the-sculpted-flat", "The Sculpted Flat", "A softly squared toe and a beautifully balanced heel, cut from buttery nappa leather in Portugal.", 380, "photo-1543163521-1bf539c55dd2", accessories, 10, false),
                    product("77777777-7777-4777-8777-777777777777", "travertine-side-table", "Travertine Side Table", "A monolithic form carved from honed travertine, each piece bearing its own natural variation.", 980, "photo-1499933374294-4584851497cc", objects, 3, true),
                    product("88888888-8888-4888-8888-888888888888", "silk-column-dress", "Silk Column Dress", "Fluid silk falls into a clean, elongating line. A forever piece that moves effortlessly from day to evening.", 720, "photo-1534528741775-53994a69daeb", apparel, 6, false)));
        }
        if (adminEmail != null && !adminEmail.isBlank() && adminPassword != null && !adminPassword.isBlank()
                && !users.existsByEmailIgnoreCase(adminEmail)) {
            users.save(new StoreUser(UUID.randomUUID(), adminEmail.trim().toLowerCase(Locale.ROOT), "Studio Administrator",
                    passwordEncoder.encode(adminPassword), UserRole.ADMIN));
        }
    }

    private Category category(CategoryRepository repository, String slug, String name, String id) {
        return repository.findBySlug(slug).orElseGet(() -> repository.save(new Category(UUID.fromString(id), slug, name)));
    }

    private Product product(String id, String slug, String name, String description, int price, String photo,
                            Category category, int stock, boolean featured) {
        return new Product(UUID.fromString(id), slug, name, description, BigDecimal.valueOf(price), null,
                "https://images.unsplash.com/" + photo + "?auto=format&fit=crop&w=900&q=85",
                category, stock, featured, BigDecimal.ZERO.setScale(1), 0);
    }
}
