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
import java.util.Collections;
import java.util.HashSet;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/assistant")
public class AiAssistantController {

    private static final Set<String> TITLE_TRIMS = Set.of(
            "base", "street", "touring", "sport", "naked", "enduro", "urban", "adventure", "track", "comfort",
            "long ride", "city", "race", "classic", "pro", "rally", "grand tour", "light", "daily", "premium",
            "база", "style", "tour", "tech", "eco", "family", "business", "plus", "max", "elite", "turbo", "smart", "performance"
    );

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
        SearchCriteria criteria = resolveCriteria(request);
        List<Listing> candidates = filterCandidates(request, criteria);
        if (candidates.isEmpty()) {
            return new VehicleAssistantResponse(
                    "За заданими параметрами оголошень не знайдено.",
                    List.of(),
                    geminiModel
            );
        }

        List<ListingPreview> previews = sampleDiverse(candidates, 70).stream()
                .map(this::toPreview)
                .toList();

        GeminiResult geminiResult = getRecommendationsWithFallback(request, previews, criteria);

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
            if (!matchesCriteria(selected, criteria)) {
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
                    .filter(p -> matchesCriteria(p, criteria))
                    .limit(safeLimit(request.limit()))
                    .map(p -> new VehicleSuggestion(p, "Рекомендація на основі заданих фільтрів"))
                    .toList();
        }

        suggestions = diversifySuggestions(suggestions, previews, criteria, safeLimit(request.limit()));

        String summary = geminiResult.summary();
        if (summary == null || summary.isBlank()) {
            summary = "Підібрав найрелевантніші варіанти за вашим запитом і фільтрами.";
        }

