package com.sentinela.Sentinela.service;

import com.sentinela.Sentinela.entity.Alert;
import com.sentinela.Sentinela.entity.Metric;
import com.sentinela.Sentinela.entity.Server;
import com.sentinela.Sentinela.repository.AlertRepository;
import com.sentinela.Sentinela.repository.MetricRepository;
import com.sentinela.Sentinela.repository.ServerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ServerService {

    private final ServerRepository serverRepository;
    private final MetricRepository metricRepository;
    private final AlertRepository alertRepository;

    public List<Server> findAll() {
        return serverRepository.findAll();
    }

    public Server findById(Long id) {
        return serverRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Server not found: " + id));
    }

    public List<Metric> findMetrics(Long id) {
        return metricRepository.findByServerIdOrderByCreatedAtDesc(id);
    }

    public List<Alert> findActiveAlerts(Long id) {
        return alertRepository.findByServerIdAndResolvedFalse(id);
    }

    public List<Alert> findAllActiveAlerts() {
        return alertRepository.findByResolvedFalse();
    }
}