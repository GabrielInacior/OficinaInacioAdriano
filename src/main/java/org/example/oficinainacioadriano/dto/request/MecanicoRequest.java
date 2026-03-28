package org.example.oficinainacioadriano.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record MecanicoRequest(
        @NotBlank(message = "Nome é obrigatório") String nome,

        @NotNull(message = "Especialidade é obrigatória") Long codEspecialidade,

        @NotNull(message = "Comissão percentual é obrigatória") BigDecimal comissaoPercentual) {
}
