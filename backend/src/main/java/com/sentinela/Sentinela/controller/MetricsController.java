package com.sentinela.Sentinela.controller;

import com.sentinela.Sentinela.MonitoringService;
import com.sentinela.Sentinela.dto.MetricsRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class MetricsController {
    private final MonitoringService monitoringService;

    @PostMapping("/agents/metrics")
    public ResponseEntity<Void> receiveMetric(@Valid @RequestBody MetricsRequest request) {
        log.info("Metrics received from: {}", request.getHostname());
        monitoringService.process(request);
        return ResponseEntity.ok().build();
    }
}
