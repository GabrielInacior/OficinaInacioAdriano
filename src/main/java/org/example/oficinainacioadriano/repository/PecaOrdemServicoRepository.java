package org.example.oficinainacioadriano.repository;

import org.example.oficinainacioadriano.entity.PecaOrdemServico;
import org.example.oficinainacioadriano.entity.PecaOrdemServicoId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PecaOrdemServicoRepository extends JpaRepository<PecaOrdemServico, PecaOrdemServicoId> {
    List<PecaOrdemServico> findByOrdemServicoCodOrdem(Long codOrdem);
}
