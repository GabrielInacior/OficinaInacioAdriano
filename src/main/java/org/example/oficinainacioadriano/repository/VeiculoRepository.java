package org.example.oficinainacioadriano.repository;

import org.example.oficinainacioadriano.entity.Veiculo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VeiculoRepository extends JpaRepository<Veiculo, Long> {
    boolean existsByPlaca(String placa);

    Page<Veiculo> findByClienteCodCliente(Long codCliente, Pageable pageable);
}
