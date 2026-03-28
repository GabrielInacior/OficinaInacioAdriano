package org.example.oficinainacioadriano.service;

import lombok.RequiredArgsConstructor;
import org.example.oficinainacioadriano.dto.mapper.EntityMapper;
import org.example.oficinainacioadriano.dto.request.ClienteRequest;
import org.example.oficinainacioadriano.dto.response.ClienteResponse;
import org.example.oficinainacioadriano.entity.Cliente;
import org.example.oficinainacioadriano.exception.DuplicateResourceException;
import org.example.oficinainacioadriano.exception.ResourceNotFoundException;
import org.example.oficinainacioadriano.repository.ClienteRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final ClienteRepository repository;
    private final EntityMapper mapper;

    @Transactional(readOnly = true)
    public Page<ClienteResponse> findAll(String nome, Pageable pageable) {
        if (nome != null && !nome.isBlank()) {
            return repository.findByNomeContainingIgnoreCase(nome, pageable).map(mapper::toResponse);
        }
        return repository.findAll(pageable).map(mapper::toResponse);
    }

    @Transactional(readOnly = true)
    public ClienteResponse findById(Long id) {
        return mapper.toResponse(repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", id)));
    }

    @Transactional
    public ClienteResponse create(ClienteRequest request) {
        if (repository.existsByCpf(request.cpf())) {
            throw new DuplicateResourceException("CPF já cadastrado: " + request.cpf());
        }
        Cliente entity = Cliente.builder()
                .nome(request.nome())
                .cpf(request.cpf())
                .telefone(request.telefone())
                .build();
        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public ClienteResponse update(Long id, ClienteRequest request) {
        Cliente entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", id));

        if (!entity.getCpf().equals(request.cpf()) && repository.existsByCpf(request.cpf())) {
            throw new DuplicateResourceException("CPF já cadastrado: " + request.cpf());
        }

        entity.setNome(request.nome());
        entity.setCpf(request.cpf());
        entity.setTelefone(request.telefone());
        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id))
            throw new ResourceNotFoundException("Cliente", id);
        repository.deleteById(id);
    }
}
