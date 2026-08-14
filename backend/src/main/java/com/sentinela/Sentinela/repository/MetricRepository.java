package com.sentinela.Sentinela.repository;

import com.sentinela.Sentinela.entity.Metric;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface MetricRepository extends JpaRepository<Metric, Long> {
    List<Metric> findByServerIdOrderByCreatedAtDesc(Long serverId);
    List<Metric> findByServerIdAndCreatedAtAfter(Long serverId, LocalDateTime after);
}