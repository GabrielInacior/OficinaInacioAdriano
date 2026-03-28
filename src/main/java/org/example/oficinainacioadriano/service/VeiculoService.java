package org.example.oficinainacioadriano.service;

import lombok.RequiredArgsConstructor;
import org.example.oficinainacioadriano.dto.mapper.EntityMapper;
import org.example.oficinainacioadriano.dto.request.VeiculoRequest;
import org.example.oficinainacioadriano.dto.response.VeiculoResponse;
import org.example.oficinainacioadriano.entity.Veiculo;
import org.example.oficinainacioadriano.exception.DuplicateResourceException;
import org.example.oficinainacioadriano.exception.ResourceNotFoundException;
import org.example.oficinainacioadriano.repository.ClienteRepository;
import org.example.oficinainacioadriano.repository.ModeloRepository;
import org.example.oficinainacioadriano.repository.VeiculoRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class VeiculoService {

    private final VeiculoRepository repository;
    private final ClienteRepository clienteRepository;
    private final ModeloRepository modeloRepository;
    private final EntityMapper mapper;

    @Transactional(readOnly = true)
    public Page<VeiculoResponse> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toResponse);
    }

    @Transactional(readOnly = true)
    public VeiculoResponse findById(Long id) {
        return mapper.toResponse(repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Veículo", id)));
    }

    @Transactional
    public VeiculoResponse create(VeiculoRequest request) {
        if (repository.existsByPlaca(request.placa())) {
            throw new DuplicateResourceException("Placa já cadastrada: " + request.placa());
        }

        Veiculo entity = Veiculo.builder()
                .placa(request.placa())
                .modelo(modeloRepository.findById(request.codModelo())
                        .orElseThrow(() -> new ResourceNotFoundException("Modelo", request.codModelo())))
                .ano(request.ano())
                .cliente(clienteRepository.findById(request.codCliente())
                        .orElseThrow(() -> new ResourceNotFoundException("Cliente", request.codCliente())))
                .build();
        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public VeiculoResponse update(Long id, VeiculoRequest request) {
        Veiculo entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Veículo", id));

        if (!entity.getPlaca().equals(request.placa()) && repository.existsByPlaca(request.placa())) {
            throw new DuplicateResourceException("Placa já cadastrada: " + request.placa());
        }

        entity.setPlaca(request.placa());
        entity.setModelo(modeloRepository.findById(request.codModelo())
                .orElseThrow(() -> new ResourceNotFoundException("Modelo", request.codModelo())));
        entity.setAno(request.ano());
        entity.setCliente(clienteRepository.findById(request.codCliente())
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", request.codCliente())));
        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id))
            throw new ResourceNotFoundException("Veículo", id);
        repository.deleteById(id);
    }
}
