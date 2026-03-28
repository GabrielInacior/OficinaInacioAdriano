package org.example.oficinainacioadriano.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "cidades")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Cidade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    @Column(name = "codcidade")
    private Long codCidade;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(nullable = false, length = 2)
    private String uf;
}
