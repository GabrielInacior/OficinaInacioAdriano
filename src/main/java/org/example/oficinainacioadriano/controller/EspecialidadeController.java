package org.example.oficinainacioadriano.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.oficinainacioadriano.dto.request.EspecialidadeRequest;
import org.example.oficinainacioadriano.dto.response.EspecialidadeResponse;
import org.example.oficinainacioadriano.service.EspecialidadeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/especialidades")
@RequiredArgsConstructor
public class EspecialidadeController {

    private final EspecialidadeService service;

    @GetMapping
    public ResponseEntity<List<EspecialidadeResponse>> findAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EspecialidadeResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<EspecialidadeResponse> create(@Valid @RequestBody EspecialidadeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EspecialidadeResponse> update(@PathVariable Long id,
            @Valid @RequestBody EspecialidadeRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
