package com.sentinela.Sentinela.service;

import com.sentinela.Sentinela.dto.AlertResponse;
import com.sentinela.Sentinela.dto.MetricResponse;
import com.sentinela.Sentinela.dto.ServerResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public void sendMetricUpdate(MetricResponse metric) {
        messagingTemplate.convertAndSend("/topic/metrics", metric);
        messagingTemplate.convertAndSend("/topic/metrics/" + metric.getServerId(), metric);
    }

    public void sendAlertUpdate(AlertResponse alert) {
        messagingTemplate.convertAndSend("/topic/alerts", alert);
    }

    public void sendServerUpdate(ServerResponse server) {
        messagingTemplate.convertAndSend("/topic/servers", server);
    }
}