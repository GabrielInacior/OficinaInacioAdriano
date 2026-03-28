package org.example.oficinainacioadriano.service;

import lombok.RequiredArgsConstructor;
import org.example.oficinainacioadriano.dto.mapper.EntityMapper;
import org.example.oficinainacioadriano.dto.request.PecaRequest;
import org.example.oficinainacioadriano.dto.response.PecaResponse;
import org.example.oficinainacioadriano.entity.Peca;
import org.example.oficinainacioadriano.exception.ResourceNotFoundException;
import org.example.oficinainacioadriano.repository.CategoriaPecaRepository;
import org.example.oficinainacioadriano.repository.FornecedorRepository;
import org.example.oficinainacioadriano.repository.PecaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PecaService {

    private final PecaRepository repository;
    private final CategoriaPecaRepository categoriaRepository;
    private final FornecedorRepository fornecedorRepository;
    private final EntityMapper mapper;

    @Transactional(readOnly = true)
    public Page<PecaResponse> findAll(String nome, Pageable pageable) {
        if (nome != null && !nome.isBlank()) {
            return repository.findByNomeContainingIgnoreCase(nome, pageable).map(mapper::toResponse);
        }
        return repository.findAll(pageable).map(mapper::toResponse);
    }

    @Transactional(readOnly = true)
    public PecaResponse findById(Long id) {
        return mapper.toResponse(repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Peça", id)));
    }

    @Transactional
    public PecaResponse create(PecaRequest request) {
        Peca entity = Peca.builder()
                .nome(request.nome())
                .precoVenda(request.precoVenda())
                .estoqueMinimo(request.estoqueMinimo())
                .categoria(categoriaRepository.findById(request.codCategoria())
                        .orElseThrow(() -> new ResourceNotFoundException("Categoria", request.codCategoria())))
                .fornecedor(fornecedorRepository.findById(request.codFornecedor())
                        .orElseThrow(() -> new ResourceNotFoundException("Fornecedor", request.codFornecedor())))
                .build();
        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public PecaResponse update(Long id, PecaRequest request) {
        Peca entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Peça", id));

        entity.setNome(request.nome());
        entity.setPrecoVenda(request.precoVenda());
        entity.setEstoqueMinimo(request.estoqueMinimo());
        entity.setCategoria(categoriaRepository.findById(request.codCategoria())
                .orElseThrow(() -> new ResourceNotFoundException("Categoria", request.codCategoria())));
        entity.setFornecedor(fornecedorRepository.findById(request.codFornecedor())
                .orElseThrow(() -> new ResourceNotFoundException("Fornecedor", request.codFornecedor())));
        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id))
            throw new ResourceNotFoundException("Peça", id);
        repository.deleteById(id);
    }
}
