package com.marketplace.controller;

import com.marketplace.model.Listing;
import com.marketplace.repository.ListingRepository;
import com.marketplace.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
@CrossOrigin(origins = "*")
public class PublicController {

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;

    public PublicController(UserRepository userRepository, ListingRepository listingRepository) {
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        List<Listing> listings = listingRepository.findAll();
        long totalUsers = userRepository.count();
        long totalListings = listings.size();
        long totalCars = listings.stream().filter(l -> "car".equalsIgnoreCase(l.getVehicleType())).count();
        long totalMotorcycles = listings.stream().filter(l -> "motorcycle".equalsIgnoreCase(l.getVehicleType())).count();

        double averagePrice = listings.stream()
                .map(Listing::getPrice)
                .filter(price -> price != null && price > 0)
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);

        LocalDateTime from = LocalDateTime.now().minusDays(7);
        long newestListingsCount = listings.stream()
                .filter(l -> l.getCreatedAt() != null && l.getCreatedAt().isAfter(from))
                .count();

        Map<String, Object> result = new HashMap<>();
        result.put("totalUsers", totalUsers);
        result.put("totalListings", totalListings);
        result.put("totalCars", totalCars);
        result.put("totalMotorcycles", totalMotorcycles);
        result.put("averagePrice", averagePrice);
        result.put("newestListingsCount", newestListingsCount);

        return result;
    }
}


