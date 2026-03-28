package org.example.oficinainacioadriano.repository;

import org.example.oficinainacioadriano.entity.OrdemServico;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrdemServicoRepository extends JpaRepository<OrdemServico, Long> {
    Page<OrdemServico> findByStatusCodStatus(Long codStatus, Pageable pageable);

    Page<OrdemServico> findByVeiculoClienteCodCliente(Long codCliente, Pageable pageable);
}
