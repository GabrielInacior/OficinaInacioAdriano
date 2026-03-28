package org.example.oficinainacioadriano.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.oficinainacioadriano.dto.request.PecaOrdemServicoRequest;
import org.example.oficinainacioadriano.dto.response.PecaOrdemServicoResponse;
import org.example.oficinainacioadriano.service.PecaOrdemServicoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pecas-os")
@RequiredArgsConstructor
public class PecaOrdemServicoController {

    private final PecaOrdemServicoService service;

    @GetMapping("/ordem/{codOrdem}")
    public ResponseEntity<List<PecaOrdemServicoResponse>> findByOrdem(@PathVariable Long codOrdem) {
        return ResponseEntity.ok(service.findByOrdem(codOrdem));
    }

    @PostMapping
    public ResponseEntity<PecaOrdemServicoResponse> create(@Valid @RequestBody PecaOrdemServicoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @DeleteMapping("/{codOrdem}/{codPeca}")
    public ResponseEntity<Void> delete(@PathVariable Long codOrdem, @PathVariable Long codPeca) {
        service.delete(codOrdem, codPeca);
        return ResponseEntity.noContent().build();
    }
}
