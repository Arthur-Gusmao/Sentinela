CC=cc
CFLAGS= -Wall -Wextra -std=c99 -pedantic
IN=agent/agent.c
OUT=Sentinela

all: $(IN)
	$(CC) $(CFLAGS) -o $(OUT) $(IN)

clean: $(OUT)
	rm -f $(OUT)

