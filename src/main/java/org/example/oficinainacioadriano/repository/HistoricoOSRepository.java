package org.example.oficinainacioadriano.repository;

import org.example.oficinainacioadriano.entity.HistoricoOS;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HistoricoOSRepository extends JpaRepository<HistoricoOS, Long> {
    List<HistoricoOS> findByOrdemServicoCodOrdemOrderByCriadoEmAsc(Long codOrdem);
}
