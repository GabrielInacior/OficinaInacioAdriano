package org.example.oficinainacioadriano.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "formaspagamento")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class FormaPagamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    @Column(name = "codforma")
    private Long codForma;

    @Column(nullable = false, unique = true, length = 50)
    private String nome;
}
