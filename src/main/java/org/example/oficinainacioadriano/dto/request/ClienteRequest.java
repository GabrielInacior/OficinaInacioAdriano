package org.example.oficinainacioadriano.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ClienteRequest(
        @NotBlank(message = "Nome é obrigatório") String nome,

        @NotBlank(message = "CPF é obrigatório") @Size(max = 14, message = "CPF deve ter no máximo 14 caracteres") String cpf,

        @NotBlank(message = "Telefone é obrigatório") @Size(max = 20, message = "Telefone deve ter no máximo 20 caracteres") String telefone) {
}
