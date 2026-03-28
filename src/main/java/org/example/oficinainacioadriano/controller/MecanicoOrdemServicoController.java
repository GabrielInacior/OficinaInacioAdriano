package org.example.oficinainacioadriano.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.oficinainacioadriano.dto.request.MecanicoOrdemServicoRequest;
import org.example.oficinainacioadriano.dto.response.MecanicoOrdemServicoResponse;
import org.example.oficinainacioadriano.service.MecanicoOrdemServicoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mecanicos-os")
@RequiredArgsConstructor
public class MecanicoOrdemServicoController {

    private final MecanicoOrdemServicoService service;

    @GetMapping("/ordem/{codOrdem}")
    public ResponseEntity<List<MecanicoOrdemServicoResponse>> findByOrdem(@PathVariable Long codOrdem) {
        return ResponseEntity.ok(service.findByOrdem(codOrdem));
    }

    @PostMapping
    public ResponseEntity<MecanicoOrdemServicoResponse> create(
            @Valid @RequestBody MecanicoOrdemServicoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @DeleteMapping("/{codMecanico}/{codOrdem}")
    public ResponseEntity<Void> delete(@PathVariable Long codMecanico, @PathVariable Long codOrdem) {
        service.delete(codMecanico, codOrdem);
        return ResponseEntity.noContent().build();
    }
}
