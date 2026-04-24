package org.example.oficinainacioadriano.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record DashboardResumoResponse(
        long osAbertas,
        long osEmAndamento,
        long osFinalizado,
        BigDecimal receitaMes,
        long pecasEstoqueBaixo,
        List<StatusCount> osPorStatus) {

    public record StatusCount(String status, long count) {}
}
