package com.sentinela.Sentinela.controller;

import com.sentinela.Sentinela.dto.AlertResponse;
import com.sentinela.Sentinela.dto.MetricResponse;
import com.sentinela.Sentinela.dto.ServerResponse;
import com.sentinela.Sentinela.service.ServerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ServerController {

    private final ServerService serverService;

    @GetMapping("/servers")
    public ResponseEntity<List<ServerResponse>> findAll() {
        return ResponseEntity.ok(serverService.findAll());
    }

    @GetMapping("/servers/{id}")
    public ResponseEntity<ServerResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(serverService.findById(id));
    }

    @GetMapping("/servers/{id}/metrics")
    public ResponseEntity<List<MetricResponse>> findMetrics(@PathVariable Long id) {
        return ResponseEntity.ok(serverService.findMetrics(id));
    }

    @GetMapping("/servers/{id}/alerts")
    public ResponseEntity<List<AlertResponse>> findAlerts(@PathVariable Long id) {
        return ResponseEntity.ok(serverService.findActiveAlerts(id));
    }

    @GetMapping("/alerts")
    public ResponseEntity<List<AlertResponse>> findAllAlerts() {
        return ResponseEntity.ok(serverService.findAllActiveAlerts());
    }
}