CC=cc
CFLAGS= -Wall -Wextra -std=c99 -pedantic -static
IN=agent/agent.c
OUT=Sentinela
JSON= -ljson-c

all: $(IN)
	$(CC) $(CFLAGS) -o $(OUT) $(IN) $(JSON)

clean: $(OUT)
	rm -f $(OUT)