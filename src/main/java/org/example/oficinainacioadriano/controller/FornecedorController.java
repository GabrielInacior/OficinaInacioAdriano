package org.example.oficinainacioadriano.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.oficinainacioadriano.dto.request.FornecedorRequest;
import org.example.oficinainacioadriano.dto.response.FornecedorResponse;
import org.example.oficinainacioadriano.service.FornecedorService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/fornecedores")
@RequiredArgsConstructor
public class FornecedorController {

    private final FornecedorService service;

    @GetMapping
    public ResponseEntity<Page<FornecedorResponse>> findAll(@RequestParam(required = false) String razaoSocial,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(service.findAll(razaoSocial, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FornecedorResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<FornecedorResponse> create(@Valid @RequestBody FornecedorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FornecedorResponse> update(@PathVariable Long id,
            @Valid @RequestBody FornecedorRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
