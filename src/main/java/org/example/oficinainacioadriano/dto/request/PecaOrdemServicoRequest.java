package org.example.oficinainacioadriano.dto.request;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record PecaOrdemServicoRequest(
        @NotNull(message = "Ordem de serviço é obrigatória") Long codOrdem,

        @NotNull(message = "Peça é obrigatória") Long codPeca,

        @NotNull(message = "Quantidade é obrigatória") Integer quantidade,

        @NotNull(message = "Valor cobrado é obrigatório") BigDecimal valorCobrado) {
}
