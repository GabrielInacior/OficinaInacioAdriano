package org.example.oficinainacioadriano.service;

import lombok.RequiredArgsConstructor;
import org.example.oficinainacioadriano.dto.mapper.EntityMapper;
import org.example.oficinainacioadriano.dto.request.CidadeRequest;
import org.example.oficinainacioadriano.dto.response.CidadeResponse;
import org.example.oficinainacioadriano.entity.Cidade;
import org.example.oficinainacioadriano.exception.ResourceNotFoundException;
import org.example.oficinainacioadriano.repository.CidadeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CidadeService {

    private final CidadeRepository repository;
    private final EntityMapper mapper;

    @Transactional(readOnly = true)
    public List<CidadeResponse> findAll() {
        return repository.findAll().stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public CidadeResponse findById(Long id) {
        return mapper.toResponse(repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cidade", id)));
    }

    @Transactional
    public CidadeResponse create(CidadeRequest request) {
        Cidade entity = Cidade.builder().nome(request.nome()).uf(request.uf()).build();
        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public CidadeResponse update(Long id, CidadeRequest request) {
        Cidade entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cidade", id));
        entity.setNome(request.nome());
        entity.setUf(request.uf());
        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id))
            throw new ResourceNotFoundException("Cidade", id);
        repository.deleteById(id);
    }
}
