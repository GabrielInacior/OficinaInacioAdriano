package org.example.oficinainacioadriano.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank @Email String email,
        @NotBlank String codigo,
        @NotBlank @Size(min = 6) String novaSenha) {
}
