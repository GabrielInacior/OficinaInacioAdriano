package org.example.oficinainacioadriano.dto.response;

import java.math.BigDecimal;

public record MecanicoOrdemServicoResponse(Long codMecanico, String mecanico, Long codOrdem,
        BigDecimal horasTrabalhadas) {
}
