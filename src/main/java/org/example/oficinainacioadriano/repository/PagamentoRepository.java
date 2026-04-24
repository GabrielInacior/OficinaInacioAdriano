package org.example.oficinainacioadriano.repository;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.example.oficinainacioadriano.entity.Pagamento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PagamentoRepository extends JpaRepository<Pagamento, Long> {
    Page<Pagamento> findByOrdemServicoCodOrdem(Long codOrdem, Pageable pageable);

    @Query("SELECT COALESCE(SUM(p.valor), 0) FROM Pagamento p WHERE p.data BETWEEN :inicio AND :fim")
    BigDecimal sumByPeriodo(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);
}
