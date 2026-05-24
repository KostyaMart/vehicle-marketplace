package com.marketplace.controller;

import com.marketplace.model.Feedback;
import com.marketplace.repository.FeedbackRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackRepository feedbackRepository;

    public FeedbackController(FeedbackRepository feedbackRepository) {
        this.feedbackRepository = feedbackRepository;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> submitFeedback(@RequestBody Map<String, String> payload) {
        try {
            String name = payload.getOrDefault("name", "").trim();
            String email = payload.getOrDefault("email", "").trim();
            String message = payload.getOrDefault("message", "").trim();

            if (name.isEmpty() || email.isEmpty() || message.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Усі поля обов'язкові"));
            }

            Feedback feedback = new Feedback(name, email, message);
            feedbackRepository.save(feedback);

            return ResponseEntity.ok(Map.of("success", "Спасибо! Ваше повідомлення успішно надіслано."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Помилка при відправленні повідомлення"));
        }
    }

    @GetMapping
    public ResponseEntity<?> getFeedbacks(Principal principal) {
        // Тільки адміністратори мають доступ
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Доступ заборонено"));
        }

        try {
            List<Feedback> feedbacks = feedbackRepository.findAllByOrderByCreatedAtDesc();
            return ResponseEntity.ok(feedbacks);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Помилка при отриманні повідомлень"));
        }
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, String>> markAsRead(@PathVariable Long id, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Доступ заборонено"));
        }

        try {
            Feedback feedback = feedbackRepository.findById(id)
                    .orElseThrow(() -> new Exception("Фідбек не знайден"));
            feedback.setIsRead(true);
            feedbackRepository.save(feedback);
            return ResponseEntity.ok(Map.of("success", "Позначено як прочитано"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Фідбек не знайден"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteFeedback(@PathVariable Long id, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Доступ заборонено"));
        }

        try {
            feedbackRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("success", "Фідбек видален"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Помилка при видаленні"));
        }
    }
}

