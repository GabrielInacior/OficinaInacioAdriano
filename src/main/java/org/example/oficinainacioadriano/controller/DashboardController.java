package org.example.oficinainacioadriano.controller;

import org.example.oficinainacioadriano.dto.response.DashboardGraficosResponse;
import org.example.oficinainacioadriano.dto.response.DashboardResumoResponse;
import org.example.oficinainacioadriano.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/resumo")
    public ResponseEntity<DashboardResumoResponse> getResumo() {
        return ResponseEntity.ok(dashboardService.getResumo());
    }

    @GetMapping("/graficos")
    public ResponseEntity<DashboardGraficosResponse> getGraficos() {
        return ResponseEntity.ok(dashboardService.getGraficos());
    }
}
