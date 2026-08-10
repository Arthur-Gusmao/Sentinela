CC=cc
CFLAGS= -Wall -Wextra -std=c99 -pedantic
IN=src/main.c
OUT=main

all: $(IN)
	$(CC) $(CFLAGS) -o $(OUT) $(IN)

clean: $(OUT)
	rm -f $(OUT)

