# Sentinela

A system monitoring solution. It collects host metrics (CPU, RAM, disk, uptime) via a lightweight agent and exposes them through a backend service.

> **Status: Work in progress — not production ready.** APIs and behavior may change at any time.

## Project structure

- `agent/` — C agent that reads system metrics and outputs them as JSON on stdout.
- `backend/` — Spring Boot REST backend that receives and stores the metrics.

## Dependencies

### Agent

- A C99 compiler (`gcc`/`clang`)
- `make`
- [json-c](https://github.com/json-c/json-c) development package (e.g. `libjson-c-dev` on Debian/Ubuntu)

### Backend

- Java 21
- Maven (or use the bundled `./mvnw` wrapper)
- PostgreSQL
- Redis

## Building

### Agent

```sh
make
```

This produces the `Sentinela` binary. Run it with `./Sentinela`.

### Backend

```sh
cd backend
./mvnw clean package
```

Or, if Maven is installed globally:

```sh
cd backend
mvn clean package
```

### Running the backend

Make sure PostgreSQL and Redis are running locally (defaults: `localhost:5432` and `localhost:6379`), then:

```sh
cd backend
./mvnw spring-boot:run
```

The service listens on port `8080` by default. Connection settings can be changed in `backend/src/main/resources/application.yml`.

## License

[MIT](LICENSE)
