package org.example.oficinainacioadriano.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UpdateAccountRequest(
        @NotBlank(message = "Nome é obrigatório") String nome,

        @NotBlank(message = "Email é obrigatório") @Email(message = "Email inválido") String email) {
}
