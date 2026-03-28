package org.example.oficinainacioadriano.service;

import lombok.RequiredArgsConstructor;
import org.example.oficinainacioadriano.dto.mapper.EntityMapper;
import org.example.oficinainacioadriano.dto.request.MecanicoRequest;
import org.example.oficinainacioadriano.dto.response.MecanicoResponse;
import org.example.oficinainacioadriano.entity.Mecanico;
import org.example.oficinainacioadriano.exception.ResourceNotFoundException;
import org.example.oficinainacioadriano.repository.EspecialidadeRepository;
import org.example.oficinainacioadriano.repository.MecanicoRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MecanicoService {

    private final MecanicoRepository repository;
    private final EspecialidadeRepository especialidadeRepository;
    private final EntityMapper mapper;

    @Transactional(readOnly = true)
    public Page<MecanicoResponse> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toResponse);
    }

    @Transactional(readOnly = true)
    public MecanicoResponse findById(Long id) {
        return mapper.toResponse(repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mecânico", id)));
    }

    @Transactional
    public MecanicoResponse create(MecanicoRequest request) {
        Mecanico entity = Mecanico.builder()
                .nome(request.nome())
                .especialidade(especialidadeRepository.findById(request.codEspecialidade())
                        .orElseThrow(() -> new ResourceNotFoundException("Especialidade", request.codEspecialidade())))
                .comissaoPercentual(request.comissaoPercentual())
                .build();
        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public MecanicoResponse update(Long id, MecanicoRequest request) {
        Mecanico entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mecânico", id));
        entity.setNome(request.nome());
        entity.setEspecialidade(especialidadeRepository.findById(request.codEspecialidade())
                .orElseThrow(() -> new ResourceNotFoundException("Especialidade", request.codEspecialidade())));
        entity.setComissaoPercentual(request.comissaoPercentual());
        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id))
            throw new ResourceNotFoundException("Mecânico", id);
        repository.deleteById(id);
    }
}
