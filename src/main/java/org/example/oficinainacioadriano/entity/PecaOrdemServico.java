package org.example.oficinainacioadriano.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "pecasos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class PecaOrdemServico {

    @EmbeddedId
    @EqualsAndHashCode.Include
    private PecaOrdemServicoId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("codOrdem")
    @JoinColumn(name = "codordem")
    private OrdemServico ordemServico;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("codPeca")
    @JoinColumn(name = "codpeca")
    private Peca peca;

    @Column(nullable = false)
    @Builder.Default
    private Integer quantidade = 1;

    @Column(name = "valorcobrado", nullable = false, precision = 12, scale = 2)
    private BigDecimal valorCobrado;
}
