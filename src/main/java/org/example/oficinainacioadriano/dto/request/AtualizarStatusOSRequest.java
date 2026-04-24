package org.example.oficinainacioadriano.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AtualizarStatusOSRequest(
        @NotBlank String novoStatus,
        String observacao) {
}
