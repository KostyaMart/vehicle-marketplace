# Vehicle Marketplace (DrivePoint)

Повноцінний маркетплейс авто та мото з рекомендаціями, AI-помічником, обраним, адмін-панеллю та backend на Spring Boot.

## Що всередині

- **Frontend**: React + Vite + Tailwind
- **Backend**: Spring Boot 3 (Java 17), Spring Security, JPA
- **База даних**: PostgreSQL 15
- **AI**: інтеграція з Gemini API (підбір транспорту)

## Структура проєкту

```text
vehicle-marketplace/
  backend/    # Spring Boot API
  frontend/   # React застосунок
  ml/         # скрипти підготовки/навчання (окремо)
```

## Швидкий старт

### 1) Підняти PostgreSQL через Docker

```bash
docker compose up -d
```

За замовчуванням із `docker-compose.yml`:
- DB: `vehicle_marketplace`
- User: `postgres`
- Password: `postgres`
- Port: `5432`

### 2) Запустити backend


```bash
cd backend
mvn spring-boot:run
```

Backend читає налаштування з `backend/src/main/resources/application.properties` і підтримує env-змінні:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET`
- `GEMINI_API_KEY`, `GEMINI_MODEL`

### 3) Запустити frontend

```bash
cd frontend
npm install
npm run dev
```

### 4) Відкрити застосунок

- Frontend (Vite): зазвичай `http://localhost:5173`
- Backend (Spring Boot): зазвичай `http://localhost:8080`

## Збірка

### Frontend

```bash
cd frontend
npm run build
npm run preview
```

### Backend

```bash
cd backend
mvn clean package
```

## Основні можливості

- Каталог оголошень із фільтрами та сортуванням
- Створення/редагування оголошень
- Обране для користувача
- Блок рекомендацій за вагами параметрів
- AI-помічник підбору транспорту
- Адмін-панель (користувачі, оголошення, зворотний зв'язок)


