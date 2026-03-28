package org.example.oficinainacioadriano.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record FornecedorRequest(
        @NotBlank(message = "Razão social é obrigatória") String razaoSocial,

        @NotBlank(message = "CNPJ é obrigatório") @Size(max = 18, message = "CNPJ deve ter no máximo 18 caracteres") String cnpj,

        @NotNull(message = "Cidade é obrigatória") Long codCidade) {
}
