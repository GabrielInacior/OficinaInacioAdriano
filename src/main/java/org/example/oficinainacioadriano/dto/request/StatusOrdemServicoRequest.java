package org.example.oficinainacioadriano.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record StatusOrdemServicoRequest(
        @NotBlank(message = "Descrição é obrigatória") @Size(max = 50, message = "Descrição deve ter no máximo 50 caracteres") String descricao) {
}
