package org.example.oficinainacioadriano.dto.response;

import java.time.LocalDate;

public record OrdemServicoResponse(Long codOrdem, LocalDate dataEntrada, Integer kmAtual, String veiculo,
        String cliente, String status) {
}
