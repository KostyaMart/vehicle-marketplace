package com.marketplace.bootstrap;

import com.marketplace.model.Listing;
import com.marketplace.model.User;
import com.marketplace.repository.ListingRepository;
import com.marketplace.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    public DataInitializer(UserRepository userRepository,
                           ListingRepository listingRepository,
                           PasswordEncoder passwordEncoder,
                           JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        seedDefaultUser();
        seedDefaultListings();
    }

    private void seedDefaultUser() {
        String rawPassword = "password";
        String encodedPassword = passwordEncoder.encode(rawPassword);

        var existing = userRepository.findByUsername("testuser");
        if (existing.isPresent()) {
            User user = existing.get();
            if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
                user.setPassword(encodedPassword);
                user.setRoles("ROLE_USER");
                userRepository.save(user);
                log.info("Repaired default user password for testuser");
            }
            return;
        }

        userRepository.save(new User(
                "testuser",
                encodedPassword,
                "ROLE_USER"
        ));

        log.info("Seeded default user: testuser");
    }

    private void seedDefaultListings() {
        syncListingsSequence();

        List<Listing> existing = listingRepository.findAll();
        if (existing.isEmpty()) {
            List<Listing> defaults = buildDefaultListings();
            listingRepository.saveAll(defaults);
            log.info("Seeded {} default listings", defaults.size());
            return;
        }

        boolean updated = false;
        for (Listing listing : existing) {
            if (listing.getPhotoUrls() == null || listing.getPhotoUrls().isEmpty()) {
                listing.setPhotoUrls(Collections.singletonList(buildPlaceholderPhotoDataUrl(listing.getBrand(), listing.getModel())));
                updated = true;
            }
        }

        if (updated) {
            listingRepository.saveAll(existing);
            log.info("Backfilled placeholder photos for {} existing listings", existing.size());
        } else {
            log.info("Default listings already exist, skipping seed");
        }
    }

    private void syncListingsSequence() {
        try {
            Long maxId = jdbcTemplate.queryForObject("select coalesce(max(id), 0) from listings", Long.class);
            if (maxId == null || maxId <= 0) {
                return;
            }

            String sequenceName = jdbcTemplate.queryForObject(
                    "select pg_get_serial_sequence('listings', 'id')",
                    String.class
            );

            if (sequenceName == null || sequenceName.isBlank()) {
                return;
            }

            jdbcTemplate.queryForObject("select setval(?, ?, true)", Long.class, sequenceName, maxId);
            log.info("Synchronized listings sequence {} to {}", sequenceName, maxId);
        } catch (Exception ex) {
            log.warn("Could not synchronize listings sequence before seeding", ex);
        }
    }

    private List<Listing> buildDefaultListings() {
        List<VehicleSeed> seeds = List.of(
                new VehicleSeed("Honda", "Civic", 2012, 120000, 7500.0, "Комфортний седан для щоденних поїздок"),
                new VehicleSeed("Toyota", "Corolla", 2016, 98000, 11200.0, "Надійний седан з низькою витратою пального"),
                new VehicleSeed("Mazda", "3", 2017, 87000, 12400.0, "Жвавий хетчбек із приємною керованістю"),
                new VehicleSeed("Hyundai", "Elantra", 2015, 104000, 9300.0, "Практичний автомобіль для міста й траси"),
                new VehicleSeed("Kia", "Sportage", 2018, 79000, 16900.0, "Популярний кросовер для сімейних поїздок"),
                new VehicleSeed("Volkswagen", "Golf", 2019, 66000, 15900.0, "Компактний хетчбек з якісним салоном"),
                new VehicleSeed("Skoda", "Octavia", 2020, 54000, 17900.0, "Просторий ліфтбек для роботи та подорожей"),
                new VehicleSeed("Ford", "Focus", 2014, 118000, 8200.0, "Баланс комфорту, динаміки та економічності"),
                new VehicleSeed("Nissan", "Qashqai", 2017, 92000, 14700.0, "Міський кросовер з високою посадкою"),
                new VehicleSeed("Subaru", "Outback", 2018, 85000, 20300.0, "Універсал для поганих доріг та поїздок за місто"),
                new VehicleSeed("BMW", "3 Series", 2019, 62000, 27900.0, "Преміальний седан із динамічним характером"),
                new VehicleSeed("Mercedes-Benz", "C-Class", 2020, 58000, 31900.0, "Комфортний преміальний седан"),
                new VehicleSeed("Audi", "A4", 2018, 70000, 25500.0, "Стриманий бізнес-седан з хорошою шумоізоляцією"),
                new VehicleSeed("Lexus", "NX", 2021, 43000, 38900.0, "Гібридний кросовер із надійною репутацією"),
                new VehicleSeed("Volvo", "XC60", 2020, 51000, 36500.0, "Безпечний і стильний сімейний кросовер"),
                new VehicleSeed("Renault", "Megane", 2016, 109000, 7600.0, "Економний компактний хетчбек"),
                new VehicleSeed("Peugeot", "3008", 2019, 68000, 19800.0, "Кросовер із яскравим дизайном та зручним салоном"),
                new VehicleSeed("Opel", "Astra", 2015, 113000, 6800.0, "Надійний хетчбек для міських маршрутів"),
                new VehicleSeed("Tesla", "Model 3", 2021, 36000, 35900.0, "Електромобіль із великим запасом ходу"),
                new VehicleSeed("Suzuki", "Swift", 2018, 74000, 9900.0, "Компактний автомобіль для міста"),
                new VehicleSeed("Yamaha", "MT-07", 2018, 8000, 6500.0, "Легкий і жвавий міський мотоцикл"),
                new VehicleSeed("Honda", "CB500F", 2019, 12000, 5900.0, "Універсальний мотоцикл для новачків і щоденної їзди"),
                new VehicleSeed("Kawasaki", "Ninja 400", 2020, 9000, 7100.0, "Спортивний байк із гострою реакцією на газ"),
                new VehicleSeed("BMW", "R 1250 GS", 2021, 15000, 18900.0, "Мотоцикл для далеких подорожей та пригод"),
                new VehicleSeed("Harley-Davidson", "Street 750", 2017, 14000, 8800.0, "Круїзер із характерним стилем")
        );

        List<Listing> defaults = new ArrayList<>();
        for (VehicleSeed seed : seeds) {
            for (int variant = 0; variant < 4; variant++) {
                int year = seed.baseYear + variant;
                int mileage = Math.max(1000, seed.baseMileage - (variant * 9000));
                double price = seed.basePrice + (variant * 850.0);
                String title = seed.brand + " " + seed.model + " " + year;
                String description = seed.description + " — варіант " + (variant + 1);
                Listing listing = new Listing(title, description, price, year, mileage, seed.brand, seed.model);
                listing.getPhotoUrls().add(buildPlaceholderPhotoDataUrl(seed.brand, seed.model));
                defaults.add(listing);
            }
        }

        return defaults;
    }

    private String buildPlaceholderPhotoDataUrl(String brand, String model) {
        String label = (brand + " " + model).replace("&", "and");
        String svg = """
                <svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800'>
                  <defs>
                    <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
                      <stop offset='0%' stop-color='#0f172a'/>
                      <stop offset='100%' stop-color='#0284c7'/>
                    </linearGradient>
                  </defs>
                  <rect width='1200' height='800' rx='48' fill='url(#g)'/>
                  <circle cx='980' cy='160' r='140' fill='rgba(255,255,255,0.10)'/>
                  <circle cx='220' cy='610' r='170' fill='rgba(255,255,255,0.08)'/>
                  <text x='80' y='190' fill='white' font-size='72' font-family='Arial, Helvetica, sans-serif' font-weight='700'>__LABEL__</text>
                  <text x='80' y='290' fill='rgba(255,255,255,0.85)' font-size='40' font-family='Arial, Helvetica, sans-serif'>Маркетплейс транспорту</text>
                  <path d='M210 540h690l90-120H360c-28 0-54 14-70 37l-80 117z' fill='rgba(255,255,255,0.18)'/>
                  <circle cx='340' cy='610' r='74' fill='white'/>
                  <circle cx='340' cy='610' r='36' fill='#0f172a'/>
                  <circle cx='840' cy='610' r='74' fill='white'/>
                  <circle cx='840' cy='610' r='36' fill='#0f172a'/>
                </svg>
                """.replace("__LABEL__", label);
        return "data:image/svg+xml;base64," + java.util.Base64.getEncoder().encodeToString(svg.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    private record VehicleSeed(String brand, String model, int baseYear, int baseMileage, double basePrice, String description) {}
}



