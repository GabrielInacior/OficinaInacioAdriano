package org.example.oficinainacioadriano.repository;

import java.util.List;

import org.example.oficinainacioadriano.entity.MecanicoOrdemServico;
import org.example.oficinainacioadriano.entity.MecanicoOrdemServicoId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MecanicoOrdemServicoRepository extends JpaRepository<MecanicoOrdemServico, MecanicoOrdemServicoId> {
    List<MecanicoOrdemServico> findByOrdemServicoCodOrdem(Long codOrdem);
    List<MecanicoOrdemServico> findByMecanicoCodMecanico(Long codMecanico);

    @Query(value = """
            SELECT m.nome, COUNT(mos.codordem) as total
            FROM mecanicosos mos
            JOIN mecanicos m ON m.codmecanico = mos.codmecanico
            JOIN ordensservico os ON os.codordem = mos.codordem
            JOIN statusos s ON s.codstatus = os.codstatus
            WHERE s.descricao = 'Finalizado'
            GROUP BY m.nome
            ORDER BY total DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> findTopMecanicosByOsFinalizadas(@Param("limit") int limit);
}
