package org.example.oficinainacioadriano.service;

import lombok.RequiredArgsConstructor;
import org.example.oficinainacioadriano.dto.mapper.EntityMapper;
import org.example.oficinainacioadriano.dto.request.EspecialidadeRequest;
import org.example.oficinainacioadriano.dto.response.EspecialidadeResponse;
import org.example.oficinainacioadriano.entity.Especialidade;
import org.example.oficinainacioadriano.exception.ResourceNotFoundException;
import org.example.oficinainacioadriano.repository.EspecialidadeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EspecialidadeService {

    private final EspecialidadeRepository repository;
    private final EntityMapper mapper;

    @Transactional(readOnly = true)
    public List<EspecialidadeResponse> findAll() {
        return repository.findAll().stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public EspecialidadeResponse findById(Long id) {
        return mapper.toResponse(repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Especialidade", id)));
    }

    @Transactional
    public EspecialidadeResponse create(EspecialidadeRequest request) {
        Especialidade entity = Especialidade.builder().nome(request.nome()).build();
        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public EspecialidadeResponse update(Long id, EspecialidadeRequest request) {
        Especialidade entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Especialidade", id));
        entity.setNome(request.nome());
        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id))
            throw new ResourceNotFoundException("Especialidade", id);
        repository.deleteById(id);
    }
}
