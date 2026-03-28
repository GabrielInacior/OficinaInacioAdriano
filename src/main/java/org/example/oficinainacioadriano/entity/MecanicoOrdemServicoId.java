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
public class MecanicoOrdemServicoId implements Serializable {

    @Column(name = "codmecanico")
    private Long codMecanico;

    @Column(name = "codordem")
    private Long codOrdem;
}
