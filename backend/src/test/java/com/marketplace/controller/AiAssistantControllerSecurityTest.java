package com.marketplace.controller;

import com.marketplace.model.Listing;
import com.marketplace.repository.ListingRepository;
import com.marketplace.security.JwtAuthenticationFilter;
import com.marketplace.security.JwtService;
import com.marketplace.security.SecurityConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AiAssistantController.class, properties = {
        "app.gemini.apiKey=",
        "app.gemini.model=gemini-2.5-flash",
        "app.frontend.origin=http://localhost:5173"
})
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, AiAssistantControllerSecurityTest.TestSecurityBeans.class})
class AiAssistantControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ListingRepository listingRepository;

    @MockBean
    private UserDetailsService userDetailsService;

    @BeforeEach
    void setUp() {
        when(listingRepository.findAll()).thenReturn(List.of(sampleListing()));
    }

    @Test
    void vehicleRecommendationsShouldBePublicWithoutAuthentication() throws Exception {
        mockMvc.perform(post("/api/assistant/vehicle-recommendations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "query": "міський автомобіль",
                                  "budgetMax": 20000,
                                  "vehicleType": "car",
                                  "city": "Kyiv",
                                  "limit": 3
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.suggestions[0].listing.id").value(1))
                .andExpect(jsonPath("$.summary").isNotEmpty());
    }

    @Test
    void assistantPreflightShouldBeAllowed() throws Exception {
        mockMvc.perform(options("/api/assistant/vehicle-recommendations")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }

    private Listing sampleListing() {
        Listing listing = new Listing();
        listing.setId(1L);
        listing.setTitle("Toyota Corolla");
        listing.setBrand("Toyota");
        listing.setModel("Corolla");
        listing.setPrice(18000.0);
        listing.setYear(2020);
        listing.setMileage(45000);
        listing.setCity("Kyiv");
        listing.setFuelType("Petrol");
        listing.setTransmission("Automatic");
        listing.setVehicleType("car");
        listing.setCreatedAt(LocalDateTime.now());
        return listing;
    }

    @TestConfiguration
    static class TestSecurityBeans {

        @Bean
        JwtService jwtService() {
            return new JwtService("test-secret-for-security-config", 86_400_000L);
        }
    }
}



