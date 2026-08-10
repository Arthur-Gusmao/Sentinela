#include <stdatomic.h>
#include <stdio.h>
#include <stdlib.h>

typedef struct {
  int percCpu;
  int percRam;
  int percDisk;
  char *hostname;
} System;

void readCpu(void);
void readRam(void);
void readDisk(void);
void readHostname(void);

int main(void) {

  readCpu();

  return EXIT_SUCCESS;
}

void readCpu(void) {
  char buffer[256] = {0};

  long user;
  long nice;
  long system;
  long idle;

  FILE *statFile = fopen("/proc/stat", "r");

  if (statFile == NULL) {
    return;
  }

  fgets(buffer, sizeof(buffer), statFile);

  if (sscanf(buffer, "cpu %ld %ld %ld %ld", &user, &nice, &system, &idle) !=
      4) {
    fclose(statFile);
    return;
  }

  printf("user    : %ld\n", user);
  printf("nice    : %ld\n", nice);
  printf("system  : %ld\n", system);
  printf("idle    : %ld\n", idle);

  fclose(statFile);
}
