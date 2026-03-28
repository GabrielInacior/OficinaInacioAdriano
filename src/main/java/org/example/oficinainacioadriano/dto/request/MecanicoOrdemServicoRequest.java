package org.example.oficinainacioadriano.dto.request;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record MecanicoOrdemServicoRequest(
        @NotNull(message = "Mecânico é obrigatório") Long codMecanico,

        @NotNull(message = "Ordem de serviço é obrigatória") Long codOrdem,

        @NotNull(message = "Horas trabalhadas é obrigatório") BigDecimal horasTrabalhadas) {
}
