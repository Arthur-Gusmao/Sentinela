# Sentinela

A lightweight server monitoring system. A C agent runs on each machine you want to monitor, collecting metrics from the Linux kernel and sending them to a Spring Boot backend every 5 seconds. The backend stores the data, raises alerts when thresholds are crossed, and pushes updates to a React dashboard over WebSocket in real time.

> **Status:** Work in progress — not production ready. APIs and behavior may change at any time.

## Architecture

```
+------------------+   HTTP POST /api/v1/agents/metrics   +------------------+
|   C Agent        | ------------------------------------> |   Spring Boot    |
|   (per machine)  |                                       |   Backend        |
|   reads /proc    |                                       |   REST + JPA     |
+------------------+                                       +------------------+
                                                             |             |
                                                             v             v
                                                        PostgreSQL      Redis
                                                                           |
                                                                           v
                                                             +------------------+
                                                             |   React          |
                                                             |   Dashboard      |
                                                             |   WebSocket      |
                                                             +------------------+
```

- **Agent** (`agent/`): a C99 daemon that samples CPU, RAM, disk, network, temperature and uptime every 5 seconds and POSTs them as JSON to the backend. Runs on any Linux machine with `/proc`.
- **Backend** (`backend/`): a Spring Boot 4 application exposing a REST API, persisting data with JPA/PostgreSQL, and broadcasting real-time updates over WebSocket (STOMP over SockJS).
- **Frontend** (`frontend/`): a React + Vite dashboard that connects via WebSocket for live metric updates, displays server status, metric history charts, and active alerts.

## Project structure

```
.
├── Makefile                      # Agent build + Docker stack helpers
├── agent/
│   └── agent.c                   # Agent source (C99, Linux /proc)
├── backend/
│   ├── Dockerfile                # Multi-stage Maven + JRE image
│   ├── docker-compose.yml        # Backend + PostgreSQL + Redis stack
│   ├── pom.xml                   # Spring Boot 4, Java 21
│   └── src/main/
│       ├── java/...              # Controllers, services, entities, repositories
│       └── resources/
│           └── application.yml   # DB, Redis and server configuration
└── frontend/
    ├── src/
    │   └── App.jsx               # React dashboard with WebSocket client
    ├── vite.config.js
    └── package.json
```

## Prerequisites

### Agent

- Linux (reads `/proc`, `/sys`, `/etc/hostname`, `/etc/os-release`)
- GCC or Clang (C99)
- `make`
- `libjson-c`

On Debian/Ubuntu:
```bash
sudo apt install gcc make libjson-c-dev
```

On Fedora/RHEL:
```bash
sudo dnf install gcc make json-c-devel
```

### Backend

- Java 21
- Docker (recommended)

### Frontend

- Node.js 18+
- npm

## Building

### Agent

```bash
make agent
```

Compiles `agent/agent.c` into the `Sentinela` binary.

### Backend

```bash
cd backend
./mvnw clean package
```

Produces `backend/target/Sentinela-0.0.1-SNAPSHOT.jar`.

### Frontend

```bash
cd frontend
npm install
npm run build
```

## Running

### Option A — Docker (recommended)

Starts the backend, PostgreSQL, and Redis together:

```bash
make docker-up
```

The API listens on `http://localhost:8080`. To stop:

```bash
make docker-down
```

Default ports exposed to the host:

| Service    | Host port |
|------------|-----------|
| Backend    | 8080      |
| PostgreSQL | 5434      |
| Redis      | 6379      |

### Option B — Run on the host

**1. Start the database services**

```bash
sudo systemctl start postgresql redis-server
sudo -u postgres psql -c "CREATE DATABASE sentinela;"
```

Connection settings live in `backend/src/main/resources/application.yml`:

| Setting    | Default                                          |
|------------|--------------------------------------------------|
| PostgreSQL | `jdbc:postgresql://localhost:5432/sentinela`     |
| Redis      | `localhost:6379`                                 |
| HTTP port  | `8080`                                           |

**2. Start the backend**

```bash
cd backend
./mvnw spring-boot:run
```

**3. Run the frontend**

```bash
cd frontend
npm run dev
```

Dashboard available at `http://localhost:5173`.

**4. Run the agent**

The agent posts metrics to `127.0.0.1:8080` by default. The host and port are compile-time constants (`AGENT_HOST` and `AGENT_PORT` in `agent/agent.c`) — rebuild the agent after changing them.

```bash
sudo make agent-run
```

or:

```bash
sudo ./Sentinela
```

The agent daemonizes automatically. To stop it:

```bash
sudo pkill Sentinela
```

**5. Verify**

```bash
curl http://localhost:8080/api/v1/servers
```

After a few seconds the host should appear, with metrics available at `/api/v1/servers/{id}/metrics`.

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
Lists unresolved alerts for a server.

### `GET /alerts`
Lists all unresolved alerts across every server.

### `PATCH /alerts/{id}/resolve`
Marks an alert as resolved.

## Alerts

The backend raises alerts automatically when a metric crosses a threshold:

| Metric      | Threshold | Severity |
|-------------|-----------|----------|
| CPU         | > 90%     | CRITICAL |
| RAM         | > 85%     | WARNING  |
| Disk        | > 90%     | CRITICAL |
| Temperature | > 80°C    | CRITICAL |
| Server down | no heartbeat for 60s | CRITICAL |

## Make targets

| Target           | Description                              |
|------------------|------------------------------------------|
| `make` / `make all` | Compile the agent binary              |
| `make agent`     | Compile the agent binary                 |
| `make agent-run` | Run the agent                            |
| `make docker-up` | Build backend image and start the stack  |
| `make docker-down` | Stop and remove the stack              |
| `make clean`     | Remove the agent binary                  |

## License

MIT