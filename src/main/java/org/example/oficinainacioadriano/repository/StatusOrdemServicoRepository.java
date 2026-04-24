package org.example.oficinainacioadriano.repository;

import java.util.Optional;

import org.example.oficinainacioadriano.entity.StatusOrdemServico;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StatusOrdemServicoRepository extends JpaRepository<StatusOrdemServico, Long> {
    Optional<StatusOrdemServico> findByDescricao(String descricao);
}
