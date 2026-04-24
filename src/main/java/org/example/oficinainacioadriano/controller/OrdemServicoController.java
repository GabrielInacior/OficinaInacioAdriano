package org.example.oficinainacioadriano.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.oficinainacioadriano.dto.request.AtualizarStatusOSRequest;
import org.example.oficinainacioadriano.dto.request.OrdemServicoRequest;
import org.example.oficinainacioadriano.dto.response.OrdemServicoDetalheResponse;
import org.example.oficinainacioadriano.dto.response.OrdemServicoResponse;
import org.example.oficinainacioadriano.service.OrdemServicoService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ordens-servico")
@RequiredArgsConstructor
public class OrdemServicoController {

    private final OrdemServicoService service;

    @GetMapping
    public ResponseEntity<Page<OrdemServicoResponse>> findAll(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrdemServicoResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping("/{id}/detalhe")
    public ResponseEntity<OrdemServicoDetalheResponse> findDetalhe(@PathVariable Long id) {
        return ResponseEntity.ok(service.findDetalheById(id));
    }

    @PostMapping
    public ResponseEntity<OrdemServicoResponse> create(@Valid @RequestBody OrdemServicoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrdemServicoResponse> update(@PathVariable Long id,
            @Valid @RequestBody OrdemServicoRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<OrdemServicoResponse> atualizarStatus(
            @PathVariable Long id,
            @Valid @RequestBody AtualizarStatusOSRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(service.atualizarStatus(id, request, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
