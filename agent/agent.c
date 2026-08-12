#include <json-c/json.h>
#include <stdatomic.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/statvfs.h>
#include <unistd.h>
#include <string.h>

#define STRING_SIZE 256

typedef struct {
  int percCpu;
  int percRam;
  int percDisk;
  double uptime;
  char hostname[STRING_SIZE];
  char Os[STRING_SIZE];
} System;

int readCpu(System *system);
int readRam(System *system);
int readDisk(System *system);
int readHostname(System *system);
int readOS(System *system);
int readUpTime(System *system);
void printJson(System *system);

int main(void) {

  bool isRunning = true;
  System system;

  readHostname(&system);
  
  readOS(&system);

  while (isRunning) {
    readCpu(&system);
    readRam(&system);
    readDisk(&system);
    readUpTime(&system);
    printJson(&system);
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

int readDisk(System *system) {
  struct statvfs disk;

  if (statvfs("/", &disk) != 0) {
    return EXIT_FAILURE;
  }

  unsigned long total = disk.f_blocks * disk.f_frsize;
  unsigned long available = disk.f_bavail * disk.f_frsize;
  unsigned long used = total - available;

  system->percDisk = (double)used / total * 100;

  return EXIT_SUCCESS;
}

int readHostname(System *system) {
  FILE *hostnameFile = fopen("/etc/hostname", "r");

  if (hostnameFile == NULL) {
    return EXIT_FAILURE;
  }

  if (fgets(system->hostname, sizeof(system->hostname), hostnameFile) == NULL) {
    fclose(hostnameFile);
    return EXIT_FAILURE;
  }
  system->hostname[strcspn(system->hostname, "\n")] = '\0';

  fclose(hostnameFile);

  return EXIT_SUCCESS;
}

int readOS(System *system) {
  FILE *osFile = fopen("/etc/os-release", "r");
  char buffer[STRING_SIZE] = {0};

  if (osFile == NULL) {
    return EXIT_FAILURE;
  }

  while (fgets(buffer, sizeof(buffer), osFile) != NULL) {
    if (sscanf(buffer, "PRETTY_NAME=\"%255[^\"]\"", system->Os) == 1) {
      fclose(osFile);
      return EXIT_SUCCESS;
    }
  }

  fclose(osFile);

  return EXIT_SUCCESS;
}

int readUpTime(System *system) {
  FILE *uptimeFile = fopen("/proc/uptime", "r");

  if (uptimeFile == NULL) {
    return EXIT_FAILURE;
  }

  if (fscanf(uptimeFile, "%lf", &system->uptime) != 1) {
    fclose(uptimeFile);
    return EXIT_FAILURE;
  }

  fclose(uptimeFile);

  return EXIT_SUCCESS;
}

void printJson(System *system) {
  struct json_object *object = json_object_new_object();

  json_object_object_add(
      object,
      "cpu",
      json_object_new_int(system->percCpu));

  json_object_object_add(
      object,
      "ram",
      json_object_new_int(system->percRam));

  json_object_object_add(
      object,
      "disk",
      json_object_new_int(system->percDisk));

  json_object_object_add(
      object,
      "uptime",
      json_object_new_double(system->uptime));

  json_object_object_add(
      object,
      "hostname",
      json_object_new_string(system->hostname));

  json_object_object_add(
      object,
      "os",
      json_object_new_string(system->Os));

  printf("%s\n", json_object_to_json_string(object));

  json_object_put(object);

}