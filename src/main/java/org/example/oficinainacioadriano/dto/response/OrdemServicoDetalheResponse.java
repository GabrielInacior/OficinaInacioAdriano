package org.example.oficinainacioadriano.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record OrdemServicoDetalheResponse(
        Long codOrdem,
        LocalDate dataEntrada,
        Integer kmAtual,
        String status,
        // Veículo
        String veiculoPlaca,
        String veiculoModelo,
        Integer veiculoAno,
        // Cliente
        String clienteNome,
        String clienteCpf,
        String clienteTelefone,
        // Sub-listas
        List<MecanicoOSItem> mecanicos,
        List<PecaOSItem> pecas,
        List<PagamentoItem> pagamentos,
        List<HistoricoItem> historico,
        // Totais
        BigDecimal totalPecas,
        BigDecimal totalMaoDeObra,
        BigDecimal totalPago,
        BigDecimal saldoPendente) {

    public record MecanicoOSItem(
            Long codMecanico, String nome, String especialidade,
            BigDecimal horasTrabalhadas, BigDecimal comissaoPercentual, BigDecimal valorMaoDeObra) {}

    public record PecaOSItem(
            Long codPeca, String nome, Integer quantidade,
            BigDecimal valorCobrado, BigDecimal subtotal) {}

    public record PagamentoItem(
            Long codPagamento, BigDecimal valor, LocalDate data, String formaPagamento) {}

    public record HistoricoItem(
            String statusAnterior, String novoStatus, String usuario,
            String observacao, LocalDateTime criadoEm) {}
}
