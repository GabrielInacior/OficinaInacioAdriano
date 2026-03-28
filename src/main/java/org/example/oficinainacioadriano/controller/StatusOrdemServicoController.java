package org.example.oficinainacioadriano.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.oficinainacioadriano.dto.request.StatusOrdemServicoRequest;
import org.example.oficinainacioadriano.dto.response.StatusOrdemServicoResponse;
import org.example.oficinainacioadriano.service.StatusOrdemServicoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/status")
@RequiredArgsConstructor
public class StatusOrdemServicoController {

    private final StatusOrdemServicoService service;

    @GetMapping
    public ResponseEntity<List<StatusOrdemServicoResponse>> findAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<StatusOrdemServicoResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<StatusOrdemServicoResponse> create(@Valid @RequestBody StatusOrdemServicoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StatusOrdemServicoResponse> update(@PathVariable Long id,
            @Valid @RequestBody StatusOrdemServicoRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
