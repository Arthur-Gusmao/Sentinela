#define _POSIX_C_SOURCE 200112L
#include <arpa/inet.h>
#include <fcntl.h>
#include <netinet/in.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <sys/stat.h>
#include <sys/statvfs.h>
#include <unistd.h>

#define STRING_SIZE 256
#define AGENT_HOST "127.0.0.1"
#define AGENT_PORT 8080

typedef struct {
  double percCpu;
  double percRam;
  double percDisk;
  double uptime;
  char hostname[STRING_SIZE];
  char Os[STRING_SIZE];
  char ip[STRING_SIZE];
  double temperature;
  long networkRx;
  long networkTx;
} System;

int readCpu(System *system);
int readRam(System *system);
int readDisk(System *system);
int readHostname(System *system);
int readOS(System *system);
int readUpTime(System *system);
int readTemperature(System *system);
int readNetwork(System *system);
int sendMetrics(System *system);
int daemonize(void);

static volatile sig_atomic_t isRunning = 1;

static void handleSignal(int signal) {
  (void)signal;
  isRunning = 0;
}

int main(void) {
  System system = {0};

  if (readHostname(&system) != EXIT_SUCCESS)
    return EXIT_FAILURE;

  if (readOS(&system) != EXIT_SUCCESS)
    return EXIT_FAILURE;

  //if (daemonize() != EXIT_SUCCESS)
    //return EXIT_FAILURE;

  signal(SIGTERM, handleSignal);
  signal(SIGINT, handleSignal);

  while (isRunning) {
    if (readCpu(&system) != EXIT_SUCCESS)
      return EXIT_FAILURE;

    if (readRam(&system) != EXIT_SUCCESS)
      return EXIT_FAILURE;

    if (readDisk(&system) != EXIT_SUCCESS)
      return EXIT_FAILURE;

    if (readUpTime(&system) != EXIT_SUCCESS)
      return EXIT_FAILURE;

    readTemperature(&system);
    readNetwork(&system);

    sendMetrics(&system);

    sleep(5);
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

  system->percCpu = total > 0 ? (double)busy / total * 100 : 0;
  fclose(statFile);
  return EXIT_SUCCESS;
}

int readRam(System *system) {
  char buffer[3][256] = {0};

  long totalMem = 0;
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
  sscanf(buffer[2], "MemAvailable: %ld kB", &availableMem);

  long usedMem = totalMem - availableMem;

  system->percRam = totalMem > 0 ? (double)usedMem / totalMem * 100 : 0;
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

  system->percDisk = total > 0 ? (double)used / total * 100 : 0;

  return EXIT_SUCCESS;
}

int readHostname(System *system) {
  if (gethostname(system->hostname, sizeof(system->hostname)) != 0) {
    return EXIT_FAILURE;
  }
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

int readTemperature(System *system) {
  FILE *file = fopen("/sys/class/thermal/thermal_zone0/temp", "r");

  if (file == NULL) {
    system->temperature = 0;
    return EXIT_FAILURE;
  }

  int temp = 0;

  if (fscanf(file, "%d", &temp) != 1) {
    fclose(file);
    system->temperature = 0;
    return EXIT_FAILURE;
  }

  system->temperature = temp / 1000.0;
  fclose(file);

  return EXIT_SUCCESS;
}

int readNetwork(System *system) {
  FILE *file = fopen("/proc/net/dev", "r");
  char buffer[256] = {0};
  char iface[32] = {0};
  long rx = 0;
  long tx = 0;

  system->networkRx = 0;
  system->networkTx = 0;

  if (file == NULL) {
    return EXIT_FAILURE;
  }

  for (int i = 0; i < 2; i++) {
    if (fgets(buffer, sizeof(buffer), file) == NULL) {
      fclose(file);
      return EXIT_FAILURE;
    }
  }

  while (fgets(buffer, sizeof(buffer), file) != NULL) {
    if (sscanf(buffer, " %31[^:]: %ld %*d %*d %*d %*d %*d %*d %*d %ld",
               iface, &rx, &tx) == 3) {
      if (strcmp(iface, "lo") != 0) {
        system->networkRx = rx;
        system->networkTx = tx;
        fclose(file);
        return EXIT_SUCCESS;
      }
    }
  }

  fclose(file);

  return EXIT_FAILURE;
}

int sendMetrics(System *system) {
  char json[1024];
  char request[2048];

  int sock = socket(AF_INET, SOCK_STREAM, 0);

  if (sock < 0) {
    return EXIT_FAILURE;
  }

  struct sockaddr_in server;

  server.sin_family = AF_INET;
  server.sin_port = htons(AGENT_PORT);

  if (inet_pton(AF_INET, AGENT_HOST, &server.sin_addr) != 1) {
    close(sock);
    return EXIT_FAILURE;
  }

  if (connect(sock, (struct sockaddr *)&server, sizeof(server)) < 0) {
    close(sock);
    return EXIT_FAILURE;
  }

  struct sockaddr_in local;
  socklen_t localLen = sizeof(local);

  if (getsockname(sock, (struct sockaddr *)&local, &localLen) == 0) {
    if (inet_ntop(AF_INET, &local.sin_addr, system->ip,
                  sizeof(system->ip)) == NULL) {
      snprintf(system->ip, sizeof(system->ip), "unknown");
    }
  } else {
    snprintf(system->ip, sizeof(system->ip), "unknown");
  }

  snprintf(json, sizeof(json),
           "{"
           "\"hostname\":\"%s\","
           "\"ip\":\"%s\","
           "\"os\":\"%s\","
           "\"cpu\":%.1f,"
           "\"ram\":%.1f,"
           "\"disk\":%.1f,"
           "\"temperature\":%.1f,"
           "\"networkRx\":%ld,"
           "\"networkTx\":%ld,"
           "\"uptime\":%.1f"
           "}",
           system->hostname, system->ip, system->Os, system->percCpu,
           system->percRam, system->percDisk, system->temperature,
           system->networkRx, system->networkTx, system->uptime);

  snprintf(request, sizeof(request),
           "POST /api/v1/agents/metrics HTTP/1.1\r\n"
           "Host: %s:%d\r\n"
           "Content-Type: application/json\r\n"
           "Content-Length: %zu\r\n"
           "Connection: close\r\n"
           "\r\n"
           "%s",
           AGENT_HOST, AGENT_PORT, strlen(json), json);

  ssize_t n = send(sock, request, strlen(request), 0);
  close(sock);

  if (n < 0) {
    return EXIT_FAILURE;
  }

  return EXIT_SUCCESS;
}

int daemonize(void) {
  pid_t pid;

  pid = fork();

  if (pid < 0) {
    perror("fork");
    return EXIT_FAILURE;
  }

  if (pid > 0) {
    exit(EXIT_SUCCESS);
  }

  if (setsid() < 0) {
    perror("setsid");
    return EXIT_FAILURE;
  }

  pid = fork();

  if (pid < 0) {
    perror("fork");
    return EXIT_FAILURE;
  }

  if (pid > 0) {
    exit(EXIT_SUCCESS);
  }

  if (chdir("/") != 0) {
    perror("chdir");
    return EXIT_FAILURE;
  }

  umask(0);

  int fd = open("/dev/null", O_RDWR);

  if (fd < 0) {
    perror("open");
    return EXIT_FAILURE;
  }

  if (dup2(fd, STDIN_FILENO) < 0 || dup2(fd, STDOUT_FILENO) < 0 ||
      dup2(fd, STDERR_FILENO) < 0) {
    perror("dup2");
    close(fd);
    return EXIT_FAILURE;
  }

  if (fd > STDERR_FILENO)
    close(fd);

  return EXIT_SUCCESS;
}
