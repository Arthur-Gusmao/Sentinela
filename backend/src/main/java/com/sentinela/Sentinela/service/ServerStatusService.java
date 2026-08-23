package com.sentinela.Sentinela.service;

import com.sentinela.Sentinela.entity.Alert;
import com.sentinela.Sentinela.entity.AlertSeverity;
import com.sentinela.Sentinela.entity.Server;
import com.sentinela.Sentinela.entity.ServerStatus;
import com.sentinela.Sentinela.mapper.SentinelaMapper;
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
    private final SentinelaMapper mapper;
    private final WebSocketService webSocketService;

    @Scheduled(fixedDelay = 30000)
    public void checkOfflineServers() {
        LocalDateTime threshold = LocalDateTime.now().minusSeconds(60);
        List<Server> offlineServers = serverRepository.findByLastSeenBefore(threshold);

        for (Server server : offlineServers) {
            if (server.getStatus() != ServerStatus.OFFLINE) {
                log.warn("Server offline detected: {}", server.getHostname());

                server.setStatus(ServerStatus.OFFLINE);
                serverRepository.save(server);

                Alert alert = createOfflineAlert(server);
                webSocketService.sendAlertUpdate(mapper.toAlertResponse(alert));
                webSocketService.sendServerUpdate(mapper.toServerResponse(server));
            }
        }
    }

    private Alert createOfflineAlert(Server server) {
        Alert alert = new Alert();
        alert.setServer(server);
        alert.setType("OFFLINE");
        alert.setSeverity(AlertSeverity.CRITICAL);
        alert.setMessage("Server " + server.getHostname() + " is offline");
        return alertRepository.save(alert);
    }
}