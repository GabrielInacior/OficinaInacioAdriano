package org.example.oficinainacioadriano.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record VeiculoRequest(
        @NotBlank(message = "Placa é obrigatória") @Size(max = 10, message = "Placa deve ter no máximo 10 caracteres") String placa,

        @NotNull(message = "Modelo é obrigatório") Long codModelo,

        @NotNull(message = "Ano é obrigatório") Integer ano,

        @NotNull(message = "Cliente é obrigatório") Long codCliente) {
}
