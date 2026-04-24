package org.example.oficinainacioadriano.entity;

import jakarta.persistence.*;
import lombok.*;
import org.example.oficinainacioadriano.enums.Role;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String senha;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Role role = Role.USER;

    @Column(nullable = false)
    @Builder.Default
    private Boolean ativo = true;

    @Column(name = "email_verificado", nullable = false)
    @Builder.Default
    private Boolean emailVerificado = false;

    @Column(name = "dois_fatores_ativo", nullable = false)
    @Builder.Default
    private Boolean doisFatoresAtivo = false;

    @Column(name = "codigo_verificacao", length = 6)
    private String codigoVerificacao;

    @Column(name = "codigo_verificacao_expira_em")
    private LocalDateTime codigoVerificacaoExpiraEm;

    @Column(name = "codigo_tipo", length = 30)
    private String codigoTipo;

    @Column(name = "temp_token_2fa", length = 36)
    private String tempToken2fa;

    @Column(name = "temp_token_2fa_expira_em")
    private LocalDateTime tempToken2faExpiraEm;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