        return new VehicleAssistantResponse(summary, suggestions, geminiModel);
    }

    private GeminiResult getRecommendationsWithFallback(VehicleAssistantRequest request, List<ListingPreview> previews, SearchCriteria criteria) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return buildFallbackResult(request, previews,
                    "Підібрав релевантні варіанти за вашими фільтрами. Розширені пояснення від ШІ з’являться після підключення Gemini.");
        }

        try {
            return callGemini(request, previews, criteria);
        } catch (ResponseStatusException ex) {
            return buildFallbackResult(request, previews,
                    "Підібрав релевантні варіанти за вашими фільтрами. Розширене пояснення від Gemini тимчасово недоступне.");
        }
    }

    private GeminiResult buildFallbackResult(VehicleAssistantRequest request, List<ListingPreview> previews, String summary) {
        List<GeminiSuggestion> suggestions = previews.stream()
                .sorted((a, b) -> Integer.compare(
                        scoreFallback(b, request),
                        scoreFallback(a, request)))
                .limit(safeLimit(request.limit()))
                .map(preview -> new GeminiSuggestion(preview.id(), buildFallbackReason(request, preview)))
                .toList();
        return new GeminiResult(summary, suggestions);
    }

    /**
     * Simple relevance score for fallback sorting: more specifics matched = higher score.
     */
    private int scoreFallback(ListingPreview preview, VehicleAssistantRequest request) {
        int score = 0;
        if (request.budgetMax() != null && preview.price() != null && preview.price() <= request.budgetMax()) score += 2;
        if (request.budgetMin() != null && preview.price() != null && preview.price() >= request.budgetMin()) score += 1;
        if (request.city() != null && !request.city().isBlank() && matchesContains(preview.city(), request.city())) score += 3;
        if (request.query() != null && !request.query().isBlank()) {
            String q = request.query().toLowerCase(Locale.ROOT);
            String haystack = List.of(preview.title(), preview.brand(), preview.model(), preview.bodyType(), preview.vehicleType())
                    .stream().filter(v -> v != null && !v.isBlank()).collect(Collectors.joining(" ")).toLowerCase(Locale.ROOT);
            for (String token : q.split("[^a-zA-Zа-яА-ЯіІїЇєЄ0-9]+")) {
                if (token.length() >= 3 && haystack.contains(token)) score += 5;
            }
        }
        return score;
    }

    private String buildFallbackReason(VehicleAssistantRequest request, ListingPreview preview) {
        List<String> reasons = new ArrayList<>();

        if (preview.vehicleType() != null && !preview.vehicleType().isBlank()) {
            String vt = preview.vehicleType().equalsIgnoreCase("car") ? "автомобіль" :
                        preview.vehicleType().equalsIgnoreCase("motorcycle") ? "мотоцикл" : preview.vehicleType();
            reasons.add("тип: " + vt);
        }
        if (preview.bodyType() != null && !preview.bodyType().isBlank()) {
            reasons.add("кузов: " + preview.bodyType());
        }
        if (request.budgetMax() != null && preview.price() != null && preview.price() <= request.budgetMax()) {
            reasons.add("вкладається у ваш бюджет");
        }
        if (request.city() != null && !request.city().isBlank() && matchesContains(preview.city(), request.city())) {
            reasons.add("знаходиться у вказаному місті");
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
            return title + " — " + reason;
        }
        return reason;
    }

    private List<Listing> filterCandidates(VehicleAssistantRequest request, SearchCriteria criteria) {
        return listingRepository.findAll().stream()
                .filter(l -> matchesVehicleType(l, criteria.vehicleType()))
                .filter(l -> matchesBodyType(l.getBodyType(), criteria.bodyType()))
                .filter(l -> matchesEquals(l.getFuelType(), request.fuelType()))
                .filter(l -> matchesEquals(l.getTransmission(), request.transmission()))
                .filter(l -> matchesContains(l.getCity(), criteria.city()))
                .filter(l -> matchesBudget(l.getPrice(), criteria.budgetMin(), criteria.budgetMax()))
                .collect(Collectors.toList());
    }

    private SearchCriteria resolveCriteria(VehicleAssistantRequest request) {
        String query = request.query();
        String vehicleType = firstNonBlank(request.vehicleType(), detectVehicleTypeFromQuery(query));
        String bodyType = detectBodyTypeFromQuery(query);
        Double budgetMin = request.budgetMin() != null ? request.budgetMin() : detectBudgetMinFromQuery(query);
        Double budgetMax = request.budgetMax() != null ? request.budgetMax() : detectBudgetMaxFromQuery(query);
        String city = request.city();
        return new SearchCriteria(vehicleType, bodyType, budgetMin, budgetMax, city);
    }

    /**
     * Attempts to detect the vehicle type from free-text query keywords (Ukrainian and English).
     * Returns "car", "motorcycle", or null if cannot determine.
     */
    private String detectVehicleTypeFromQuery(String query) {
        if (query == null || query.isBlank()) return null;
        String q = query.toLowerCase(Locale.ROOT);

        // Motorcycle keywords
        String[] motoKeywords = {
            "мотоцикл", "скутер", "байк", "мопед", " мото",
            "motorcycle", "scooter", "moped", "naked", "enduro",
            "sportbike", "cruiser", "чоппер", "кафе рейсер"
        };
        for (String kw : motoKeywords) {
            if (q.contains(kw)) return "motorcycle";
        }

        // Car keywords
        String[] carKeywords = {
            "кросовер", "крос", "седан", "хетчбек", "мінівен",
            "позашляховик", "джип", "пікап", "купе", "автомобіль",
            " машин", "авто ", "авто,", "авто.", "кабріолет", "універсал",
            "crossover", "sedan", "hatchback", "minivan", "suv", "pickup",
            "coupe", " car ", "wagon", "electric car", "електрокар",
            "сімейн",   // covers "сімейний", "сімейна"
            "міський автомобіль", "міське авто"
        };
        for (String kw : carKeywords) {
            if (q.contains(kw)) return "car";
        }

        return null;
    }

    private String detectBodyTypeFromQuery(String query) {
        if (query == null || query.isBlank()) return null;
        String q = query.toLowerCase(Locale.ROOT);
        if (q.contains("кросовер") || q.contains("crossover")) return "кросовер";
        if (q.contains("позашляховик") || q.contains("джип") || q.contains("suv")) return "позашляховик";
        if (q.contains("седан") || q.contains("sedan")) return "седан";
        if (q.contains("хетчбек") || q.contains("hatchback")) return "хетчбек";
        if (q.contains("універсал") || q.contains("wagon")) return "універсал";
        if (q.contains("купе") || q.contains("coupe")) return "купе";
        return null;
    }

    private Double detectBudgetMaxFromQuery(String query) {
        if (query == null || query.isBlank()) return null;
        Matcher tillMatcher = Pattern.compile("(?:до|max|up to|under)\\s*([0-9][0-9\\s.,]*)", Pattern.CASE_INSENSITIVE)
                .matcher(query);
        if (tillMatcher.find()) {
            return parseNumber(tillMatcher.group(1));
        }

        Matcher rangeMatcher = Pattern.compile("([0-9][0-9\\s.,]*)\\s*[-–—]\\s*([0-9][0-9\\s.,]*)").matcher(query);
        if (rangeMatcher.find()) {
            return parseNumber(rangeMatcher.group(2));
        }
        return null;
    }

    private Double detectBudgetMinFromQuery(String query) {
        if (query == null || query.isBlank()) return null;
        Matcher fromMatcher = Pattern.compile("(?:від|от|from|min)\\s*([0-9][0-9\\s.,]*)", Pattern.CASE_INSENSITIVE)
                .matcher(query);
        if (fromMatcher.find()) {
            return parseNumber(fromMatcher.group(1));
        }

        Matcher rangeMatcher = Pattern.compile("([0-9][0-9\\s.,]*)\\s*[-–—]\\s*([0-9][0-9\\s.,]*)").matcher(query);
        if (rangeMatcher.find()) {
            return parseNumber(rangeMatcher.group(1));
        }
        return null;
    }

    private Double parseNumber(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String normalized = raw.replaceAll("[^0-9.]", "");
        if (normalized.isBlank()) return null;
        try {
            return Double.parseDouble(normalized);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    /**
     * Returns a diverse sample of up to {@code maxSample} listings.
     * Stratified by vehicleType (car / motorcycle split preserved), then shuffled
     * within each group, so Gemini always sees a representative cross-section of
     * the catalogue regardless of insertion order.
     */
    private List<Listing> sampleDiverse(List<Listing> candidates, int maxSample) {
        if (candidates.size() <= maxSample) {
            return candidates;
        }

        // Group by brand+model to avoid one model dominating the prompt context.
        Map<String, List<Listing>> byType = candidates.stream()
                .collect(Collectors.groupingBy(
                        this::listingGroupKey
                ));

        // Shuffle each group independently
        byType.values().forEach(Collections::shuffle);

        int groupCount = byType.size();
        int perGroup = maxSample / groupCount;
        int remainder = maxSample % groupCount;

        List<Listing> result = new ArrayList<>(maxSample);
        int extra = remainder;
        for (List<Listing> group : byType.values()) {
            int take = perGroup + (extra > 0 ? 1 : 0);
            if (extra > 0) extra--;
            result.addAll(group.subList(0, Math.min(take, group.size())));
        }

        // If we still have capacity (some groups were smaller than perGroup), fill from the full shuffled pool
        if (result.size() < maxSample) {
            List<Listing> pool = new ArrayList<>(candidates);
            Collections.shuffle(pool);
            for (Listing l : pool) {
                if (result.size() >= maxSample) break;
                if (!result.contains(l)) {
                    result.add(l);
                }
            }
        }

        return result;
    }

    private String listingGroupKey(Listing listing) {
        if (listing == null) return "unknown";
        return normalize(listing.getBrand()) + "|" + normalize(listing.getModel());
    }

    private String previewGroupKey(ListingPreview preview) {
        if (preview == null) return "unknown";
        return normalize(preview.brand()) + "|" + normalize(preview.model());
    }

    private List<VehicleSuggestion> diversifySuggestions(
            List<VehicleSuggestion> rawSuggestions,
            List<ListingPreview> pool,
            SearchCriteria criteria,
            int limit
    ) {
        if (limit <= 0) return List.of();

        List<VehicleSuggestion> result = new ArrayList<>();
        Map<String, Integer> groupUsage = new HashMap<>();
        Set<Long> usedIds = new HashSet<>();

        for (VehicleSuggestion suggestion : rawSuggestions) {
            if (result.size() >= limit) break;
            ListingPreview preview = suggestion == null ? null : suggestion.listing();
            if (preview == null || preview.id() == null || !matchesCriteria(preview, criteria)) continue;
            if (usedIds.contains(preview.id())) continue;

            String groupKey = previewGroupKey(preview);
            if (groupUsage.getOrDefault(groupKey, 0) >= 2) continue;

            result.add(suggestion);
            usedIds.add(preview.id());
            groupUsage.put(groupKey, groupUsage.getOrDefault(groupKey, 0) + 1);
        }

        for (ListingPreview preview : pool) {
            if (result.size() >= limit) break;
            if (preview == null || preview.id() == null || !matchesCriteria(preview, criteria)) continue;
            if (usedIds.contains(preview.id())) continue;

            String groupKey = previewGroupKey(preview);
            if (groupUsage.getOrDefault(groupKey, 0) >= 2) continue;

            result.add(new VehicleSuggestion(preview, "Рекомендація на основі заданих фільтрів"));
            usedIds.add(preview.id());
            groupUsage.put(groupKey, groupUsage.getOrDefault(groupKey, 0) + 1);
        }

        // Safety fallback: if strict diversity discarded too much, fill with any remaining matches.
        if (result.size() < limit) {
            for (ListingPreview preview : pool) {
                if (result.size() >= limit) break;
                if (preview == null || preview.id() == null || !matchesCriteria(preview, criteria)) continue;
                if (usedIds.contains(preview.id())) continue;

                result.add(new VehicleSuggestion(preview, "Рекомендація на основі заданих фільтрів"));
                usedIds.add(preview.id());
            }
        }

        return result;
    }

    private boolean matchesVehicleType(Listing listing, String vehicleType) {
        if (vehicleType == null || vehicleType.isBlank()) {
            return true;
        }
        return normalize(vehicleType).equals(normalize(listing.getVehicleType()));
    }

    private boolean matchesBodyType(String actualBodyType, String wantedBodyType) {
        if (wantedBodyType == null || wantedBodyType.isBlank()) {
            return true;
        }
        String actual = normalize(actualBodyType);
        String wanted = normalize(wantedBodyType);
        if (wanted.equals("кросовер") || wanted.equals("позашляховик")) {
            return actual.contains("крос") || actual.contains("позашлях");
        }
        return actual.contains(wanted);
    }

    private boolean matchesCriteria(ListingPreview preview, SearchCriteria criteria) {
        return matchesEquals(preview.vehicleType(), criteria.vehicleType())
                && matchesBodyType(preview.bodyType(), criteria.bodyType())
                && matchesContains(preview.city(), criteria.city())
                && matchesBudget(preview.price(), criteria.budgetMin(), criteria.budgetMax());
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

    private GeminiResult callGemini(VehicleAssistantRequest request, List<ListingPreview> previews, SearchCriteria criteria) {
        String prompt = buildPrompt(request, previews, criteria);
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

    private String buildPrompt(VehicleAssistantRequest request, List<ListingPreview> previews, SearchCriteria criteria) {
        String userQuery = (request.query() == null || request.query().isBlank()) ? "(не вказано)" : request.query().trim();
        String effectiveVehicleType = Objects.toString(criteria.vehicleType(), "");
        String effectiveBodyType = Objects.toString(criteria.bodyType(), "");

        return """
                Ти авто-асистент маркетплейсу транспортних засобів. Обери до %d найкращих варіантів з наданого списку candidates.
                
                ПРАВИЛА:
                1. Використовуй ТІЛЬКИ id з candidates, не вигадуй дані.
                2. Уважно прочитай запит користувача і вибирай ЛИШЕ ті оголошення, які семантично відповідають запиту.
                3. Якщо у запиті вказано тип транспорту (кросовер, седан, мотоцикл тощо) — ВИБИРАЙ ТІЛЬКИ цей тип та відхиляй інші.
                4. Враховуй vehicleType і bodyType кожного кандидата.
                5. Якщо жоден кандидат не відповідає запиту — поверни порожній список suggestions.
                6. У полі reason поясни конкретно, чому оголошення підходить (тип кузова, ціна, пробіг, рік тощо).
                
                Запит користувача: %s
                Очікуваний тип транспорту: %s
                Очікуваний тип кузова: %s
                
                Фільтри:
                - budgetMin: %s
                - budgetMax: %s
                - vehicleType: %s
                - bodyType: %s
                - fuelType: %s
                - transmission: %s
                - city: %s

                Поверни ЛИШЕ JSON (без markdown, без пояснень поза JSON) формату:
                {
                  "summary": "коротке пояснення українською (1-2 речення)",
                  "suggestions": [
                    {"id": 123, "reason": "конкретне пояснення чому підходить"}
                  ]
                }

                candidates:
                %s
                """.formatted(
                safeLimit(request.limit()),
                userQuery,
                effectiveVehicleType.isBlank() ? "(визнач з запиту)" : effectiveVehicleType,
                effectiveBodyType.isBlank() ? "(визнач з запиту)" : effectiveBodyType,
                Objects.toString(criteria.budgetMin(), ""),
                Objects.toString(criteria.budgetMax(), ""),
                Objects.toString(criteria.vehicleType(), ""),
                Objects.toString(criteria.bodyType(), ""),
                Objects.toString(request.fuelType(), ""),
                Objects.toString(request.transmission(), ""),
                Objects.toString(criteria.city(), ""),
                toJson(previews)
        );
    }

    private String firstNonBlank(String first, String fallback) {
        if (first != null && !first.isBlank()) {
            return first;
        }
        return fallback;
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
                sanitizeTitle(listing.getTitle()),
                listing.getBrand(),
                listing.getModel(),
                listing.getPrice(),
                listing.getYear(),
                listing.getMileage(),
                listing.getVehicleType(),
                listing.getBodyType(),
                listing.getCity(),
                cover
        );
    }

    private String sanitizeTitle(String title) {
        if (title == null || title.isBlank()) {
            return title;
        }

        int idx = title.lastIndexOf(" · ");
        if (idx < 0 || idx + 3 >= title.length()) {
            return title;
        }

        String trim = normalize(title.substring(idx + 3));
        if (TITLE_TRIMS.contains(trim)) {
            return title.substring(0, idx).trim();
        }

        return title;
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
            String bodyType,
            String city,
            String coverPhoto
    ) {
    }

    private record GeminiSuggestion(Long id, String reason) {
    }

    private record GeminiResult(String summary, List<GeminiSuggestion> suggestions) {
    }

    private record SearchCriteria(
            String vehicleType,
            String bodyType,
            Double budgetMin,
            Double budgetMax,
            String city
    ) {
    }
}


