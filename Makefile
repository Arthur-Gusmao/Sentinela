CC=cc
CFLAGS= -Wall -Wextra -std=c99 -pedantic -static
IN=agent/agent.c
OUT=Sentinela

BACKEND_DIR=backend

.PHONY: all agent agent-run docker-up docker-down clean

all: agent

agent: $(OUT)

$(OUT): $(IN)
	$(CC) $(CFLAGS) -o $(OUT) $(IN)

agent-run: $(OUT)
	./$(OUT)

docker-up:
	docker compose -f $(BACKEND_DIR)/docker-compose.yml up --build -d

docker-down:
	docker compose -f $(BACKEND_DIR)/docker-compose.yml down

clean:
	rm -f $(OUT)
