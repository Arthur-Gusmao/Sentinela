package com.sentinela.Sentinela;

import com.sentinela.Sentinela.dto.MetricsRequest;
import com.sentinela.Sentinela.entity.*;
import com.sentinela.Sentinela.repository.AlertRepository;
import com.sentinela.Sentinela.repository.MetricRepository;
import com.sentinela.Sentinela.repository.ServerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class MonitoringService {
    private final AlertRepository alertRepository;
    private final MetricRepository metricRepository;
    private final ServerRepository serverRepository;

    public void process(MetricsRequest request) {
        Server server = registerOrUpdateServer(request);
        saveMetric(server, request);
        checkAlerts(server, request);
    }

    private Server registerOrUpdateServer(MetricsRequest request) {
        Server server = serverRepository.findByHostname(request.getHostname())
                .orElse(new Server());

        server.setHostname(request.getHostname());
        server.setIp(request.getIp());
        server.setOperationSystem(request.getOperatingSystem());
        server.setStatus(ServerStatus.ONLINE);
        server.setLastSeen(LocalDateTime.now());

        return serverRepository.save(server);
    }

    private void saveMetric(Server server, MetricsRequest request) {
        Metric metric = new Metric();
        metric.setServer(server);
        metric.setCpuUsage(request.getCpu());
        metric.setRamUsage(request.getRam());
        metric.setDiskUsage(request.getDisk());
        metric.setTemperature(request.getTemperature());
        metric.setNetworkRx(request.getNetworkRx());
        metric.setNetworkTx(request.getNetworkTx());

        metricRepository.save(metric);
    }

    private void checkAlerts(Server server, MetricsRequest request) {
        if (request.getCpu() > 90) {
            createAlert(server, "CPU", AlertSeverity.CRITICAL,
                    "CPU usage above 90%" + request.getCpu() + "%");
        }

        if (request.getRam() > 85) {
            createAlert(server, "RAM", AlertSeverity.WARNING,
                    "RAM usage above 85%" + request.getRam() + "%");
        }

        if (request.getDisk() > 90) {
            createAlert(server, "DISK", AlertSeverity.CRITICAL,
                    "Disk usage above 90%" + request.getDisk() + "%");
        }

        if (request.getTemperature() != null && request.getTemperature() > 80) {
            createAlert(server, "TEMPERATURE", AlertSeverity.CRITICAL,
                    "Temperatura above 80°C" + request.getTemperature() + "°C");
        }
    }

    private void createAlert(Server server, String type, AlertSeverity severity, String message) {
        log.warn("ALERT - {}: {}", server.getHostname(), message);

        Alert alert = new Alert();
        alert.setServer(server);
        alert.setType(type);
        alert.setMessage(message);
        alert.setSeverity(severity);

        alertRepository.save(alert);
    }
}
