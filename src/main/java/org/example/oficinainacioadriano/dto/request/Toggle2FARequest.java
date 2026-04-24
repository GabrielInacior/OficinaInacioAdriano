package org.example.oficinainacioadriano.dto.request;

import jakarta.validation.constraints.NotBlank;

public record Toggle2FARequest(
        @NotBlank String acao) {
}
