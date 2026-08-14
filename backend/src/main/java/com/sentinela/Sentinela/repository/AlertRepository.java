package com.sentinela.Sentinela.repository;

import com.sentinela.Sentinela.entity.Alert;
import com.sentinela.Sentinela.entity.Metric;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByServerIdAndResolvedFalse(Long serverId);
    List<Alert> findByResolvedFalse();
}
