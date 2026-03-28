package org.example.oficinainacioadriano.service;

import lombok.RequiredArgsConstructor;
import org.example.oficinainacioadriano.dto.mapper.EntityMapper;
import org.example.oficinainacioadriano.dto.request.OrdemServicoRequest;
import org.example.oficinainacioadriano.dto.response.OrdemServicoResponse;
import org.example.oficinainacioadriano.entity.OrdemServico;
import org.example.oficinainacioadriano.exception.ResourceNotFoundException;
import org.example.oficinainacioadriano.repository.OrdemServicoRepository;
import org.example.oficinainacioadriano.repository.StatusOrdemServicoRepository;
import org.example.oficinainacioadriano.repository.VeiculoRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class OrdemServicoService {

    private final OrdemServicoRepository repository;
    private final VeiculoRepository veiculoRepository;
    private final StatusOrdemServicoRepository statusRepository;
    private final EntityMapper mapper;

    @Transactional(readOnly = true)
    public Page<OrdemServicoResponse> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toResponse);
    }

    @Transactional(readOnly = true)
    public OrdemServicoResponse findById(Long id) {
        return mapper.toResponse(repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ordem de Serviço", id)));
    }

    @Transactional
    public OrdemServicoResponse create(OrdemServicoRequest request) {
        OrdemServico entity = OrdemServico.builder()
                .dataEntrada(request.dataEntrada() != null ? request.dataEntrada() : LocalDate.now())
                .kmAtual(request.kmAtual())
                .veiculo(veiculoRepository.findById(request.codVeiculo())
                        .orElseThrow(() -> new ResourceNotFoundException("Veículo", request.codVeiculo())))
                .status(statusRepository.findById(request.codStatus())
                        .orElseThrow(() -> new ResourceNotFoundException("Status", request.codStatus())))
                .build();
        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public OrdemServicoResponse update(Long id, OrdemServicoRequest request) {
        OrdemServico entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ordem de Serviço", id));
        entity.setDataEntrada(request.dataEntrada() != null ? request.dataEntrada() : entity.getDataEntrada());
        entity.setKmAtual(request.kmAtual());
        entity.setVeiculo(veiculoRepository.findById(request.codVeiculo())
                .orElseThrow(() -> new ResourceNotFoundException("Veículo", request.codVeiculo())));
        entity.setStatus(statusRepository.findById(request.codStatus())
                .orElseThrow(() -> new ResourceNotFoundException("Status", request.codStatus())));
        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id))
            throw new ResourceNotFoundException("Ordem de Serviço", id);
        repository.deleteById(id);
    }
}
