#include <stdatomic.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

typedef struct {
  int percCpu;
  int percRam;
  int percDisk;
  char *hostname;
} System;

int readCpu(System *system);
int readRam(System *system);
void readDisk(void);
int readHostname(System *system);

int main(void) {

  bool isRunning = true;
  System system;

  while (isRunning) {
    readCpu(&system);
    readRam(&system);
    readHostname(&system);
    printf("============================\n");
    printf("Monitor Agent\n");
    printf("============================\n");
    printf("CPU      : %d%%\n", system.percCpu);
    printf("RAM      : %d%%\n", system.percRam);
    printf("HOSTNAME : %s", system.hostname);
    printf("============================\n");
  }

  return EXIT_SUCCESS;
}

int readCpu(System *system) {
  char buffer[256] = {0};

  long user = 0;
  long nice = 0;
  long system_time = 0;
  long idle = 0;

  long user2 = 0;
  long nice2 = 0;
  long system_time2 = 0;
  long idle2 = 0;

  long deltaUser = 0;
  long deltaNice = 0;
  long deltaSystem = 0;
  long deltaIdle = 0;

  long busy = 0;
  long total = 0;

  FILE *statFile = fopen("/proc/stat", "r");

  if (statFile == NULL) {
    return EXIT_FAILURE;
  }

  fgets(buffer, sizeof(buffer), statFile);

  if (sscanf(buffer, "cpu %ld %ld %ld %ld", &user, &nice, &system_time,
             &idle) != 4) {
    fclose(statFile);
    return EXIT_FAILURE;
  }

  rewind(statFile);
  sleep(1);

  fgets(buffer, sizeof(buffer), statFile);

  if (sscanf(buffer, "cpu %ld %ld %ld %ld", &user2, &nice2, &system_time2,
             &idle2) != 4) {
    fclose(statFile);
    return EXIT_FAILURE;
  }

  deltaUser = user2 - user;
  deltaNice = nice2 - nice;
  deltaSystem = system_time2 - system_time;
  deltaIdle = idle2 - idle;

  busy = deltaUser + deltaNice + deltaSystem;
  total = busy + deltaIdle;

  system->percCpu = (double)busy / total * 100;
  fclose(statFile);
  return EXIT_SUCCESS;
}

int readRam(System *system) {
  char buffer[3][256] = {0};

  long totalMem = 0;
  long freeMem = 0;
  long availableMem = 0;

  FILE *memFile = fopen("/proc/meminfo", "r");

  if (memFile == NULL) {
    return EXIT_FAILURE;
  }

  for (int i = 0; i < 3; i++) {
    if (fgets(buffer[i], sizeof(buffer), memFile) == NULL) {
      fclose(memFile);
      return EXIT_FAILURE;
    }
  }

  sscanf(buffer[0], "MemTotal: %ld kB", &totalMem);
  sscanf(buffer[1], "MemFree: %ld kB", &freeMem);
  sscanf(buffer[2], "MemAvailable: %ld kB", &availableMem);

  long usedMem = totalMem - availableMem;

  system->percRam = (double)usedMem / totalMem * 100;
  fclose(memFile);

  return EXIT_SUCCESS;
}

int readHostname(System *system) {
  FILE *hostnameFile = fopen("/etc/hostname", "r");

  char *buffer = malloc(256);

  if (buffer == NULL) {
    fclose(hostnameFile);
    return EXIT_FAILURE;
  }
  if (fgets(system->hostname, sizeof(buffer), hostnameFile) == NULL) {
    free(system->hostname);
    fclose(hostnameFile);
    return EXIT_FAILURE;
  }

  system->hostname = buffer;
  fclose(hostnameFile);

  return EXIT_SUCCESS;
}
