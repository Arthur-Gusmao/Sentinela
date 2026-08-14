package com.sentinela.Sentinela.controller;

import com.sentinela.Sentinela.entity.Alert;
import com.sentinela.Sentinela.entity.Metric;
import com.sentinela.Sentinela.entity.Server;
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
    public ResponseEntity<List<Server>> findAll() {
        return ResponseEntity.ok(serverService.findAll());
    }

    @GetMapping("/servers/{id}")
    public ResponseEntity<Server> findById(@PathVariable Long id) {
        return ResponseEntity.ok(serverService.findById(id));
    }

    @GetMapping("/servers/{id}/metrics")
    public ResponseEntity<List<Metric>> findMetrics(@PathVariable Long id) {
        return ResponseEntity.ok(serverService.findMetrics(id));
    }

    @GetMapping("/servers/{id}/alerts")
    public ResponseEntity<List<Alert>> findAlerts(@PathVariable Long id) {
        return ResponseEntity.ok(serverService.findActiveAlerts(id));
    }

    @GetMapping("/alerts")
    public ResponseEntity<List<Alert>> findAllAlerts() {
        return ResponseEntity.ok(serverService.findAllActiveAlerts());
    }
}