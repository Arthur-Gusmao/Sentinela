package com.sentinela.Sentinela.mapper;

import com.sentinela.Sentinela.dto.AlertResponse;
import com.sentinela.Sentinela.dto.MetricResponse;
import com.sentinela.Sentinela.dto.ServerResponse;
import com.sentinela.Sentinela.entity.Alert;
import com.sentinela.Sentinela.entity.Metric;
import com.sentinela.Sentinela.entity.Server;
import org.springframework.stereotype.Component;

@Component
public class SentinelaMapper {

    public ServerResponse toServerResponse(Server server) {
        ServerResponse response = new ServerResponse();
        response.setId(server.getId());
        response.setHostname(server.getHostname());
        response.setIp(server.getIp());
        response.setOperatingSystem(server.getOperatingSystem());
        response.setStatus(server.getStatus());
        response.setCreatedAt(server.getCreatedAt());
        response.setLastSeen(server.getLastSeen());
        return response;
    }

    public MetricResponse toMetricResponse(Metric metric) {
        MetricResponse response = new MetricResponse();
        response.setId(metric.getId());
        response.setServerId(metric.getServer().getId());
        response.setHostname(metric.getServer().getHostname());
        response.setCpuUsage(metric.getCpuUsage());
        response.setRamUsage(metric.getRamUsage());
        response.setDiskUsage(metric.getDiskUsage());
        response.setTemperature(metric.getTemperature());
        response.setNetworkRx(metric.getNetworkRx());
        response.setNetworkTx(metric.getNetworkTx());
        response.setCreatedAt(metric.getCreatedAt());
        return response;
    }

    public AlertResponse toAlertResponse(Alert alert) {
        AlertResponse response = new AlertResponse();
        response.setId(alert.getId());
        response.setServerId(alert.getServer().getId());
        response.setHostname(alert.getServer().getHostname());
        response.setType(alert.getType());
        response.setSeverity(alert.getSeverity());
        response.setMessage(alert.getMessage());
        response.setResolved(alert.isResolved());
        response.setCreatedAt(alert.getCreatedAt());
        response.setResolvedAt(alert.getResolvedAt());
        return response;
    }
}