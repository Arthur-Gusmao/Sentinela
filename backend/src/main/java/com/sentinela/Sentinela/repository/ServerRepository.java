package com.sentinela.Sentinela.repository;

import com.sentinela.Sentinela.entity.Server;
import com.sentinela.Sentinela.entity.ServerStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ServerRepository extends JpaRepository<Server, Long> {
    Optional<Server> findByHostname(String hostname);
    List<Server> findByStatus(ServerStatus status);
    List<Server> findByLastSeenBefore(LocalDateTime dateTime);
}


