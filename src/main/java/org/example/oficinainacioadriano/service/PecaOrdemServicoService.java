package org.example.oficinainacioadriano.service;

import lombok.RequiredArgsConstructor;
import org.example.oficinainacioadriano.dto.mapper.EntityMapper;
import org.example.oficinainacioadriano.dto.request.PecaOrdemServicoRequest;
import org.example.oficinainacioadriano.dto.response.PecaOrdemServicoResponse;
import org.example.oficinainacioadriano.entity.PecaOrdemServico;
import org.example.oficinainacioadriano.entity.PecaOrdemServicoId;
import org.example.oficinainacioadriano.exception.ResourceNotFoundException;
import org.example.oficinainacioadriano.repository.OrdemServicoRepository;
import org.example.oficinainacioadriano.repository.PecaOrdemServicoRepository;
import org.example.oficinainacioadriano.repository.PecaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PecaOrdemServicoService {

    private final PecaOrdemServicoRepository repository;
    private final PecaRepository pecaRepository;
    private final OrdemServicoRepository ordemRepository;
    private final EntityMapper mapper;

    @Transactional(readOnly = true)
    public List<PecaOrdemServicoResponse> findByOrdem(Long codOrdem) {
        return repository.findByOrdemServicoCodOrdem(codOrdem).stream().map(mapper::toResponse).toList();
    }

    @Transactional
    public PecaOrdemServicoResponse create(PecaOrdemServicoRequest request) {
        PecaOrdemServicoId id = new PecaOrdemServicoId(request.codOrdem(), request.codPeca());

        PecaOrdemServico entity = PecaOrdemServico.builder()
                .id(id)
                .ordemServico(ordemRepository.findById(request.codOrdem())
                        .orElseThrow(() -> new ResourceNotFoundException("Ordem de Serviço", request.codOrdem())))
                .peca(pecaRepository.findById(request.codPeca())
                        .orElseThrow(() -> new ResourceNotFoundException("Peça", request.codPeca())))
                .quantidade(request.quantidade())
                .valorCobrado(request.valorCobrado())
                .build();
        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public void delete(Long codOrdem, Long codPeca) {
        PecaOrdemServicoId id = new PecaOrdemServicoId(codOrdem, codPeca);
        if (!repository.existsById(id))
            throw new ResourceNotFoundException("Vínculo Peça/OS não encontrado");
        repository.deleteById(id);
    }
}
