package org.example.oficinainacioadriano.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CidadeRequest(
        @NotBlank(message = "Nome é obrigatório") @Size(max = 150, message = "Nome deve ter no máximo 150 caracteres") String nome,

        @NotBlank(message = "UF é obrigatório") @Size(min = 2, max = 2, message = "UF deve ter exatamente 2 caracteres") String uf) {
}
