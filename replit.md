# Local Artisan Cooperative

A Spring Boot web application for a local artisan cooperative.

## Architecture

- **Framework**: Spring Boot 3.3.5
- **Language**: Java 19
- **Build System**: Gradle (with Gradle Wrapper)
- **Template Engine**: Thymeleaf (server-side rendering)
- **Database**: PostgreSQL (Replit built-in)
- **ORM**: Spring Data JPA / Hibernate

## Project Structure

```
src/
  main/
    java/com/example/demo/
      DemoApplication.java       # Spring Boot entry point
    resources/
      application.properties     # App configuration
      templates/                 # Thymeleaf HTML templates (to be added)
      static/                    # Static assets (to be added)
  test/
    java/com/example/demo/
      DemoApplicationTests.java  # Integration tests
build.gradle                     # Gradle build config
settings.gradle                  # Project name
```

## Running the Application

The app runs via the "Start application" workflow using:
```
./gradlew bootRun
```

The server starts on **port 5000**.

## Database

Uses Replit's built-in PostgreSQL database. Connection is configured via the `DATABASE_URL` environment variable (automatically set by Replit).

The `spring.jpa.hibernate.ddl-auto=update` setting auto-creates/updates tables based on JPA entity classes.

## Deployment

Configured for autoscale deployment:
- **Build**: `./gradlew build -x test`
- **Run**: `java -jar build/libs/demo-0.0.1-SNAPSHOT.jar --server.port=5000`

## Key Configuration

- `src/main/resources/application.properties` — server port, database connection, JPA settings
- `build.gradle` — dependencies and build configuration
