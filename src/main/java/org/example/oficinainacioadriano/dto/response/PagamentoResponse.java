package org.example.oficinainacioadriano.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PagamentoResponse(Long codPagamento, BigDecimal valor, LocalDate data, Long codOrdem,
        String formaPagamento) {
}
