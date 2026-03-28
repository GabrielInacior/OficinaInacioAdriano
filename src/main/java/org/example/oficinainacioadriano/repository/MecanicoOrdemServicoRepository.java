package org.example.oficinainacioadriano.repository;

import org.example.oficinainacioadriano.entity.MecanicoOrdemServico;
import org.example.oficinainacioadriano.entity.MecanicoOrdemServicoId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MecanicoOrdemServicoRepository extends JpaRepository<MecanicoOrdemServico, MecanicoOrdemServicoId> {
    List<MecanicoOrdemServico> findByOrdemServicoCodOrdem(Long codOrdem);

    List<MecanicoOrdemServico> findByMecanicoCodMecanico(Long codMecanico);
}
