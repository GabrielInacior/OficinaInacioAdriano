package org.example.oficinainacioadriano.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record FormaPagamentoRequest(
        @NotBlank(message = "Nome é obrigatório") @Size(max = 50, message = "Nome deve ter no máximo 50 caracteres") String nome) {
}
