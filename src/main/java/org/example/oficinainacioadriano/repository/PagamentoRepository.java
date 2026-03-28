package org.example.oficinainacioadriano.repository;

import org.example.oficinainacioadriano.entity.Pagamento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PagamentoRepository extends JpaRepository<Pagamento, Long> {
    Page<Pagamento> findByOrdemServicoCodOrdem(Long codOrdem, Pageable pageable);
}
