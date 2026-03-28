package org.example.oficinainacioadriano.repository;

import org.example.oficinainacioadriano.entity.Fornecedor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FornecedorRepository extends JpaRepository<Fornecedor, Long> {
    boolean existsByCnpj(String cnpj);

    Page<Fornecedor> findByRazaoSocialContainingIgnoreCase(String razaoSocial, Pageable pageable);
}
