package org.example.oficinainacioadriano.service;

import lombok.RequiredArgsConstructor;
import org.example.oficinainacioadriano.dto.mapper.EntityMapper;
import org.example.oficinainacioadriano.dto.request.StatusOrdemServicoRequest;
import org.example.oficinainacioadriano.dto.response.StatusOrdemServicoResponse;
import org.example.oficinainacioadriano.entity.StatusOrdemServico;
import org.example.oficinainacioadriano.exception.ResourceNotFoundException;
import org.example.oficinainacioadriano.repository.StatusOrdemServicoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StatusOrdemServicoService {

    private final StatusOrdemServicoRepository repository;
    private final EntityMapper mapper;

    @Transactional(readOnly = true)
    public List<StatusOrdemServicoResponse> findAll() {
        return repository.findAll().stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public StatusOrdemServicoResponse findById(Long id) {
        return mapper.toResponse(repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Status", id)));
    }

    @Transactional
    public StatusOrdemServicoResponse create(StatusOrdemServicoRequest request) {
        StatusOrdemServico entity = StatusOrdemServico.builder().descricao(request.descricao()).build();
        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public StatusOrdemServicoResponse update(Long id, StatusOrdemServicoRequest request) {
        StatusOrdemServico entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Status", id));
        entity.setDescricao(request.descricao());
        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id))
            throw new ResourceNotFoundException("Status", id);
        repository.deleteById(id);
    }
}
