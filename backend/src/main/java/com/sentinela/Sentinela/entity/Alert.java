package com.sentinela.Sentinela.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "alerts")
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "server_id", nullable = false)
    private Server server;

    private String type;

    @Enumerated(EnumType.STRING)
    private AlertSeverity severity;

    private String message;
    private boolean resolved = false;

    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
