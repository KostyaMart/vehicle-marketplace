package com.marketplace.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketplace.model.Listing;
import com.marketplace.repository.ListingRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/assistant")
public class AiAssistantController {

    private final ListingRepository listingRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String geminiApiKey;
    private final String geminiModel;

    public AiAssistantController(
            ListingRepository listingRepository,
            ObjectMapper objectMapper,
            @Value("${app.gemini.apiKey:}") String geminiApiKey,
            @Value("${app.gemini.model:gemini-1.5-flash}") String geminiModel
    ) {
        this.listingRepository = listingRepository;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
        this.geminiApiKey = geminiApiKey;
        this.geminiModel = geminiModel;
    }

    @PostMapping("/vehicle-recommendations")
    public VehicleAssistantResponse vehicleRecommendations(@RequestBody VehicleAssistantRequest request) {
        List<Listing> candidates = filterCandidates(request);
        if (candidates.isEmpty()) {
            return new VehicleAssistantResponse(
                    "За заданими параметрами оголошень не знайдено.",
                    List.of(),
                    geminiModel
            );
        }

        List<ListingPreview> previews = candidates.stream()
                .limit(70)
                .map(this::toPreview)
                .toList();

        GeminiResult geminiResult = getRecommendationsWithFallback(request, previews);

        Map<Long, ListingPreview> byId = previews.stream()
                .collect(Collectors.toMap(ListingPreview::id, p -> p, (a, b) -> a, HashMap::new));

        List<VehicleSuggestion> suggestions = new ArrayList<>();
        for (GeminiSuggestion suggestion : geminiResult.suggestions()) {
            if (suggestion == null || suggestion.id() == null) {
                continue;
            }
            ListingPreview selected = byId.get(suggestion.id());
            if (selected == null) {
                continue;
            }
            suggestions.add(new VehicleSuggestion(selected, normalizeReason(suggestion.reason())));
            if (suggestions.size() >= safeLimit(request.limit())) {
                break;
            }
        }

        // If the model did not return valid IDs, return a deterministic fallback list.
        if (suggestions.isEmpty()) {
            suggestions = previews.stream()
                    .limit(safeLimit(request.limit()))
                    .map(p -> new VehicleSuggestion(p, "Рекомендація на основі заданих фільтрів"))
                    .toList();
        }

        String summary = geminiResult.summary();
        if (summary == null || summary.isBlank()) {
            summary = "Підібрав найрелевантніші варіанти за вашим запитом і фільтрами.";
        }

        return new VehicleAssistantResponse(summary, suggestions, geminiModel);
    }

