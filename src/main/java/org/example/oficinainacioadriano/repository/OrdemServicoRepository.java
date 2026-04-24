package org.example.oficinainacioadriano.repository;

import java.time.LocalDate;
import java.util.List;

import org.example.oficinainacioadriano.entity.OrdemServico;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrdemServicoRepository extends JpaRepository<OrdemServico, Long> {
    Page<OrdemServico> findByStatusCodStatus(Long codStatus, Pageable pageable);
    Page<OrdemServico> findByVeiculoClienteCodCliente(Long codCliente, Pageable pageable);

    @Query("SELECT COUNT(os) FROM OrdemServico os WHERE os.status.descricao = :descricao")
    long countByStatusDescricao(@Param("descricao") String descricao);

    @Query("SELECT os.status.descricao, COUNT(os) FROM OrdemServico os GROUP BY os.status.descricao")
    List<Object[]> countGroupByStatus();

    @Query("SELECT os FROM OrdemServico os WHERE os.status.descricao = :descricao AND os.dataEntrada BETWEEN :inicio AND :fim")
    Page<OrdemServico> findByStatusDescricaoAndPeriodo(@Param("descricao") String descricao,
            @Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim, Pageable pageable);

    @Query("SELECT os FROM OrdemServico os WHERE os.dataEntrada BETWEEN :inicio AND :fim")
    Page<OrdemServico> findByPeriodo(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim, Pageable pageable);
}
