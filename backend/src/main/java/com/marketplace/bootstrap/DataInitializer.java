package com.marketplace.bootstrap;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final List<String> CAR_PHOTOS = List.of(
            "https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=1200",
            "https://images.pexels.com/photos/358070/pexels-photo-358070.jpeg?auto=compress&cs=tinysrgb&w=1200",
            "https://images.pexels.com/photos/120049/pexels-photo-120049.jpeg?auto=compress&cs=tinysrgb&w=1200",
            "https://images.pexels.com/photos/1149831/pexels-photo-1149831.jpeg?auto=compress&cs=tinysrgb&w=1200",
            "https://images.pexels.com/photos/244206/pexels-photo-244206.jpeg?auto=compress&cs=tinysrgb&w=1200",
            "https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg?auto=compress&cs=tinysrgb&w=1200",
            "https://images.pexels.com/photos/3156482/pexels-photo-3156482.jpeg?auto=compress&cs=tinysrgb&w=1200",
            "https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=1200"
    );

    private static final List<String> MOTO_PHOTOS = List.of(
            "https://images.pexels.com/photos/2393821/pexels-photo-2393821.jpeg?auto=compress&cs=tinysrgb&w=1200",
            "https://images.pexels.com/photos/1119796/pexels-photo-1119796.jpeg?auto=compress&cs=tinysrgb&w=1200",
            "https://images.pexels.com/photos/2519374/pexels-photo-2519374.jpeg?auto=compress&cs=tinysrgb&w=1200",
            "https://images.pexels.com/photos/2611680/pexels-photo-2611680.jpeg?auto=compress&cs=tinysrgb&w=1200",
            "https://images.pexels.com/photos/163210/motorcycles-race-helmets-pilots-163210.jpeg?auto=compress&cs=tinysrgb&w=1200",
            "https://images.pexels.com/photos/5807579/pexels-photo-5807579.jpeg?auto=compress&cs=tinysrgb&w=1200",
            "https://images.pexels.com/photos/163407/biker-motorbike-motorcycle-motorcyclist-163407.jpeg?auto=compress&cs=tinysrgb&w=1200",
            "https://images.pexels.com/photos/1715193/pexels-photo-1715193.jpeg?auto=compress&cs=tinysrgb&w=1200"
    );

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);
    private static final String[] CAR_VARIANTS = {
            "База", "City", "Comfort", "Style", "Tour", "Sport", "Tech", "Eco", "Family", "Business",
            "Premium", "Active", "Plus", "Max", "Pro", "Elite", "Turbo", "Smart", "Urban", "Performance"
    };
    private static final String[] MOTO_VARIANTS = {
            "Base", "Street", "Touring", "Sport", "Naked", "Enduro", "Urban", "Adventure", "Track", "Comfort",
            "Long Ride", "City", "Race", "Classic", "Pro", "Rally", "Grand Tour", "Light", "Daily", "Premium"
    };
    private static final String[] CAR_NOTES = {
            "мінімалістична комплектація", "зручний міський пакет", "комфортний варіант для щодня", "стильний салон і хороша шумка",
            "для дальніх поїздок і траси", "підкреслений динамічний характер", "сучасні опції та мультимедіа", "економна версія з невеликою витратою",
            "універсальний сімейний формат", "представницький вигляд і м'який хід", "розширений пакет комфорту", "акцент на практичність і надійність",
            "плюс до оснащення та безпеки", "максимум зручності в повсякденні", "покращена динаміка і відгук", "преміальний акцент у салоні",
            "турбована емоція та жвавий розгін", "інтелектуальні помічники водія", "міський ритм без зайвого шуму", "максимально драйверський характер"
    };
    private static final String[] MOTO_NOTES = {
            "базова версія без зайвого пафосу", "міський стиль і легке кермування", "зручний для дальніх маршрутів", "спортивний характер і гострий відгук",
            "класика з мінімумом компромісів", "для бездоріжжя та складних ділянок", "щоденна міська мобільність", "пригодницький набір для подорожей",
            "трековий настрій і точна керованість", "комфортна посадка для щоденного використання", "для довгих переїздів без втоми", "міський байк для вузьких вулиць",
            "максимум емоцій на асфальті", "ретро-стиль і класичний силует", "розширений пакет обладнання", "для міксу міста і ґрунту",
            "grand touring для великої дороги", "легкий і маневрений формат", "щоденний транспорт з характером", "преміальний байк для досвідчених"
    };

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final Map<String, String> resolvedPhotoCache = new HashMap<>();
    private long lastWikipediaRequestAt = 0L;

    public DataInitializer(UserRepository userRepository,
                           ListingRepository listingRepository,
                           PasswordEncoder passwordEncoder,
                           JdbcTemplate jdbcTemplate,
                           ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    }

    @Override
    public void run(String... args) {
        loadPrecomputedPhotoMap();
        syncSequence("users", "id");
        seedDefaultUser();
        seedDefaultAdmin();
        // Normalize current dataset first.
        normalizeExistingListings();
        seedDefaultListings();
        // Run again so newly seeded or legacy records are guaranteed to have normalized photos.
        normalizeExistingListings();
    }

    // ──────────────────────────────────────────────
    //  User seeding
    // ──────────────────────────────────────────────

    private void seedDefaultUser() {
        String raw = "password";
        var existing = userRepository.findByUsername("testuser");
        if (existing.isPresent()) {
            User u = existing.get();
            if (!passwordEncoder.matches(raw, u.getPassword())) {
                u.setPassword(passwordEncoder.encode(raw));
                u.setRoles("ROLE_USER");
                userRepository.save(u);
                log.info("Repaired default user password for testuser");
            }
            return;
        }
        userRepository.save(new User("testuser", passwordEncoder.encode(raw), "ROLE_USER"));
        log.info("Seeded default user: testuser");
    }

    private void seedDefaultAdmin() {
        String raw = "admin123";
        var existing = userRepository.findByUsername("admin");
        if (existing.isPresent()) {
            User u = existing.get();
            boolean changed = false;
            if (!passwordEncoder.matches(raw, u.getPassword())) { u.setPassword(passwordEncoder.encode(raw)); changed = true; }
            if (!"ROLE_ADMIN".equalsIgnoreCase(u.getRoles())) { u.setRoles("ROLE_ADMIN"); changed = true; }
            if (changed) { userRepository.save(u); log.info("Repaired default admin credentials"); }
            return;
        }
        userRepository.save(new User("admin", passwordEncoder.encode(raw), "ROLE_ADMIN"));
        log.info("Seeded default admin: admin");
    }

    // ──────────────────────────────────────────────
    //  Listings seeding
    // ──────────────────────────────────────────────

    private void seedDefaultListings() {
        List<Listing> existing = listingRepository.findAll();
        long total = existing.size();
        long carCount = existing.stream().filter(l -> "car".equals(l.getVehicleType())).count();
        long motoCount = existing.stream().filter(l -> "motorcycle".equals(l.getVehicleType())).count();

        if (total >= 1000 && carCount >= 500 && motoCount >= 500) {
            log.info("Listings already seeded ({} total, {} car, {} moto) — skipping", total, carCount, motoCount);
            return;
        }

        syncSequence("listings", "id");

        Set<String> existingKeys = existing.stream()
                .map(this::listingKey)
                .collect(Collectors.toSet());

        List<Listing> cars = takeMissing(buildCarListings(), existingKeys, Math.max(0, 500 - carCount));
        List<Listing> motos = takeMissing(buildMotoListings(), existingKeys, Math.max(0, 500 - motoCount));

        if (cars.isEmpty() && motos.isEmpty()) {
            log.info("Listing data already adequate ({} total, {} car, {} moto) — skipping", total, carCount, motoCount);
            return;
        }

        List<Listing> all = new ArrayList<>(cars);
        all.addAll(motos);
        listingRepository.saveAll(all);
        log.info("Top-up seeded {} cars + {} motos = {} new listings (existing now: {} total, {} car, {} moto)",
                cars.size(), motos.size(), all.size(), total + all.size(), carCount + cars.size(), motoCount + motos.size());
    }

    private void normalizeExistingListings() {
        List<Listing> existing = listingRepository.findAll();
        boolean changed = false;

        for (Listing listing : existing) {
            Integer year = listing.getYear();
            if (year != null && year > 2026) {
                listing.setYear(2026);
                changed = true;
            }

            String uniqueSeed = String.valueOf(listing.getId() != null ? listing.getId() : listingKey(listing));
            String expectedPhoto = buildRealPhotoUrl(
                    listing.getVehicleType(),
                    String.valueOf(listing.getBrand()),
                    String.valueOf(listing.getModel()),
                    String.valueOf(listing.getBodyType()),
                    String.valueOf(listing.getColor()),
                    listing.getYear(),
                    uniqueSeed);

            List<String> photos = listing.getPhotoUrls();
            String first = (photos == null || photos.isEmpty()) ? null : photos.get(0);
            boolean isLegacyRandom = first != null && (
                    first.contains("loremflickr.com")
                            || first.contains("source.unsplash.com")
                            || first.contains("dummyimage.com")
                            || first.contains("images.pexels.com")
                            || first.startsWith("data:image/svg+xml")
                            || first.startsWith("data:image/svg+xml;base64,")
            );
            if (photos == null || photos.isEmpty() || isLegacyRandom || !expectedPhoto.equals(first)) {
                listing.setPhotoUrls(new ArrayList<>(List.of(expectedPhoto)));
                changed = true;
            }
        }

        if (changed) {
            listingRepository.saveAll(existing);
            log.info("Normalized existing listings: capped years to 2026 and ensured at least one photo per listing");
        }
    }

    // ──────────────────────────────────────────────
    //  Car listings: 25 seeds × 20 variants = 500
    // ──────────────────────────────────────────────

    private List<Listing> buildCarListings() {
        record CarSeed(String brand, String model, int yr, int mi, double pr,
                       String body, String fuel, String trans, String drive,
                       double eng, String city, String desc) {}

        String[] conditions = {"Задовільний", "Хороший", "Хороший", "Відмінний"};
        String[] colors = {"Чорний","Білий","Сірий","Сріблистий","Червоний","Синій",
                           "Зелений","Коричневий","Жовтий","Помаранчевий","Бежевий","Бордовий"};

        var seeds = List.of(
            new CarSeed("Honda","Civic",        2013,115000, 8500,"Седан",        "Бензин","Механіка","Передній",1.8,"Київ",            "Комфортний міський седан після одного власника"),
            new CarSeed("Toyota","Corolla",     2015, 98000,11200,"Седан",        "Бензин","Автомат", "Передній",1.8,"Львів",           "Надійний японський седан, низька витрата пального"),
            new CarSeed("Mazda","3",             2016, 87000,12400,"Хетчбек",      "Бензин","Механіка","Передній",2.0,"Одеса",           "Жвавий хетчбек із спортивним характером"),
            new CarSeed("Hyundai","Elantra",    2014,104000, 9300,"Седан",        "Бензин","Автомат", "Передній",1.6,"Дніпро",          "Практичний седан для міста і траси"),
            new CarSeed("Kia","Sportage",       2017, 79000,16900,"Кросовер",     "Дизель","Автомат", "Повний",  2.0,"Харків",          "Популярний сімейний кросовер із повним приводом"),
            new CarSeed("Volkswagen","Golf",    2018, 66000,15900,"Хетчбек",      "Бензин","Робот",   "Передній",1.4,"Київ",            "Компактний хетчбек із якісним салоном"),
            new CarSeed("Skoda","Octavia",      2019, 54000,17900,"Хетчбек",      "Дизель","Робот",   "Передній",2.0,"Львів",           "Просторий ліфтбек для щоденних поїздок"),
            new CarSeed("Ford","Focus",         2013,118000, 8200,"Хетчбек",      "Бензин","Механіка","Передній",1.6,"Запоріжжя",       "Збалансований хетчбек — комфорт і економність"),
            new CarSeed("Nissan","Qashqai",     2016, 92000,14700,"Кросовер",     "Бензин","Варіатор","Передній",2.0,"Харків",          "Міський кросовер із динамічною ходовою"),
            new CarSeed("Subaru","Outback",     2017, 85000,20300,"Універсал",    "Бензин","Варіатор","Повний",  2.5,"Одеса",           "Надійний повнопривідний універсал"),
            new CarSeed("BMW","3 Series",       2018, 62000,27900,"Седан",        "Бензин","Автомат", "Задній",  2.0,"Київ",            "Преміальний задньопривідний седан із характером"),
            new CarSeed("Mercedes-Benz","C-Class",2019,58000,31900,"Седан",       "Дизель","Автомат", "Задній",  2.2,"Київ",            "Розкішний преміальний седан Mercedes-Benz"),
            new CarSeed("Audi","A4",            2018, 70000,25500,"Седан",        "Дизель","Робот",   "Повний",  2.0,"Дніпро",          "Бізнес-седан із чудовою шумоізоляцією"),
            new CarSeed("Lexus","NX",           2020, 43000,38900,"Кросовер",     "Гібрид","Варіатор","Повний",  2.5,"Київ",            "Гібридний кросовер із японською надійністю"),
            new CarSeed("Volvo","XC60",         2019, 51000,36500,"Кросовер",     "Дизель","Автомат", "Повний",  2.0,"Львів",           "Безпечний і стильний кросовер для родини"),
            new CarSeed("Renault","Megane",     2015,109000, 7600,"Хетчбек",      "Бензин","Механіка","Передній",1.6,"Вінниця",         "Економний і практичний французький хетчбек"),
            new CarSeed("Peugeot","3008",       2018, 68000,19800,"Кросовер",     "Дизель","Автомат", "Передній",1.5,"Полтава",          "Кросовер із яскравим дизайном та зручним салоном"),
            new CarSeed("Opel","Astra",         2014,113000, 6800,"Хетчбек",      "Бензин","Механіка","Передній",1.4,"Черкаси",          "Надійний хетчбек для міських маршрутів"),
            new CarSeed("Tesla","Model 3",      2020, 36000,35900,"Седан",        "Електро","Автомат","Повний",  0.0,"Київ",            "Електромобіль із запасом ходу понад 500 км"),
            new CarSeed("Suzuki","Swift",       2017, 74000, 9900,"Хетчбек",      "Бензин","Механіка","Передній",1.2,"Тернопіль",        "Компактний і юркий автомобіль для міста"),
            new CarSeed("Mitsubishi","Outlander",2018,71000,22500,"Позашляховик", "Бензин","Автомат", "Повний",  2.4,"Запоріжжя",       "Надійний позашляховик із системою повного приводу"),
            new CarSeed("Chevrolet","Cruze",    2013,122000, 7100,"Седан",        "Бензин","Механіка","Передній",1.4,"Івано-Франківськ", "Доступний та надійний американський седан"),
            new CarSeed("Seat","Leon",          2016, 88000,13200,"Хетчбек",      "Бензин","Робот",   "Передній",1.4,"Рівне",            "Спортивний хетчбек із відмінною керованістю"),
            new CarSeed("Porsche","Cayenne",    2019, 47000,72000,"Позашляховик", "Бензин","Автомат", "Повний",  3.0,"Київ",            "Преміальний спортивний позашляховик у відмінному стані"),
            new CarSeed("Land Rover","Discovery",2018,61000,55000,"Позашляховик", "Дизель","Автомат", "Повний",  3.0,"Київ",            "Легендарний офроуд із реальним позашляховим потенціалом")
        );

        List<Listing> result = new ArrayList<>();
        int colorIdx = 0;
        for (var s : seeds) {
            for (int v = 0; v < 20; v++) {
                int year     = Math.min(2026, s.yr + v);
                int mileage  = Math.max(1000, s.mi - v * 2500);
                double price = Math.round((s.pr + v * 650.0) * 10) / 10.0;
                int owners   = Math.max(1, 4 - (v / 6));
                String cond  = conditions[Math.min(v, conditions.length - 1)];
                String color = colors[colorIdx++ % colors.length];

                String variant = CAR_VARIANTS[v];
                String engVol = s.eng > 0 ? String.format("%.1f л", s.eng) : "—";
                String desc = s.desc + ". Комплектація: " + variant + " — " + CAR_NOTES[v] + ". Паливо: " + s.fuel +
                        " | КПП: " + s.trans + " | Кузов: " + s.body +
                        " | Привід: " + s.drive + " | Об'єм: " + engVol +
                        " | Стан: " + cond + " | Власників: " + owners;

                Listing l = new Listing(s.brand + " " + s.model + " " + year + " · " + variant,
                        desc, price, year, mileage, s.brand, s.model);
                l.setVehicleType("car");
                l.setBodyType(s.body);       l.setFuelType(s.fuel);
                l.setTransmission(s.trans);  l.setDriveType(s.drive);
                l.setEngineVolume(s.eng > 0 ? s.eng : null);
                l.setColor(color);           l.setCondition(cond);
                l.setOwnersCount(owners);    l.setCity(s.city);
                l.setCustomsCleared(v >= 2);
                l.getPhotoUrls().add(buildRealPhotoUrl("car", s.brand, s.model, s.body, color, year, s.brand + "-" + s.model + "-" + year + "-" + variant));
                result.add(l);
            }
        }
        return result;
    }

    // ──────────────────────────────────────────────
    //  Moto listings: 25 seeds × 20 variants = 500
    // ──────────────────────────────────────────────

    private List<Listing> buildMotoListings() {
        record MotoSeed(String brand, String model, int yr, int mi, double pr,
                        String body, String fuel, String trans,
                        double eng, String city, String desc) {}

        String[] conditions = {"Задовільний", "Хороший", "Хороший", "Відмінний"};
        String[] colors = {"Чорний","Червоний","Синій","Сірий","Білий","Зелений",
                           "Жовтий","Помаранчевий","Сріблистий","Коричневий","Бордовий","Бежевий"};

        var seeds = List.of(
            new MotoSeed("Yamaha","MT-07",         2018, 8000, 6500,"Нейкед",       "Бензин","Механіка",0.70,"Київ",    "Жвавий нейкед-стрит із потужним паралельним твіном"),
            new MotoSeed("Yamaha","YZF-R3",        2019, 6500, 4800,"Спортбайк",    "Бензин","Механіка",0.32,"Львів",   "Легкий спортбайк — чудовий вибір для початківців"),
            new MotoSeed("Yamaha","FZ6",           2014,18000, 4200,"Нейкед",       "Бензин","Механіка",0.60,"Одеса",   "Класичний нейкед із перевіреним мотором"),
            new MotoSeed("Yamaha","MT-09",         2020, 7000, 9200,"Нейкед",       "Бензин","Механіка",0.85,"Харків",  "Потужний нейкед із азартним характером"),
            new MotoSeed("Yamaha","TMAX 560",      2021, 5000,11500,"Мопед/Скутер", "Бензин","Варіатор",0.56,"Київ",    "Преміальний максі-скутер для міста та трас"),
            new MotoSeed("Honda","CB500F",         2019,12000, 5200,"Нейкед",       "Бензин","Механіка",0.50,"Дніпро",  "Універсальний нейкед для щоденних поїздок"),
            new MotoSeed("Honda","CBR600RR",       2015,14000, 7800,"Спортбайк",    "Бензин","Механіка",0.60,"Запоріжжя","Класичний спортбайк 600-го класу"),
            new MotoSeed("Honda","CB1000R",        2020, 9000,12500,"Нейкед",       "Бензин","Механіка",1.00,"Київ",    "Потужний літровий нейкед у преміальному оформленні"),
            new MotoSeed("Honda","CRF450L",        2021, 3500, 8900,"Ендуро",       "Бензин","Механіка",0.45,"Харків",  "Легальний ендуро для міста і бездоріжжя"),
            new MotoSeed("Honda","Gold Wing",      2019,21000,22000,"Туристичний",  "Бензин","Автомат", 1.80,"Одеса",   "Легендарний важкий туристичний мотоцикл"),
            new MotoSeed("Kawasaki","Ninja 400",   2020, 9000, 6800,"Спортбайк",    "Бензин","Механіка",0.40,"Київ",    "Спортивний байк із гострою реакцією на газ"),
            new MotoSeed("Kawasaki","Z900",        2019,11000, 9500,"Нейкед",       "Бензин","Механіка",0.90,"Дніпро",  "Харизматичний нейкед із рядним чотири"),
            new MotoSeed("Kawasaki","Versys 650",  2018,16000, 7200,"Туристичний",  "Бензин","Механіка",0.65,"Вінниця", "Туристичний мотоцикл для далеких подорожей"),
            new MotoSeed("Kawasaki","Ninja ZX-10R",2017,12500,13500,"Спортбайк",    "Бензин","Механіка",1.00,"Київ",    "Трековий спортбайк із болідним характером"),
            new MotoSeed("Kawasaki","W800",        2016, 9800, 7800,"Круізер",      "Бензин","Механіка",0.80,"Харків",  "Класичний круізер у ретро-стилі"),
            new MotoSeed("BMW","R 1250 GS",        2021,15000,19500,"Ендуро",       "Бензин","Механіка",1.25,"Київ",    "Легендарний пригодницький ендуро для будь-яких доріг"),
            new MotoSeed("BMW","S1000RR",          2020, 8000,21000,"Спортбайк",    "Бензин","Механіка",1.00,"Дніпро",  "Референсний супербайк для треку і траси"),
            new MotoSeed("BMW","F850GS",           2019,14000,14500,"Ендуро",       "Бензин","Механіка",0.85,"Одеса",   "Пригодницький ендуро для міжнародних подорожей"),
            new MotoSeed("BMW","R nineT",          2018,10500,16000,"Нейкед",       "Бензин","Механіка",1.17,"Львів",   "Преміальний нейкед-класик із боксерним двигуном"),
            new MotoSeed("BMW","K1600GT",          2020,18000,25000,"Туристичний",  "Бензин","Механіка",1.65,"Київ",    "Флагманський туристичний мотоцикл BMW"),
            new MotoSeed("Harley-Davidson","Street 750",  2017,14000, 8500,"Круізер","Бензин","Механіка",0.75,"Харків", "Круізер із харлеївським характером і стилем"),
            new MotoSeed("Harley-Davidson","Sportster 883",2016,16000,7500,"Круізер","Бензин","Механіка",0.88,"Запоріжжя","Культовий легкий круізер Harley-Davidson"),
            new MotoSeed("KTM","790 Duke",         2019, 9500,10500,"Нейкед",       "Бензин","Механіка",0.79,"Київ",    "Гострий і азартний нейкед із Австрії"),
            new MotoSeed("Ducati","Monster 821",   2018,11000,12500,"Нейкед",       "Бензин","Механіка",0.82,"Київ",    "Харизматичний нейкед із V-подібним двигуном"),
            new MotoSeed("Triumph","Street Triple",2017,13000, 9800,"Нейкед",       "Бензин","Механіка",0.765,"Одеса",  "Культовий британський нейкед середнього класу")
        );

        List<Listing> result = new ArrayList<>();
        int colorIdx = 0;
        for (var s : seeds) {
            for (int v = 0; v < 20; v++) {
                int year     = Math.min(2026, s.yr + v);
                int mileage  = Math.max(500, s.mi - v * 900);
                double price = Math.round((s.pr + v * 380.0) * 10) / 10.0;
                int owners   = Math.max(1, 4 - (v / 7));
                String cond  = conditions[Math.min(v, conditions.length - 1)];
                String color = colors[colorIdx++ % colors.length];

                String variant = MOTO_VARIANTS[v];
                String engVol = String.format("%.2f л", s.eng);
                String desc = s.desc + ". Версія: " + variant + " — " + MOTO_NOTES[v] + ". Паливо: " + s.fuel +
                        " | КПП: " + s.trans + " | Кузов: " + s.body +
                        " | Об'єм: " + engVol + " | Стан: " + cond + " | Власників: " + owners;

                Listing l = new Listing(s.brand + " " + s.model + " " + year + " · " + variant,
                        desc, price, year, mileage, s.brand, s.model);
                l.setVehicleType("motorcycle");
                l.setBodyType(s.body);       l.setFuelType(s.fuel);
                l.setTransmission(s.trans);  l.setDriveType(null);
                l.setEngineVolume(s.eng);
                l.setColor(color);           l.setCondition(cond);
                l.setOwnersCount(owners);    l.setCity(s.city);
                l.setCustomsCleared(v >= 2);
                l.getPhotoUrls().add(buildRealPhotoUrl("motorcycle", s.brand, s.model, s.body, color, year, s.brand + "-" + s.model + "-" + year + "-" + variant));
                result.add(l);
            }
        }
        return result;
    }

    // ──────────────────────────────────────────────
    //  Helpers
    // ──────────────────────────────────────────────

    private List<Listing> takeMissing(List<Listing> source, Set<String> existingKeys, long limit) {
        if (limit <= 0) return List.of();

        List<Listing> selected = new ArrayList<>();
        for (Listing listing : source) {
            if (selected.size() >= limit) break;
            if (existingKeys.add(listingKey(listing))) {
                selected.add(listing);
            }
        }
        return selected;
    }

    private String listingKey(Listing listing) {
        return String.join("|",
                String.valueOf(listing.getVehicleType()),
                String.valueOf(listing.getTitle()),
                String.valueOf(listing.getBrand()),
                String.valueOf(listing.getModel()),
                String.valueOf(listing.getYear()));
    }

    private void syncSequence(String tableName, String idColumn) {
        try {
            Long maxId = jdbcTemplate.queryForObject(
                    "select coalesce(max(" + idColumn + "), 0) from " + tableName, Long.class);
            if (maxId == null || maxId <= 0) return;

            String seq = jdbcTemplate.queryForObject(
                    "select pg_get_serial_sequence(?, ?)", String.class, tableName, idColumn);
            if (seq == null || seq.isBlank()) return;

            jdbcTemplate.queryForObject("select setval(?, ?, true)", Long.class, seq, maxId);
            log.info("Synchronized {} sequence {} to {}", tableName, seq, maxId);
        } catch (Exception ex) {
            log.warn("Could not synchronize sequence for table {}: {}", tableName, ex.getMessage());
        }
    }

    private String buildRealPhotoUrl(String vehicleType, String brand, String model, String bodyType, String color, Integer year, String uniqueSeed) {
        String cacheKey = normalizePhotoKey(brand, model);
        if (resolvedPhotoCache.containsKey(cacheKey)) {
            return resolvedPhotoCache.get(cacheKey);
        }

        for (String candidate : photoTitleCandidates(brand, model)) {
            String photo = fetchWikipediaPhotoByTitle(candidate);
            if (photo != null && !photo.isBlank()) {
                resolvedPhotoCache.put(cacheKey, photo);
                return photo;
            }
        }

        String searched = fetchWikipediaPhotoBySearch((readableValue(brand, "") + " " + readableValue(model, "")).trim());
        if (searched != null && !searched.isBlank()) {
            resolvedPhotoCache.put(cacheKey, searched);
            return searched;
        }

        List<String> pool = "motorcycle".equalsIgnoreCase(vehicleType) ? MOTO_PHOTOS : CAR_PHOTOS;
        String fallback = pool.get(Math.abs((safeToken(uniqueSeed) + "|" + safeToken(bodyType) + "|" + safeToken(color) + "|" + year).hashCode()) % pool.size());
        resolvedPhotoCache.put(cacheKey, fallback);
        return fallback;
    }

    private String safeToken(String value) {
        if (value == null || value.isBlank() || "null".equalsIgnoreCase(value)) return "vehicle";
        return value.trim().replace(' ', ',').replaceAll("[^a-zA-Z0-9,\\-]", "");
    }

    private List<String> photoTitleCandidates(String brand, String model) {
        List<String> candidates = new ArrayList<>();
        String key = normalizePhotoKey(brand, model);

        switch (key) {
            case "mazda|3" -> candidates.add("Mazda3");
            case "bmw|3 series" -> candidates.add("BMW 3 Series");
            case "bmw|5 series" -> candidates.add("BMW 5 Series");
            case "mercedes-benz|c-class" -> candidates.add("Mercedes-Benz C-Class");
            case "mercedes-benz|glc 300" -> candidates.add("Mercedes-Benz GLC-Class");
            case "toyota|rav4" -> candidates.add("Toyota RAV4");
            case "land rover|discovery" -> candidates.add("Land Rover Discovery");
            case "land rover|range rover" -> candidates.add("Range Rover");
            case "bmw|r 1250 gs" -> candidates.addAll(List.of("BMW GS series", "BMW R 1250 GS"));
            case "bmw|f850gs" -> candidates.addAll(List.of("BMW F 850 GS", "BMW GS series"));
            case "bmw|k1600gt" -> candidates.addAll(List.of("BMW K1600", "BMW K 1600 GT"));
            case "bmw|r ninet" -> candidates.add("BMW R nineT");
            case "harley-davidson|street 750" -> candidates.addAll(List.of("Harley-Davidson Street", "Harley-Davidson Street 750"));
            case "harley-davidson|sportster 883" -> candidates.addAll(List.of("Harley-Davidson Sportster", "Harley-Davidson Sportster 883"));
            case "ktm|390 duke" -> candidates.addAll(List.of("KTM Duke 390", "KTM 390 Duke"));
            case "ktm|790 duke" -> candidates.add("KTM 790 Duke");
            case "ktm|1290 super duke" -> candidates.addAll(List.of("KTM 1290 Super Duke R", "KTM Super Duke"));
            case "ducati|monster 821" -> candidates.addAll(List.of("Ducati Monster 821", "Ducati Monster"));
            case "ducati|panigale v4" -> candidates.add("Ducati Panigale V4");
            case "triumph|street triple" -> candidates.add("Triumph Street Triple");
            case "triumph|street twin" -> candidates.addAll(List.of("Triumph Street Twin", "Triumph Bonneville Speed Twin"));
            case "triumph|tiger 1200" -> candidates.add("Triumph Tiger 1200");
            case "honda|gold wing" -> candidates.add("Honda Gold Wing");
            case "honda|africa twin" -> candidates.add("Honda Africa Twin");
            case "honda|crf450l" -> candidates.add("Honda CRF450L");
            case "yamaha|tmax 560" -> candidates.add("Yamaha TMAX");
            default -> {}
        }

        String plain = (readableValue(brand, "") + " " + readableValue(model, "")).trim();
        String compactModel = readableValue(model, "").replace(" ", "").trim();
        if (!plain.isBlank()) candidates.add(plain);
        if (!compactModel.isBlank()) candidates.add((readableValue(brand, "") + " " + compactModel).trim());

        List<String> unique = new ArrayList<>();
        for (String candidate : candidates) {
            String normalized = candidate == null ? "" : candidate.trim();
            if (!normalized.isBlank() && !unique.contains(normalized)) {
                unique.add(normalized);
            }
        }
        return unique;
    }

    private String fetchWikipediaPhotoByTitle(String title) {
        if (title == null || title.isBlank()) return null;
        try {
            String page = URLEncoder.encode(title.replace(' ', '_'), StandardCharsets.UTF_8);
            HttpResponse<String> response = performWikipediaGet("https://en.wikipedia.org/api/rest_v1/page/summary/" + page);
            if (response.statusCode() < 200 || response.statusCode() >= 300) return null;

            JsonNode root = objectMapper.readTree(response.body());
            String original = root.path("originalimage").path("source").asText("");
            if (!original.isBlank()) return original;

            String thumb = root.path("thumbnail").path("source").asText("");
            return thumb.isBlank() ? null : thumb;
        } catch (Exception ignored) {
            return null;
        }
    }

    private String fetchWikipediaPhotoBySearch(String term) {
        if (term == null || term.isBlank()) return null;
        try {
            String query = URLEncoder.encode(term, StandardCharsets.UTF_8);
            String url = "https://en.wikipedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch="
                    + query
                    + "&gsrlimit=1&prop=pageimages&piprop=original";

            HttpResponse<String> response = performWikipediaGet(url);
            if (response.statusCode() < 200 || response.statusCode() >= 300) return null;

            JsonNode pages = objectMapper.readTree(response.body()).path("query").path("pages");
            if (!pages.isObject()) return null;

            for (JsonNode page : pages) {
                String original = page.path("original").path("source").asText("");
                if (!original.isBlank()) return original;
            }
            return null;
        } catch (Exception ignored) {
            return null;
        }
    }

    private String readableValue(String value, String fallback) {
        if (value == null || value.isBlank() || "null".equalsIgnoreCase(value)) return fallback;
        return value.trim().replaceAll("\\s+", " ");
    }

    private String normalizePhotoKey(String brand, String model) {
        return readableValue(brand, "").toLowerCase(Locale.ROOT) + "|" + readableValue(model, "").toLowerCase(Locale.ROOT);
    }

    private void loadPrecomputedPhotoMap() {
        if (!resolvedPhotoCache.isEmpty()) return;
        try (var in = getClass().getClassLoader().getResourceAsStream("model-photo-map.json")) {
            if (in == null) return;
            Map<String, String> raw = objectMapper.readValue(in, new TypeReference<Map<String, String>>() {});
            raw.forEach((key, value) -> resolvedPhotoCache.put(String.valueOf(key).toLowerCase(Locale.ROOT), value));
            log.info("Loaded {} precomputed model photos", resolvedPhotoCache.size());
        } catch (Exception ex) {
            log.warn("Could not load precomputed model photo map: {}", ex.getMessage());
        }
    }

    private HttpResponse<String> performWikipediaGet(String url) throws Exception {
        for (int attempt = 0; attempt < 3; attempt++) {
            throttleWikipediaRequests();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(15))
                    .header("User-Agent", "vehicle-marketplace/1.0")
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 429) {
                return response;
            }

            Thread.sleep(900L * (attempt + 1));
        }

        return httpClient.send(
                HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .timeout(Duration.ofSeconds(15))
                        .header("User-Agent", "vehicle-marketplace/1.0")
                        .header("Accept", "application/json")
                        .GET()
                        .build(),
                HttpResponse.BodyHandlers.ofString()
        );
    }

    private synchronized void throttleWikipediaRequests() throws InterruptedException {
        long now = System.currentTimeMillis();
        long minIntervalMs = 180L;
        long wait = minIntervalMs - (now - lastWikipediaRequestAt);
        if (wait > 0) {
            Thread.sleep(wait);
        }
        lastWikipediaRequestAt = System.currentTimeMillis();
    }
}

