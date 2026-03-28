package org.example.oficinainacioadriano.service;

import lombok.RequiredArgsConstructor;
import org.example.oficinainacioadriano.dto.mapper.EntityMapper;
import org.example.oficinainacioadriano.dto.request.PagamentoRequest;
import org.example.oficinainacioadriano.dto.response.PagamentoResponse;
import org.example.oficinainacioadriano.entity.Pagamento;
import org.example.oficinainacioadriano.exception.ResourceNotFoundException;
import org.example.oficinainacioadriano.repository.FormaPagamentoRepository;
import org.example.oficinainacioadriano.repository.OrdemServicoRepository;
import org.example.oficinainacioadriano.repository.PagamentoRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class PagamentoService {

    private final PagamentoRepository repository;
    private final OrdemServicoRepository ordemRepository;
    private final FormaPagamentoRepository formaRepository;
    private final EntityMapper mapper;

    @Transactional(readOnly = true)
    public Page<PagamentoResponse> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toResponse);
    }

    @Transactional(readOnly = true)
    public PagamentoResponse findById(Long id) {
        return mapper.toResponse(repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pagamento", id)));
    }

    @Transactional
    public PagamentoResponse create(PagamentoRequest request) {
        Pagamento entity = Pagamento.builder()
                .valor(request.valor())
                .data(request.data() != null ? request.data() : LocalDate.now())
                .ordemServico(ordemRepository.findById(request.codOrdem())
                        .orElseThrow(() -> new ResourceNotFoundException("Ordem de Serviço", request.codOrdem())))
                .formaPagamento(formaRepository.findById(request.codForma())
                        .orElseThrow(() -> new ResourceNotFoundException("Forma de Pagamento", request.codForma())))
                .build();
        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public PagamentoResponse update(Long id, PagamentoRequest request) {
        Pagamento entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pagamento", id));
        entity.setValor(request.valor());
        entity.setData(request.data() != null ? request.data() : entity.getData());
        entity.setOrdemServico(ordemRepository.findById(request.codOrdem())
                .orElseThrow(() -> new ResourceNotFoundException("Ordem de Serviço", request.codOrdem())));
        entity.setFormaPagamento(formaRepository.findById(request.codForma())
                .orElseThrow(() -> new ResourceNotFoundException("Forma de Pagamento", request.codForma())));
        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id))
            throw new ResourceNotFoundException("Pagamento", id);
        repository.deleteById(id);
    }
}
