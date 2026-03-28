package org.example.oficinainacioadriano.service;

import lombok.RequiredArgsConstructor;
import org.example.oficinainacioadriano.dto.mapper.EntityMapper;
import org.example.oficinainacioadriano.dto.request.ModeloRequest;
import org.example.oficinainacioadriano.dto.response.ModeloResponse;
import org.example.oficinainacioadriano.entity.Modelo;
import org.example.oficinainacioadriano.exception.ResourceNotFoundException;
import org.example.oficinainacioadriano.repository.ModeloRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ModeloService {

    private final ModeloRepository repository;
    private final EntityMapper mapper;

    @Transactional(readOnly = true)
    public List<ModeloResponse> findAll() {
        return repository.findAll().stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ModeloResponse findById(Long id) {
        return mapper.toResponse(repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Modelo", id)));
    }

    @Transactional
    public ModeloResponse create(ModeloRequest request) {
        Modelo entity = Modelo.builder().nome(request.nome()).build();
        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public ModeloResponse update(Long id, ModeloRequest request) {
        Modelo entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Modelo", id));
        entity.setNome(request.nome());
        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id))
            throw new ResourceNotFoundException("Modelo", id);
        repository.deleteById(id);
    }
}
