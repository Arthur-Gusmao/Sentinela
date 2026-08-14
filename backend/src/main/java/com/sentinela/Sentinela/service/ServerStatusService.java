package com.sentinela.Sentinela.service;

import com.sentinela.Sentinela.entity.Server;
import com.sentinela.Sentinela.entity.ServerStatus;
import com.sentinela.Sentinela.repository.AlertRepository;
import com.sentinela.Sentinela.repository.ServerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ServerStatusService {

    private final ServerRepository serverRepository;
    private final AlertRepository alertRepository;

    @Scheduled(fixedDelay = 3000)
    public void checkOfflineServers() {
        LocalDateTime threshold = LocalDateTime.now().minusSeconds(60);

        List<Server> offlineServers = serverRepository.findByLastSeenBefore(threshold);

        for (Server server: offlineServers) {
            if (server.getStatus() != ServerStatus.OFFLINE) {

            }
        }
    }
}
