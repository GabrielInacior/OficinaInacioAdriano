package org.example.oficinainacioadriano.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "mecanicos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Mecanico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    @Column(name = "codmecanico")
    private Long codMecanico;

    @Column(nullable = false)
    private String nome;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "codespecialidade", nullable = false)
    private Especialidade especialidade;

    @Column(name = "comissaopercentual", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal comissaoPercentual = BigDecimal.ZERO;
}
