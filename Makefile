CC=cc
CFLAGS= -Wall -Wextra -std=c99 -pedantic -static
IN=agent/agent.c
OUT=Sentinela

MVN=./mvnw
BACKEND_DIR=backend

.PHONY: all agent backend agent-run backend-run test clean

all: agent backend

agent: $(OUT)

$(OUT): $(IN)
	$(CC) $(CFLAGS) -o $(OUT) $(IN)

backend:
	cd $(BACKEND_DIR) && $(MVN) clean package

agent-run: $(OUT)
	./$(OUT)

backend-run:
	cd $(BACKEND_DIR) && $(MVN) spring-boot:run

test:
	cd $(BACKEND_DIR) && $(MVN) test

clean:
	rm -f $(OUT)
	cd $(BACKEND_DIR) && $(MVN) clean
