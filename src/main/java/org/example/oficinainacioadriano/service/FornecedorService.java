package org.example.oficinainacioadriano.service;

import lombok.RequiredArgsConstructor;
import org.example.oficinainacioadriano.dto.mapper.EntityMapper;
import org.example.oficinainacioadriano.dto.request.FornecedorRequest;
import org.example.oficinainacioadriano.dto.response.FornecedorResponse;
import org.example.oficinainacioadriano.entity.Fornecedor;
import org.example.oficinainacioadriano.exception.DuplicateResourceException;
import org.example.oficinainacioadriano.exception.ResourceNotFoundException;
import org.example.oficinainacioadriano.repository.CidadeRepository;
import org.example.oficinainacioadriano.repository.FornecedorRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FornecedorService {

    private final FornecedorRepository repository;
    private final CidadeRepository cidadeRepository;
    private final EntityMapper mapper;

    @Transactional(readOnly = true)
    public Page<FornecedorResponse> findAll(String razaoSocial, Pageable pageable) {
        if (razaoSocial != null && !razaoSocial.isBlank()) {
            return repository.findByRazaoSocialContainingIgnoreCase(razaoSocial, pageable).map(mapper::toResponse);
        }
        return repository.findAll(pageable).map(mapper::toResponse);
    }

    @Transactional(readOnly = true)
    public FornecedorResponse findById(Long id) {
        return mapper.toResponse(repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fornecedor", id)));
    }

    @Transactional
    public FornecedorResponse create(FornecedorRequest request) {
        if (repository.existsByCnpj(request.cnpj())) {
            throw new DuplicateResourceException("CNPJ já cadastrado: " + request.cnpj());
        }
        Fornecedor entity = Fornecedor.builder()
                .razaoSocial(request.razaoSocial())
                .cnpj(request.cnpj())
                .cidade(cidadeRepository.findById(request.codCidade())
                        .orElseThrow(() -> new ResourceNotFoundException("Cidade", request.codCidade())))
                .build();
        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public FornecedorResponse update(Long id, FornecedorRequest request) {
        Fornecedor entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fornecedor", id));

        if (!entity.getCnpj().equals(request.cnpj()) && repository.existsByCnpj(request.cnpj())) {
            throw new DuplicateResourceException("CNPJ já cadastrado: " + request.cnpj());
        }

        entity.setRazaoSocial(request.razaoSocial());
        entity.setCnpj(request.cnpj());
        entity.setCidade(cidadeRepository.findById(request.codCidade())
                .orElseThrow(() -> new ResourceNotFoundException("Cidade", request.codCidade())));
        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id))
            throw new ResourceNotFoundException("Fornecedor", id);
        repository.deleteById(id);
    }
}