    private GeminiResult getRecommendationsWithFallback(VehicleAssistantRequest request, List<ListingPreview> previews) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return buildFallbackResult(request, previews,
                    "Підібрав релевантні варіанти за вашими фільтрами. Розширені пояснення від ШІ з’являться після підключення Gemini.");
        }

        try {
            return callGemini(request, previews);
        } catch (ResponseStatusException ex) {
            return buildFallbackResult(request, previews,
                    "Підібрав релевантні варіанти за вашими фільтрами. Розширене пояснення від Gemini тимчасово недоступне.");
        }
    }

    private GeminiResult buildFallbackResult(VehicleAssistantRequest request, List<ListingPreview> previews, String summary) {
        List<GeminiSuggestion> suggestions = previews.stream()
                .limit(safeLimit(request.limit()))
                .map(preview -> new GeminiSuggestion(preview.id(), buildFallbackReason(request, preview)))
                .toList();
        return new GeminiResult(summary, suggestions);
    }

    private String buildFallbackReason(VehicleAssistantRequest request, ListingPreview preview) {
        List<String> reasons = new ArrayList<>();

        if (request.budgetMax() != null && preview.price() != null && preview.price() <= request.budgetMax()) {
            reasons.add("вкладається у ваш бюджет");
        }
        if (request.city() != null && !request.city().isBlank() && matchesContains(preview.city(), request.city())) {
            reasons.add("знаходиться у вказаному місті");
        }
        if (request.vehicleType() != null && !request.vehicleType().isBlank() && matchesEquals(preview.vehicleType(), request.vehicleType())) {
            reasons.add("відповідає типу транспорту");
        }

        String title = List.of(preview.brand(), preview.model())
                .stream()
                .filter(value -> value != null && !value.isBlank())
                .collect(Collectors.joining(" "));

        if (reasons.isEmpty()) {
            if (!title.isBlank()) {
                return "Підібрано за вашими критеріями: " + title;
            }
            return "Підібрано за вашими критеріями";
        }

        String reason = String.join(", ", reasons);
        if (!title.isBlank()) {
            return title + ": " + reason;
        }
        return reason;
    }

    private List<Listing> filterCandidates(VehicleAssistantRequest request) {
        return listingRepository.findAll().stream()
                .filter(l -> matchesVehicleType(l, request.vehicleType()))
                .filter(l -> matchesEquals(l.getFuelType(), request.fuelType()))
                .filter(l -> matchesEquals(l.getTransmission(), request.transmission()))
                .filter(l -> matchesContains(l.getCity(), request.city()))
                .filter(l -> matchesBudget(l.getPrice(), request.budgetMin(), request.budgetMax()))
                .sorted(Comparator.comparing(Listing::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    private boolean matchesVehicleType(Listing listing, String vehicleType) {
        if (vehicleType == null || vehicleType.isBlank()) {
            return true;
        }
        return normalize(vehicleType).equals(normalize(listing.getVehicleType()));
    }

    private boolean matchesEquals(String actual, String wanted) {
        if (wanted == null || wanted.isBlank()) {
            return true;
        }
        return normalize(actual).equals(normalize(wanted));
    }

    private boolean matchesContains(String actual, String wanted) {
        if (wanted == null || wanted.isBlank()) {
            return true;
        }
        return normalize(actual).contains(normalize(wanted));
    }

    private boolean matchesBudget(Double price, Double min, Double max) {
        if (min == null && max == null) {
            return true;
        }
        if (price == null) {
            return false;
        }
        if (min != null && price < min) {
            return false;
        }
        return max == null || price <= max;
    }

    private GeminiResult callGemini(VehicleAssistantRequest request, List<ListingPreview> previews) {
        String prompt = buildPrompt(request, previews);
        String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/"
                + encode(geminiModel)
                + ":generateContent?key="
                + encode(geminiApiKey);

        Map<String, Object> payload = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of(
                        "temperature", 0.2,
                        "responseMimeType", "application/json"
                )
        );

        final String body;
        try {
            body = objectMapper.writeValueAsString(payload);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to prepare Gemini request", e);
        }

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .timeout(Duration.ofSeconds(30))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        HttpResponse<String> response;
        try {
            response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Gemini call interrupted", e);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to call Gemini API", e);
        }

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Gemini API error: HTTP " + response.statusCode());
        }

        String modelText = extractModelText(response.body());
        return parseGeminiResult(modelText);
    }

    private String extractModelText(String jsonBody) {
        try {
            JsonNode root = objectMapper.readTree(jsonBody);
            JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
            String text = textNode.asText("");
            if (text.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Gemini response is empty");
            }
            return unwrapJsonBlock(text);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Invalid Gemini response format", e);
        }
    }

    private GeminiResult parseGeminiResult(String jsonText) {
        try {
            JsonNode root = objectMapper.readTree(jsonText);
            String summary = root.path("summary").asText("");
            List<GeminiSuggestion> suggestions = objectMapper.convertValue(
                    root.path("suggestions"),
                    new TypeReference<List<GeminiSuggestion>>() {
                    }
            );
            return new GeminiResult(summary, suggestions == null ? List.of() : suggestions);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not parse Gemini recommendations", e);
        }
    }

    private String unwrapJsonBlock(String text) {
        String trimmed = text == null ? "" : text.trim();
        if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
            int firstNewLine = trimmed.indexOf('\n');
            if (firstNewLine > 0) {
                trimmed = trimmed.substring(firstNewLine + 1, trimmed.length() - 3).trim();
            }
        }
        return trimmed;
    }

    private String buildPrompt(VehicleAssistantRequest request, List<ListingPreview> previews) {
        String userQuery = (request.query() == null || request.query().isBlank()) ? "(не вказано)" : request.query().trim();

        return """
                Ти авто-асистент маркетплейсу. Обери до %d найкращих варіантів з наданого списку.
                Важливо: використовуй ТІЛЬКИ id з candidates, не вигадуй дані.
                Запит користувача: %s
                Фільтри:
                - budgetMin: %s
                - budgetMax: %s
                - vehicleType: %s
                - fuelType: %s
                - transmission: %s
                - city: %s

                Поверни лише JSON формату:
                {
                  "summary": "коротке пояснення українською",
                  "suggestions": [
                    {"id": 123, "reason": "чому цей варіант підходить"}
                  ]
                }

                candidates:
                %s
                """.formatted(
                safeLimit(request.limit()),
                userQuery,
                Objects.toString(request.budgetMin(), ""),
                Objects.toString(request.budgetMax(), ""),
                Objects.toString(request.vehicleType(), ""),
                Objects.toString(request.fuelType(), ""),
                Objects.toString(request.transmission(), ""),
                Objects.toString(request.city(), ""),
                toJson(previews)
        );
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (IOException e) {
            return "[]";
        }
    }

    private ListingPreview toPreview(Listing listing) {
        String cover = null;
        if (listing.getPhotoUrls() != null && !listing.getPhotoUrls().isEmpty()) {
            cover = listing.getPhotoUrls().get(0);
        }
        return new ListingPreview(
                listing.getId(),
                listing.getTitle(),
                listing.getBrand(),
                listing.getModel(),
                listing.getPrice(),
                listing.getYear(),
                listing.getMileage(),
                listing.getVehicleType(),
                listing.getCity(),
                cover
        );
    }

    private int safeLimit(Integer requestedLimit) {
        int value = requestedLimit == null ? 5 : requestedLimit;
        if (value < 1) {
            return 1;
        }
        return Math.min(value, 8);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeReason(String reason) {
        if (reason == null || reason.isBlank()) {
            return "Підходить за вашими критеріями";
        }
        return reason.trim();
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    public record VehicleAssistantRequest(
            String query,
            Double budgetMin,
            Double budgetMax,
            String vehicleType,
            String fuelType,
            String transmission,
            String city,
            Integer limit
    ) {
    }

    public record VehicleAssistantResponse(
            String summary,
            List<VehicleSuggestion> suggestions,
            String model
    ) {
    }

    public record VehicleSuggestion(
            ListingPreview listing,
            String reason
    ) {
    }

    public record ListingPreview(
            Long id,
            String title,
            String brand,
            String model,
            Double price,
            Integer year,
            Integer mileage,
            String vehicleType,
            String city,
            String coverPhoto
    ) {
    }

    private record GeminiSuggestion(Long id, String reason) {
    }

    private record GeminiResult(String summary, List<GeminiSuggestion> suggestions) {
    }
}


