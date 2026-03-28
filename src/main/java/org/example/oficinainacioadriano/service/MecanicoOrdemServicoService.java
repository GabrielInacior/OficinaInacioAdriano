package org.example.oficinainacioadriano.service;

import lombok.RequiredArgsConstructor;
import org.example.oficinainacioadriano.dto.mapper.EntityMapper;
import org.example.oficinainacioadriano.dto.request.MecanicoOrdemServicoRequest;
import org.example.oficinainacioadriano.dto.response.MecanicoOrdemServicoResponse;
import org.example.oficinainacioadriano.entity.MecanicoOrdemServico;
import org.example.oficinainacioadriano.entity.MecanicoOrdemServicoId;
import org.example.oficinainacioadriano.exception.ResourceNotFoundException;
import org.example.oficinainacioadriano.repository.MecanicoOrdemServicoRepository;
import org.example.oficinainacioadriano.repository.MecanicoRepository;
import org.example.oficinainacioadriano.repository.OrdemServicoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MecanicoOrdemServicoService {

    private final MecanicoOrdemServicoRepository repository;
    private final MecanicoRepository mecanicoRepository;
    private final OrdemServicoRepository ordemRepository;
    private final EntityMapper mapper;

    @Transactional(readOnly = true)
    public List<MecanicoOrdemServicoResponse> findByOrdem(Long codOrdem) {
        return repository.findByOrdemServicoCodOrdem(codOrdem).stream().map(mapper::toResponse).toList();
    }

    @Transactional
    public MecanicoOrdemServicoResponse create(MecanicoOrdemServicoRequest request) {
        MecanicoOrdemServicoId id = new MecanicoOrdemServicoId(request.codMecanico(), request.codOrdem());

        MecanicoOrdemServico entity = MecanicoOrdemServico.builder()
                .id(id)
                .mecanico(mecanicoRepository.findById(request.codMecanico())
                        .orElseThrow(() -> new ResourceNotFoundException("Mecânico", request.codMecanico())))
                .ordemServico(ordemRepository.findById(request.codOrdem())
                        .orElseThrow(() -> new ResourceNotFoundException("Ordem de Serviço", request.codOrdem())))
                .horasTrabalhadas(request.horasTrabalhadas())
                .build();
        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public void delete(Long codMecanico, Long codOrdem) {
        MecanicoOrdemServicoId id = new MecanicoOrdemServicoId(codMecanico, codOrdem);
        if (!repository.existsById(id))
            throw new ResourceNotFoundException("Vínculo Mecânico/OS não encontrado");
        repository.deleteById(id);
    }
}
