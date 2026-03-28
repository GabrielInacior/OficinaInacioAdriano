package org.example.oficinainacioadriano.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.oficinainacioadriano.dto.request.FormaPagamentoRequest;
import org.example.oficinainacioadriano.dto.response.FormaPagamentoResponse;
import org.example.oficinainacioadriano.service.FormaPagamentoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/formas-pagamento")
@RequiredArgsConstructor
public class FormaPagamentoController {

    private final FormaPagamentoService service;

    @GetMapping
    public ResponseEntity<List<FormaPagamentoResponse>> findAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FormaPagamentoResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<FormaPagamentoResponse> create(@Valid @RequestBody FormaPagamentoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FormaPagamentoResponse> update(@PathVariable Long id,
            @Valid @RequestBody FormaPagamentoRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
