package com.sentinela.Sentinela.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "servers")
public class Server {

    @Id
    @GeneratedValue
    private Long id;

    @Column(unique = true)
    private String hostname;

    private String ip;

    private String operatingSystem;

    @Enumerated(EnumType.STRING)
    private ServerStatus status = ServerStatus.ONLINE;

    private LocalDateTime createdAt;

    private LocalDateTime lastSeen;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.lastSeen = LocalDateTime.now();
    }
}
