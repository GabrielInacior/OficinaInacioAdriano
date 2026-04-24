package org.example.oficinainacioadriano.dto.request;

import jakarta.validation.constraints.NotBlank;

public record Verify2FARequest(
        @NotBlank String tempToken,
        @NotBlank String codigo) {
}
