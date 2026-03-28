package org.example.oficinainacioadriano.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "pecas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Peca {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    @Column(name = "codpeca")
    private Long codPeca;

    @Column(nullable = false)
    private String nome;

    @Column(name = "precovenda", nullable = false, precision = 12, scale = 2)
    private BigDecimal precoVenda;

    @Column(name = "estoqueminimo", nullable = false)
    @Builder.Default
    private Integer estoqueMinimo = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "codcategoria", nullable = false)
    private CategoriaPeca categoria;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "codfornecedor", nullable = false)
    private Fornecedor fornecedor;
}
