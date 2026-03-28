package org.example.oficinainacioadriano.dto.response;

import java.math.BigDecimal;

public record PecaOrdemServicoResponse(Long codOrdem, Long codPeca, String peca, Integer quantidade,
        BigDecimal valorCobrado) {
}
