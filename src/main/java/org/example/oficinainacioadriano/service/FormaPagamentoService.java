package org.example.oficinainacioadriano.service;

import lombok.RequiredArgsConstructor;
import org.example.oficinainacioadriano.dto.mapper.EntityMapper;
import org.example.oficinainacioadriano.dto.request.FormaPagamentoRequest;
import org.example.oficinainacioadriano.dto.response.FormaPagamentoResponse;
import org.example.oficinainacioadriano.entity.FormaPagamento;
import org.example.oficinainacioadriano.exception.ResourceNotFoundException;
import org.example.oficinainacioadriano.repository.FormaPagamentoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FormaPagamentoService {

    private final FormaPagamentoRepository repository;
    private final EntityMapper mapper;

    @Transactional(readOnly = true)
    public List<FormaPagamentoResponse> findAll() {
        return repository.findAll().stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public FormaPagamentoResponse findById(Long id) {
        return mapper.toResponse(repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Forma de Pagamento", id)));
    }

    @Transactional
    public FormaPagamentoResponse create(FormaPagamentoRequest request) {
        FormaPagamento entity = FormaPagamento.builder().nome(request.nome()).build();
        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public FormaPagamentoResponse update(Long id, FormaPagamentoRequest request) {
        FormaPagamento entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Forma de Pagamento", id));
        entity.setNome(request.nome());
        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id))
            throw new ResourceNotFoundException("Forma de Pagamento", id);
        repository.deleteById(id);
    }
}
