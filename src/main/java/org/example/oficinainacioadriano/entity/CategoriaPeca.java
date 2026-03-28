package org.example.oficinainacioadriano.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "categoriaspecas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class CategoriaPeca {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    @Column(name = "codcategoria")
    private Long codCategoria;

    @Column(nullable = false, unique = true, length = 100)
    private String nome;
}
