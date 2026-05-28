# Backend (Spring Boot)

This folder contains a Spring Boot backend (Java 17) with simple JWT-based authentication and entities for listings and users.

How to run (locally):

1. Ensure Postgres is running and create database `vehicle_marketplace` or set environment variables DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD.
2. To enable AI vehicle assistant, set `GEMINI_API_KEY` (and optional `GEMINI_MODEL`, default `gemini-1.5-flash`).
3. Build and run:

```bash
cd backend
mvn spring-boot:run
```

Default credentials:
- username: `testuser`
- password: `password`

