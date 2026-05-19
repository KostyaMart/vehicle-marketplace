package com.marketplace.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "listings")
public class Listing {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String description;
    private Double price;
    private Integer year;
    private Integer mileage;
    private String brand;
    private String model;
    private LocalDateTime createdAt = LocalDateTime.now();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "listing_photos", joinColumns = @JoinColumn(name = "listing_id"))
    @OrderColumn(name = "photo_order")
    @Column(name = "photo_url", columnDefinition = "text")
    private List<String> photoUrls = new ArrayList<>();

    // Additional optional attributes for richer filtering
    private String fuelType;
    private String transmission;
    private String bodyType;
    private String color;
    private String driveType;
    private String condition; // e.g., NEW / USED
    private Double engineVolume;
    private Integer ownersCount;
    private String city;
    private Boolean customsCleared;
    // persisted property to indicate vehicle type for frontend (car / motorcycle)
    private String vehicleType;

    public Listing() {}

    public Listing(String title, String description, Double price, Integer year, Integer mileage, String brand, String model) {
        this.title = title;
        this.description = description;
        this.price = price;
        this.year = year;
        this.mileage = mileage;
        this.brand = brand;
        this.model = model;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public Integer getMileage() { return mileage; }
    public void setMileage(Integer mileage) { this.mileage = mileage; }
    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public List<String> getPhotoUrls() { return photoUrls; }
    public void setPhotoUrls(List<String> photoUrls) { this.photoUrls = photoUrls; }
    public String getFuelType() { return fuelType; }
    public void setFuelType(String fuelType) { this.fuelType = fuelType; }
    public String getTransmission() { return transmission; }
    public void setTransmission(String transmission) { this.transmission = transmission; }
    public String getBodyType() { return bodyType; }
    public void setBodyType(String bodyType) { this.bodyType = bodyType; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public String getDriveType() { return driveType; }
    public void setDriveType(String driveType) { this.driveType = driveType; }
    public String getCondition() { return condition; }
    public void setCondition(String condition) { this.condition = condition; }
    public Double getEngineVolume() { return engineVolume; }
    public void setEngineVolume(Double engineVolume) { this.engineVolume = engineVolume; }
    public Integer getOwnersCount() { return ownersCount; }
    public void setOwnersCount(Integer ownersCount) { this.ownersCount = ownersCount; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public Boolean getCustomsCleared() { return customsCleared; }
    public void setCustomsCleared(Boolean customsCleared) { this.customsCleared = customsCleared; }

    public String getVehicleType() {
        if (vehicleType != null && !vehicleType.isBlank()) return vehicleType;
        // fallback heuristic if DB value missing
        String m = (model == null) ? "" : model.toLowerCase();
        String b = (brand == null) ? "" : brand.toLowerCase();

        String[] strongBikeBrands = new String[]{"yamaha","kawasaki","harley","ducati","ktm","triumph","aprilia","indian","mv agusta"};
        for (String kb : strongBikeBrands) if (b.contains(kb)) return "motorcycle";

        String[] bikeModelMarkers = new String[]{"mt-","ninja","yzf","zx-","cbr","cb ","r 1250 gs","street 750","crf"};
        for (String k : bikeModelMarkers) if (m.contains(k)) return "motorcycle";

        return "car";
    }

    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }
}

