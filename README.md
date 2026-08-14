# Sentinela

A lightweight system monitoring solution. A small C agent collects host
metrics (CPU, RAM, disk, uptime, temperature, network) on each machine and
sends them to a Spring Boot backend, which stores the data and raises alerts
based on configurable thresholds.

> **Status: Work in progress — not production ready.** APIs and behavior may
> change at any time.

## Architecture

```
+----------------+   HTTP (POST /api/v1/agents/metrics)   +------------------+
|  C agent       | -------------------------------------> |  Spring Boot     |
|  (per machine) |                                        |  backend         |
|  reads /proc   |                                        |  REST + JPA      |
+----------------+                                        +------------------+
                                                            |             |
                                                            v             v
                                                       PostgreSQL      Redis
                                                      (persistence)  (configured)
```

- **Agent** (`agent/`): a C99 daemon that samples metrics every 5 seconds and
  posts them as JSON to the backend.
- **Backend** (`backend/`): a Spring Boot 4 application exposing a REST API,
  persisting servers, metrics and alerts.

## Project structure

```
.
├── Makefile                     # Agent build + Docker stack helpers
├── Sentinela                    # Compiled agent binary
├── agent/
│   └── agent.c                  # Agent source (C99, Linux /proc)
└── backend/
    ├── Dockerfile               # Backend image (multi-stage Maven + JRE)
    ├── docker-compose.yml       # Backend + PostgreSQL + Redis stack
    ├── pom.xml                  # Spring Boot 4 project (Java 21)
    ├── mvnw                     # Maven wrapper
    └── src/main/
        ├── java/...             # Controllers, services, entities, repositories
        └── resources/
            └── application.yml  # DB, Redis and server configuration
```

## Prerequisites

### Agent

- Linux (reads `/proc`, `/sys`, `/etc/hostname`, `/etc/os-release`)
- A C99 compiler (`gcc` or `clang`)
- `make`

On Debian/Ubuntu:

```sh
sudo apt install gcc make
```

> The agent only uses the standard C library; the built binary is statically
> linked and has no runtime dependencies.

### Backend

- Java 21 (JDK)
- Maven (optional — the bundled `./mvnw` wrapper downloads Maven automatically)
- PostgreSQL (default: `localhost:5432`)
- Redis (default: `localhost:6379`)

On Debian/Ubuntu:

```sh
sudo apt install openjdk-21-jdk postgresql redis-server
```

Alternatively, install [Docker](https://docs.docker.com/engine/install/) and use
the provided `docker-compose.yml` to run the backend, PostgreSQL and Redis
without installing them on the host.

## Building

The `Makefile` drives the agent build and the Docker stack; the backend is
built directly with Maven.

### Agent

```sh
make agent
```

This compiles `agent/agent.c` into the `Sentinela` binary.

### Backend

```sh
cd backend
./mvnw clean package
```

The JAR is produced at `backend/target/Sentinela-0.0.1-SNAPSHOT.jar`.

## Running

### Option A — Docker (recommended)

Requires Docker and Docker Compose. This builds the backend image and starts
the backend together with PostgreSQL and Redis:

```sh
make docker-up
```

The service listens on `http://localhost:8080`. Bring everything down with:

```sh
make docker-down
```

> `docker compose` also maps PostgreSQL (`5432`) and Redis (`6379`) to the host,
> so the agent and any host-run process can reach the backend normally.

### Option B — Run on the host

#### 1. Start the database services

```sh
sudo systemctl start postgresql redis-server
sudo -u postgres createdb sentinela
```

Or, using the `psql` shell:

```sql
CREATE DATABASE sentinela;
```

Connection settings (URL, username, password) live in
`backend/src/main/resources/application.yml`. Defaults:

| Setting | Default |
| --- | --- |
| PostgreSQL | `jdbc:postgresql://localhost:5432/sentinela` (user/pass `postgres`) |
| Redis | `localhost:6379` |
| HTTP port | `8080` |

The backend creates/updates the tables automatically (`ddl-auto: update`).

#### 2. Start the backend

```sh
cd backend
./mvnw spring-boot:run
```

#### 3. Run the agent

The agent posts metrics to the backend (default target `127.0.0.1:8080`).
Run it as root or a user with read access to `/proc`:

```sh
sudo make agent-run
```

or:

```sh
sudo ./Sentinela
```

The agent daemonizes and reports metrics every 5 seconds. Stop it with:

```sh
sudo pkill Sentinela
```

> The agent target host/port are compile-time constants (`AGENT_HOST` and
> `AGENT_PORT` in `agent/agent.c`). Rebuild the agent after changing them.

#### 4. Verify

```sh
curl http://localhost:8080/api/v1/servers
```

After a few seconds you should see the host listed, along with metrics at
`/api/v1/servers/{id}/metrics`.

## API

Base URL: `http://localhost:8080/api/v1`

### `POST /agents/metrics`

Receives a metric report from an agent.

```json
{
  "hostname": "my-server",
  "ip": "192.168.1.10",
  "os": "Ubuntu 24.04 LTS",
  "cpu": 42.5,
  "ram": 61.2,
  "disk": 73.9,
  "temperature": 51.3,
  "networkRx": 1234567,
  "networkTx": 7654321
}
```

### `GET /servers`

Lists all registered servers.

### `GET /servers/{id}`

Returns a single server.

### `GET /servers/{id}/metrics`

Lists the latest metrics for a server (newest first).

### `GET /servers/{id}/alerts`

Lists the unresolved alerts for a server.

### `GET /alerts`

Lists all unresolved alerts across every server.

## Alerts

The backend raises alerts when a metric crosses a threshold:

| Metric | Threshold | Severity |
| --- | --- | --- |
| CPU | > 90% | CRITICAL |
| RAM | > 85% | WARNING |
| Disk | > 90% | CRITICAL |
| Temperature | > 80 °C | CRITICAL |

## Make targets

| Target | Description |
| --- | --- |
| `make` / `make all` | Compile the agent binary |
| `make agent` | Compile the agent binary |
| `make agent-run` | Run the agent |
| `make docker-up` | Build backend image and start the Docker stack |
| `make docker-down` | Stop and remove the Docker stack |
| `make clean` | Remove the agent binary |

Backend build/run/test tasks use Maven directly:

```sh
cd backend
./mvnw test            # run tests
./mvnw clean package   # build the JAR
./mvnw spring-boot:run # start the backend
```

## License

[MIT](LICENSE)
