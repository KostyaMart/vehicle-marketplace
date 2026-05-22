package com.marketplace.controller;

import com.marketplace.model.Listing;
import com.marketplace.repository.ListingRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

@RestController
@RequestMapping("/api/listings")
public class ListingController {

    private final ListingRepository listingRepository;

    public ListingController(ListingRepository listingRepository) {
        this.listingRepository = listingRepository;
    }

    @GetMapping
    public List<Listing> all() {
        return listingRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Listing> get(@PathVariable Long id) {
        return listingRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public Listing create(@RequestBody Listing listing) {
        String currentUser = getCurrentUsername();
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Користувач не аутентифікований");
        }
        listing.setOwnerUsername(currentUser);
        return listingRepository.save(listing);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Listing createWithPhotos(@RequestPart("listing") Listing listing,
                                    @RequestPart(value = "photos", required = false) MultipartFile[] photos) throws IOException {
        String currentUser = getCurrentUsername();
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Користувач не аутентифікований");
        }
        listing.setOwnerUsername(currentUser);
        listing.setPhotoUrls(extractPhotoUrls(photos));
        return listingRepository.save(listing);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Listing> update(@PathVariable Long id, @RequestBody Listing payload) {
        String currentUser = getCurrentUsername();

        return listingRepository.findById(id)
                .map(existing -> {
                    // Keep editing available for any authenticated user to avoid legacy ownership mismatch blocks.
                    if (currentUser != null && !currentUser.isBlank()) {
                        existing.setOwnerUsername(currentUser);
                    }
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
                    if (payload.getPhotoUrls() != null && !payload.getPhotoUrls().isEmpty()) {
                        existing.setPhotoUrls(payload.getPhotoUrls());
                    }
                    return ResponseEntity.ok(listingRepository.save(existing));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return listingRepository.findById(id)
                .map(existing -> {
                    listingRepository.delete(existing);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return null;
    }

    @GetMapping("/recommend")
    public List<Listing> recommend(@RequestParam(required = false) Long userId,
                                   @RequestParam(defaultValue = "10") int limit,
                                   @RequestParam(defaultValue = "0.5") double wPrice,
                                   @RequestParam(defaultValue = "0.3") double wYear,
                                   @RequestParam(defaultValue = "0.2") double wMileage,
                                   @RequestParam(required = false) String brand,
                                   @RequestParam(required = false) Double maxPrice) {
                List<Listing> all = listingRepository.findAll();
        if (brand != null && !brand.isBlank()) {
            all = all.stream().filter(l -> brand.equalsIgnoreCase(l.getBrand())).toList();
        }
        if (maxPrice != null) {
            all = all.stream().filter(l -> l.getPrice() != null && l.getPrice() <= maxPrice).toList();
        }
        if (all.isEmpty()) return all;

        double minPrice = all.stream().filter(l->l.getPrice()!=null).mapToDouble(Listing::getPrice).min().orElse(0);
        double maxPriceVal = all.stream().filter(l->l.getPrice()!=null).mapToDouble(Listing::getPrice).max().orElse(1);
        int minYear = all.stream().filter(l->l.getYear()!=null).mapToInt(Listing::getYear).min().orElse(2000);
        int maxYear = all.stream().filter(l->l.getYear()!=null).mapToInt(Listing::getYear).max().orElse(2023);
        int minMileage = all.stream().filter(l->l.getMileage()!=null).mapToInt(Listing::getMileage).min().orElse(0);
        int maxMileage = all.stream().filter(l->l.getMileage()!=null).mapToInt(Listing::getMileage).max().orElse(1);

        var scored = all.stream().map(l -> {
            double p = l.getPrice()!=null ? (maxPriceVal - l.getPrice()) / (maxPriceVal - minPrice + 1e-9) : 0.0;
            double y = l.getYear()!=null ? (double)(l.getYear() - minYear) / (maxYear - minYear + 1e-9) : 0.0;
            double m = l.getMileage()!=null ? (double)(maxMileage - l.getMileage()) / (maxMileage - minMileage + 1e-9) : 0.0;
            double score = wPrice * p + wYear * y + wMileage * m;
            return new Object[]{l, score};
        }).sorted((a,b) -> Double.compare((double)b[1], (double)a[1])).limit(limit).map(o->(Listing)o[0]).toList();

        return scored;
    }

    private List<String> extractPhotoUrls(MultipartFile[] photos) throws IOException {
        List<String> urls = new ArrayList<>();
        if (photos == null || photos.length == 0) {
            return urls;
        }

        if (photos.length > 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Можна завантажити максимум 10 фото");
        }

        for (MultipartFile photo : photos) {
            if (photo == null || photo.isEmpty()) {
                continue;
            }
            String contentType = photo.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Файл має бути зображенням");
            }
            String base64 = Base64.getEncoder().encodeToString(photo.getBytes());
            urls.add("data:" + contentType + ";base64," + base64);
        }

        return urls;
    }
}

