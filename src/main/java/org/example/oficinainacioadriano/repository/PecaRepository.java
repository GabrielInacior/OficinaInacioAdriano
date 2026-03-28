package org.example.oficinainacioadriano.repository;

import org.example.oficinainacioadriano.entity.Peca;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PecaRepository extends JpaRepository<Peca, Long> {
    Page<Peca> findByNomeContainingIgnoreCase(String nome, Pageable pageable);

    Page<Peca> findByCategoriaCodCategoria(Long codCategoria, Pageable pageable);
}
