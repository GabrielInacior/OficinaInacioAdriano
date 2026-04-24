package org.example.oficinainacioadriano.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record DashboardGraficosResponse(
        List<ReceitaSemana> receitaPorSemana,
        List<MecanicoRanking> mecanicosMaisAtivos) {

    public record ReceitaSemana(String semana, BigDecimal total) {}
    public record MecanicoRanking(String mecanico, long osFinalizadas) {}
}
