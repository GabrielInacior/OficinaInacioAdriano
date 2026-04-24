package org.example.oficinainacioadriano.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import org.example.oficinainacioadriano.dto.response.DashboardGraficosResponse;
import org.example.oficinainacioadriano.dto.response.DashboardResumoResponse;
import org.example.oficinainacioadriano.repository.MecanicoOrdemServicoRepository;
import org.example.oficinainacioadriano.repository.OrdemServicoRepository;
import org.example.oficinainacioadriano.repository.PagamentoRepository;
import org.example.oficinainacioadriano.repository.PecaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final OrdemServicoRepository ordemServicoRepository;
    private final PagamentoRepository pagamentoRepository;
    private final PecaRepository pecaRepository;
    private final MecanicoOrdemServicoRepository mecanicoOsRepository;

    @Transactional(readOnly = true)
    public DashboardResumoResponse getResumo() {
        long osAbertas = ordemServicoRepository.countByStatusDescricao("Aguardando");
        long osEmAndamento = ordemServicoRepository.countByStatusDescricao("Em Andamento");
        long osFinalizado = ordemServicoRepository.countByStatusDescricao("Finalizado");
        long pecasEstoqueBaixo = pecaRepository.countByEstoqueBaixo();

        LocalDate inicioMes = LocalDate.now().withDayOfMonth(1);
        BigDecimal receitaMes = pagamentoRepository.sumByPeriodo(inicioMes, LocalDate.now());
        if (receitaMes == null) receitaMes = BigDecimal.ZERO;

        List<DashboardResumoResponse.StatusCount> osPorStatus =
                ordemServicoRepository.countGroupByStatus().stream()
                        .map(r -> new DashboardResumoResponse.StatusCount(
                                (String) r[0], ((Number) r[1]).longValue()))
                        .toList();

        return new DashboardResumoResponse(osAbertas, osEmAndamento, osFinalizado,
                receitaMes, pecasEstoqueBaixo, osPorStatus);
    }

    @Transactional(readOnly = true)
    public DashboardGraficosResponse getGraficos() {
        // Receita por semana — últimas 4 semanas
        List<DashboardGraficosResponse.ReceitaSemana> receitaSemanas = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM");
        for (int i = 3; i >= 0; i--) {
            LocalDate fim = LocalDate.now().minusWeeks(i);
            LocalDate inicio = fim.minusDays(6);
            BigDecimal total = pagamentoRepository.sumByPeriodo(inicio, fim);
            receitaSemanas.add(new DashboardGraficosResponse.ReceitaSemana(
                    inicio.format(fmt) + " - " + fim.format(fmt),
                    total == null ? BigDecimal.ZERO : total));
        }

        // Top 5 mecânicos por OS finalizada
        List<DashboardGraficosResponse.MecanicoRanking> ranking =
                mecanicoOsRepository.findTopMecanicosByOsFinalizadas(5).stream()
                        .map(r -> new DashboardGraficosResponse.MecanicoRanking(
                                (String) r[0], ((Number) r[1]).longValue()))
                        .toList();

        return new DashboardGraficosResponse(receitaSemanas, ranking);
    }
}
