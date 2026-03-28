package org.example.oficinainacioadriano.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class PecaOrdemServicoId implements Serializable {

    @Column(name = "codordem")
    private Long codOrdem;

    @Column(name = "codpeca")
    private Long codPeca;
}
