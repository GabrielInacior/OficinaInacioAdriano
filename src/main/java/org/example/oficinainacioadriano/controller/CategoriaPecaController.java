package org.example.oficinainacioadriano.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.oficinainacioadriano.dto.request.CategoriaPecaRequest;
import org.example.oficinainacioadriano.dto.response.CategoriaPecaResponse;
import org.example.oficinainacioadriano.service.CategoriaPecaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categorias-pecas")
@RequiredArgsConstructor
public class CategoriaPecaController {

    private final CategoriaPecaService service;

    @GetMapping
    public ResponseEntity<List<CategoriaPecaResponse>> findAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoriaPecaResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<CategoriaPecaResponse> create(@Valid @RequestBody CategoriaPecaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoriaPecaResponse> update(@PathVariable Long id,
            @Valid @RequestBody CategoriaPecaRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
