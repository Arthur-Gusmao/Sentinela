package com.sentinela.Sentinela.service;

import com.sentinela.Sentinela.dto.AlertResponse;
import com.sentinela.Sentinela.dto.MetricResponse;
import com.sentinela.Sentinela.dto.ServerResponse;
import com.sentinela.Sentinela.entity.Alert;
import com.sentinela.Sentinela.mapper.SentinelaMapper;
import com.sentinela.Sentinela.entity.Server;
import com.sentinela.Sentinela.repository.AlertRepository;
import com.sentinela.Sentinela.repository.MetricRepository;
import com.sentinela.Sentinela.repository.ServerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ServerService {

    private final ServerRepository serverRepository;
    private final MetricRepository metricRepository;
    private final AlertRepository alertRepository;
    private final SentinelaMapper mapper;

    public List<ServerResponse> findAll() {
        return serverRepository.findAll()
                .stream()
                .map(mapper::toServerResponse)
                .toList();
    }

    public ServerResponse findById(Long id) {
        Server server = serverRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Server not found: " + id));
        return mapper.toServerResponse(server);
    }

    public List<MetricResponse> findMetrics(Long id) {
        return metricRepository.findByServerIdOrderByCreatedAtDesc(id)
                .stream()
                .map(mapper::toMetricResponse)
                .toList();
    }

    public List<AlertResponse> findActiveAlerts(Long id) {
        return alertRepository.findByServerIdAndResolvedFalse(id)
                .stream()
                .map(mapper::toAlertResponse)
                .toList();
    }

    public List<AlertResponse> findAllActiveAlerts() {
        return alertRepository.findByResolvedFalse()
                .stream()
                .map(mapper::toAlertResponse)
                .toList();
    }

    public AlertResponse resolveAlert(Long id) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alert not found: " + id));

        alert.setResolved(true);
        alert.setResolvedAt(LocalDateTime.now());
        alertRepository.save(alert);

        return mapper.toAlertResponse(alert);
    }
}