package org.example.oficinainacioadriano.repository;

import org.example.oficinainacioadriano.entity.StatusOrdemServico;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StatusOrdemServicoRepository extends JpaRepository<StatusOrdemServico, Long> {
    Optional<StatusOrdemServico> findByDescricao(String descricao);
}
