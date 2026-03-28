package org.example.oficinainacioadriano.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "mecanicosos")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class MecanicoOrdemServico {

    @EmbeddedId
    @EqualsAndHashCode.Include
    private MecanicoOrdemServicoId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("codMecanico")
    @JoinColumn(name = "codmecanico")
    private Mecanico mecanico;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("codOrdem")
    @JoinColumn(name = "codordem")
    private OrdemServico ordemServico;

    @Column(name = "horastrabalhadas", nullable = false, precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal horasTrabalhadas = BigDecimal.ZERO;
}
