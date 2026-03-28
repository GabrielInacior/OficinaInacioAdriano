package org.example.oficinainacioadriano.dto.response;

import java.math.BigDecimal;

public record MecanicoResponse(Long codMecanico, String nome, String especialidade, BigDecimal comissaoPercentual) {
}
