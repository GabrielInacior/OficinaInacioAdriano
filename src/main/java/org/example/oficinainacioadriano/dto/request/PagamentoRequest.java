package org.example.oficinainacioadriano.dto.request;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PagamentoRequest(
        @NotNull(message = "Valor é obrigatório") BigDecimal valor,

        LocalDate data,

        @NotNull(message = "Ordem de serviço é obrigatória") Long codOrdem,

        @NotNull(message = "Forma de pagamento é obrigatória") Long codForma) {
}
