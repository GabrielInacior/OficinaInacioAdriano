package org.example.oficinainacioadriano.dto.request;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record OrdemServicoRequest(
        LocalDate dataEntrada,

        Integer kmAtual,

        @NotNull(message = "Veículo é obrigatório") Long codVeiculo,

        @NotNull(message = "Status é obrigatório") Long codStatus) {
}
