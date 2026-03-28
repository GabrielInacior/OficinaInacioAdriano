package org.example.oficinainacioadriano.service;

import lombok.RequiredArgsConstructor;
import org.example.oficinainacioadriano.dto.mapper.EntityMapper;
import org.example.oficinainacioadriano.dto.request.CategoriaPecaRequest;
import org.example.oficinainacioadriano.dto.response.CategoriaPecaResponse;
import org.example.oficinainacioadriano.entity.CategoriaPeca;
import org.example.oficinainacioadriano.exception.ResourceNotFoundException;
import org.example.oficinainacioadriano.repository.CategoriaPecaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoriaPecaService {

    private final CategoriaPecaRepository repository;
    private final EntityMapper mapper;

    @Transactional(readOnly = true)
    public List<CategoriaPecaResponse> findAll() {
        return repository.findAll().stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public CategoriaPecaResponse findById(Long id) {
        return mapper.toResponse(repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria de Peça", id)));
    }

    @Transactional
    public CategoriaPecaResponse create(CategoriaPecaRequest request) {
        CategoriaPeca entity = CategoriaPeca.builder().nome(request.nome()).build();
        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public CategoriaPecaResponse update(Long id, CategoriaPecaRequest request) {
        CategoriaPeca entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria de Peça", id));
        entity.setNome(request.nome());
        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id))
            throw new ResourceNotFoundException("Categoria de Peça", id);
        repository.deleteById(id);
    }
}
