package com.marketplace.controller;

import com.marketplace.model.User;
import com.marketplace.repository.UserRepository;
import com.marketplace.security.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.security.Principal;
import java.util.Optional;
import java.util.function.Predicate;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Validated @RequestBody Map<String, String> body) {
        String username = normalizeEmail(body.get("username"));
        String password = body.get("password");
        String email = normalizeEmail(body.get("email"));
        String phone = normalizePhone(body.get("phone"));
        String firstName = trim(body.get("firstName"));
        String lastName = trim(body.get("lastName"));

        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing username or password"));
        }

        if (userRepository.existsByUsername(username)
                || (email != null && userRepository.existsByEmailIgnoreCase(email))
                || (phone != null && userRepository.findAll().stream().anyMatch(u -> samePhone(u.getPhone(), phone)))) {
            return ResponseEntity.badRequest().body(Map.of("error", "User with provided username/email/phone already exists"));
        }

        User u = new User(username, passwordEncoder.encode(password), "ROLE_USER", email, phone, firstName, lastName);
        userRepository.save(u);
        String token = jwtService.generateToken(username);
        return ResponseEntity.ok(Map.of("token", token, "user", userToResponse(u)));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String identifier = trim(body.get("username")); // can be username, email or phone
        String password = body.get("password");
        if (identifier == null || password == null) return ResponseEntity.status(400).body(Map.of("error", "Missing credentials"));

        return findUserByIdentifier(identifier)
                .filter(u -> passwordEncoder.matches(password, u.getPassword()))
                .map(u -> ResponseEntity.ok(Map.of("token", jwtService.generateToken(u.getUsername()), "user", userToResponse(u))))
                .orElseGet(() -> ResponseEntity.status(401).body(Map.of("error", "Invalid credentials")));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        Optional<User> maybeUser = findUserByIdentifier(principal.getName());
        if (maybeUser.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }
        return ResponseEntity.ok(Map.of("user", userToResponse(maybeUser.get())));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> body, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        Optional<User> maybeUser = findUserByIdentifier(principal.getName());
        if (maybeUser.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        User user = maybeUser.get();
        String email = normalizeEmail(body.get("email"));
        String phone = normalizePhone(body.get("phone"));
        String firstName = trim(body.get("firstName"));
        String lastName = trim(body.get("lastName"));

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }
        if (phone == null || phone.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Phone is required"));
        }

        boolean emailTaken = userRepository.findAll().stream()
                .filter(other -> !other.getId().equals(user.getId()))
                .anyMatch(other -> email.equalsIgnoreCase(trim(other.getEmail())));
        if (emailTaken) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already exists"));
        }

        boolean phoneTaken = userRepository.findAll().stream()
                .filter(other -> !other.getId().equals(user.getId()))
                .anyMatch(other -> samePhone(other.getPhone(), phone));
        if (phoneTaken) {
            return ResponseEntity.badRequest().body(Map.of("error", "Phone already exists"));
        }

        user.setEmail(email);
        user.setPhone(phone);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("user", userToResponse(user)));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        String username = principal.getName();
        String oldPassword = body.get("oldPassword");
        String newPassword = body.get("newPassword");
        if (oldPassword == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing parameters"));
        }
        Optional<User> maybeUser = findUserByIdentifier(username);
        if (maybeUser.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        User user = maybeUser.get();
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            return ResponseEntity.status(400).body(Map.of("error", "Invalid current password"));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("success", true));
    }

    private Optional<User> findUserByIdentifier(String identifier) {
        String value = trim(identifier);
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }

        String email = normalizeEmail(value);
        Optional<User> byUsername = userRepository.findByUsername(value);
        if (byUsername.isPresent()) return byUsername;

        Optional<User> byEmail = userRepository.findByEmailIgnoreCase(email);
        if (byEmail.isPresent()) return byEmail;

        String normalizedPhone = normalizePhone(value);
        Optional<User> byPhoneRaw = userRepository.findByPhone(value);
        if (byPhoneRaw.isPresent()) return byPhoneRaw;

        Optional<User> byPhoneNorm = userRepository.findByPhone(normalizedPhone);
        if (byPhoneNorm.isPresent()) return byPhoneNorm;

        return userRepository.findAll().stream()
                .filter(user -> samePhone(user.getPhone(), normalizedPhone))
                .findFirst();
    }

    private Map<String, Object> userToResponse(User user) {
        Map<String, Object> result = new HashMap<>();
        result.put("username", trim(user.getUsername()));
        result.put("email", trim(user.getEmail()));
        result.put("phone", trim(user.getPhone()));
        result.put("firstName", trim(user.getFirstName()));
        result.put("lastName", trim(user.getLastName()));
        return result;
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }

    private String normalizeEmail(String value) {
        String trimmed = trim(value);
        return trimmed == null ? null : trimmed.toLowerCase();
    }

    private String normalizePhone(String value) {
        String trimmed = trim(value);
        if (trimmed == null) return null;
        return trimmed.replaceAll("[^\\d+]", "");
    }

    private boolean samePhone(String left, String right) {
        String a = normalizePhone(left);
        String b = normalizePhone(right);
        return a != null && b != null && a.equals(b);
    }
}

