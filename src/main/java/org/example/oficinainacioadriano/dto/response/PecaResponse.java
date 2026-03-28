package org.example.oficinainacioadriano.dto.response;

import java.math.BigDecimal;

public record PecaResponse(Long codPeca, String nome, BigDecimal precoVenda, Integer estoqueMinimo, String categoria,
        String fornecedor) {
}
