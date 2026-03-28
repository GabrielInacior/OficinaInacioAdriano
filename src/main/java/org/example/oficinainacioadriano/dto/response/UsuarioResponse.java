package org.example.oficinainacioadriano.dto.response;

public record UsuarioResponse(Long id, String nome, String email, String role, Boolean ativo) {
}
