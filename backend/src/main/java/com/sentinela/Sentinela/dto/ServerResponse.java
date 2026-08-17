package com.sentinela.Sentinela.dto;

import com.sentinela.Sentinela.entity.ServerStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ServerResponse {
    private Long id;
    private String hostname;
    private String ip;
    private String operatingSystem;
    private ServerStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime lastSeen;
}
