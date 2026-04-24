package org.example.oficinainacioadriano.repository;

import java.util.List;

import org.example.oficinainacioadriano.entity.HistoricoOS;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HistoricoOSRepository extends JpaRepository<HistoricoOS, Long> {
    List<HistoricoOS> findByOrdemServicoCodOrdemOrderByCriadoEmAsc(Long codOrdem);
}
