package com.sentinela.Sentinela.dto;

import com.sentinela.Sentinela.entity.ServerStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MetricResponse {
    private Long id;
    private Long serverId;
    private String hostname;
    private Double cpuUsage;
    private Double ramUsage;
    private Double diskUsage;
    private Double temperature;
    private Long networkRx;
    private Long networkTx;
    private LocalDateTime createdAt;
}
