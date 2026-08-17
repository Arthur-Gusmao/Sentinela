package com.sentinela.Sentinela.dto;

import com.sentinela.Sentinela.entity.AlertSeverity;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AlertResponse {
    private Long id;
    private Long serverId;
    private String hostname;
    private String type;
    private AlertSeverity severity;
    private String message;
    private boolean resolved;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
}