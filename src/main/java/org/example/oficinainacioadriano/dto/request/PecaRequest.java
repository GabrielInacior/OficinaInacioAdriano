package org.example.oficinainacioadriano.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record PecaRequest(
        @NotBlank(message = "Nome é obrigatório") String nome,

        @NotNull(message = "Preço de venda é obrigatório") BigDecimal precoVenda,

        @NotNull(message = "Estoque mínimo é obrigatório") Integer estoqueMinimo,

        @NotNull(message = "Categoria é obrigatória") Long codCategoria,

        @NotNull(message = "Fornecedor é obrigatório") Long codFornecedor) {
}
