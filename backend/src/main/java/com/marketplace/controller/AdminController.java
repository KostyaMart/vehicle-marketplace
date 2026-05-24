package com.marketplace.controller;

import com.marketplace.model.Listing;
import com.marketplace.model.User;
import com.marketplace.repository.ListingRepository;
import com.marketplace.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;

    public AdminController(UserRepository userRepository, ListingRepository listingRepository) {
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

    @GetMapping("/users")
    public List<Map<String, Object>> users() {
        List<User> users = userRepository.findAll();
        List<Listing> listings = listingRepository.findAll();
        Map<String, Long> listingsCountByOwner = listings.stream()
                .filter(l -> l.getOwnerUsername() != null && !l.getOwnerUsername().isBlank())
                .collect(Collectors.groupingBy(Listing::getOwnerUsername, Collectors.counting()));

        return users.stream()
                .sorted(Comparator.comparing(User::getId))
                .map(user -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", user.getId());
                    item.put("username", user.getUsername());
                    item.put("email", user.getEmail());
                    item.put("role", user.getRole());
                    item.put("createdAt", user.getCreatedAt());
                    item.put("listingsCount", listingsCountByOwner.getOrDefault(user.getUsername(), 0L));
                    return item;
                })
                .toList();
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String role = body.get("role");
        if (role == null || role.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Role is required"));
        }

        String normalized = role.trim().toUpperCase();
        if (!"USER".equals(normalized) && !"ADMIN".equals(normalized)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Role must be USER or ADMIN"));
        }

        Optional<User> maybeUser = userRepository.findById(id);
        if (maybeUser.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        User user = maybeUser.get();
        user.setRole(normalized);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "role", user.getRole()
        ));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, Principal principal) {
        Optional<User> maybeUser = userRepository.findById(id);
        if (maybeUser.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        User user = maybeUser.get();
        String currentUsername = principal == null ? null : principal.getName();
        if (currentUsername != null && currentUsername.equalsIgnoreCase(user.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("error", "You cannot delete yourself"));
        }

        userRepository.delete(user);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/listings")
    public List<Listing> listings() {
        return listingRepository.findAll().stream()
                .sorted(Comparator.comparing(Listing::getId))
                .toList();
    }

    @DeleteMapping("/listings/{id}")
    public ResponseEntity<?> deleteListing(@PathVariable Long id) {
        Optional<Listing> maybeListing = listingRepository.findById(id);
        if (maybeListing.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Listing not found"));
        }

        listingRepository.delete(maybeListing.get());
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PutMapping("/listings/{id}")
    public ResponseEntity<?> updateListing(@PathVariable Long id, @RequestBody Listing payload) {
        Optional<Listing> maybeListing = listingRepository.findById(id);
        if (maybeListing.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Listing not found"));
        }

        Listing existing = maybeListing.get();
        existing.setTitle(payload.getTitle());
        existing.setDescription(payload.getDescription());
        existing.setPrice(payload.getPrice());
        existing.setYear(payload.getYear());
        existing.setMileage(payload.getMileage());
        existing.setBrand(payload.getBrand());
        existing.setModel(payload.getModel());
        existing.setFuelType(payload.getFuelType());
        existing.setTransmission(payload.getTransmission());
        existing.setBodyType(payload.getBodyType());
        existing.setColor(payload.getColor());
        existing.setDriveType(payload.getDriveType());
        existing.setCondition(payload.getCondition());
        existing.setEngineVolume(payload.getEngineVolume());
        existing.setOwnersCount(payload.getOwnersCount());
        existing.setCity(payload.getCity());
        existing.setCustomsCleared(payload.getCustomsCleared());
        existing.setVehicleType(payload.getVehicleType());
        existing.setOwnerUsername(payload.getOwnerUsername());

        if (payload.getPhotoUrls() != null && !payload.getPhotoUrls().isEmpty()) {
            existing.setPhotoUrls(payload.getPhotoUrls());
        }

        Listing saved = listingRepository.save(existing);
        return ResponseEntity.ok(saved);
    }
}

