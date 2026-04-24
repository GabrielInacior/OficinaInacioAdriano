package org.example.oficinainacioadriano.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.example.oficinainacioadriano.dto.mapper.EntityMapper;
import org.example.oficinainacioadriano.dto.request.AtualizarStatusOSRequest;
import org.example.oficinainacioadriano.dto.request.OrdemServicoRequest;
import org.example.oficinainacioadriano.dto.response.OrdemServicoDetalheResponse;
import org.example.oficinainacioadriano.dto.response.OrdemServicoResponse;
import org.example.oficinainacioadriano.entity.Cliente;
import org.example.oficinainacioadriano.entity.HistoricoOS;
import org.example.oficinainacioadriano.entity.OrdemServico;
import org.example.oficinainacioadriano.entity.StatusOrdemServico;
import org.example.oficinainacioadriano.entity.Usuario;
import org.example.oficinainacioadriano.entity.Veiculo;
import org.example.oficinainacioadriano.exception.BusinessException;
import org.example.oficinainacioadriano.exception.ResourceNotFoundException;
import org.example.oficinainacioadriano.repository.HistoricoOSRepository;
import org.example.oficinainacioadriano.repository.OrdemServicoRepository;
import org.example.oficinainacioadriano.repository.StatusOrdemServicoRepository;
import org.example.oficinainacioadriano.repository.UsuarioRepository;
import org.example.oficinainacioadriano.repository.VeiculoRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrdemServicoService {

    private final OrdemServicoRepository repository;
    private final VeiculoRepository veiculoRepository;
    private final StatusOrdemServicoRepository statusRepository;
    private final HistoricoOSRepository historicoRepository;
    private final UsuarioRepository usuarioRepository;
    private final EntityMapper mapper;

    // Transições permitidas: status atual → status destino permitidos
    private static final Map<String, Set<String>> TRANSICOES = Map.of(
            "Aguardando", Set.of("Em Andamento", "Cancelado"),
            "Em Andamento", Set.of("Finalizado", "Cancelado")
    );

    @Transactional(readOnly = true)
    public Page<OrdemServicoResponse> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(mapper::toResponse);
    }

    @Transactional(readOnly = true)
    public OrdemServicoResponse findById(Long id) {
        return mapper.toResponse(repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ordem de Serviço", id)));
    }

    @Transactional(readOnly = true)
    public OrdemServicoDetalheResponse findDetalheById(Long id) {
        OrdemServico os = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ordem de Serviço", id));

        Veiculo v = os.getVeiculo();
        Cliente c = v.getCliente();

        List<OrdemServicoDetalheResponse.MecanicoOSItem> mecanicos = os.getMecanicos().stream()
                .map(m -> {
                    BigDecimal horas = m.getHorasTrabalhadas();
                    BigDecimal comissao = m.getMecanico().getComissaoPercentual();
                    BigDecimal valorMO = horas.multiply(comissao);
                    return new OrdemServicoDetalheResponse.MecanicoOSItem(
                            m.getMecanico().getCodMecanico(),
                            m.getMecanico().getNome(),
                            m.getMecanico().getEspecialidade().getNome(),
                            horas, comissao, valorMO);
                }).toList();

        List<OrdemServicoDetalheResponse.PecaOSItem> pecas = os.getPecas().stream()
                .map(p -> new OrdemServicoDetalheResponse.PecaOSItem(
                        p.getPeca().getCodPeca(),
                        p.getPeca().getNome(),
                        p.getQuantidade(),
                        p.getValorCobrado(),
                        p.getValorCobrado().multiply(BigDecimal.valueOf(p.getQuantidade()))))
                .toList();

        List<OrdemServicoDetalheResponse.PagamentoItem> pagamentos = os.getPagamentos().stream()
                .map(p -> new OrdemServicoDetalheResponse.PagamentoItem(
                        p.getCodPagamento(), p.getValor(), p.getData(),
                        p.getFormaPagamento().getNome()))
                .toList();

        List<OrdemServicoDetalheResponse.HistoricoItem> historico =
                historicoRepository.findByOrdemServicoCodOrdemOrderByCriadoEmAsc(id).stream()
                        .map(h -> new OrdemServicoDetalheResponse.HistoricoItem(
                                h.getStatusAnterior(), h.getNovoStatus(),
                                h.getUsuario() != null ? h.getUsuario().getNome() : "Sistema",
                                h.getObservacao(), h.getCriadoEm()))
                        .toList();

        BigDecimal totalPecas = pecas.stream()
                .map(OrdemServicoDetalheResponse.PecaOSItem::subtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalMO = mecanicos.stream()
                .map(OrdemServicoDetalheResponse.MecanicoOSItem::valorMaoDeObra)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPago = pagamentos.stream()
                .map(OrdemServicoDetalheResponse.PagamentoItem::valor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal saldo = totalPecas.add(totalMO).subtract(totalPago);

        return new OrdemServicoDetalheResponse(
                os.getCodOrdem(), os.getDataEntrada(), os.getKmAtual(), os.getStatus().getDescricao(),
                v.getPlaca(), v.getModelo().getNome(), v.getAno(),
                c.getNome(), c.getCpf(), c.getTelefone(),
                mecanicos, pecas, pagamentos, historico,
                totalPecas, totalMO, totalPago, saldo);
    }

    @Transactional
    public OrdemServicoResponse create(OrdemServicoRequest request) {
        OrdemServico entity = OrdemServico.builder()
                .dataEntrada(request.dataEntrada() != null ? request.dataEntrada() : LocalDate.now())
                .kmAtual(request.kmAtual())
                .veiculo(veiculoRepository.findById(request.codVeiculo())
                        .orElseThrow(() -> new ResourceNotFoundException("Veículo", request.codVeiculo())))
                .status(statusRepository.findById(request.codStatus())
                        .orElseThrow(() -> new ResourceNotFoundException("Status", request.codStatus())))
                .build();
        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public OrdemServicoResponse update(Long id, OrdemServicoRequest request) {
        OrdemServico entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ordem de Serviço", id));
        entity.setDataEntrada(request.dataEntrada() != null ? request.dataEntrada() : entity.getDataEntrada());
        entity.setKmAtual(request.kmAtual());
        entity.setVeiculo(veiculoRepository.findById(request.codVeiculo())
                .orElseThrow(() -> new ResourceNotFoundException("Veículo", request.codVeiculo())));
        entity.setStatus(statusRepository.findById(request.codStatus())
                .orElseThrow(() -> new ResourceNotFoundException("Status", request.codStatus())));
        return mapper.toResponse(repository.save(entity));
    }

    @Transactional
    public OrdemServicoResponse atualizarStatus(Long id, AtualizarStatusOSRequest request, String emailUsuario) {
        OrdemServico os = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ordem de Serviço", id));

        String statusAtual = os.getStatus().getDescricao();
        String novoStatus = request.novoStatus();

        Set<String> permitidos = TRANSICOES.get(statusAtual);
        if (permitidos == null || !permitidos.contains(novoStatus)) {
            throw new BusinessException(
                    "Transição inválida: '" + statusAtual + "' → '" + novoStatus + "'");
        }

        StatusOrdemServico status = statusRepository.findByDescricao(novoStatus)
                .orElseThrow(() -> new BusinessException("Status desconhecido: " + novoStatus));

        os.setStatus(status);
        repository.save(os);

        Usuario usuario = usuarioRepository.findByEmail(emailUsuario).orElse(null);
        HistoricoOS historico = HistoricoOS.builder()
                .ordemServico(os)
                .statusAnterior(statusAtual)
                .novoStatus(novoStatus)
                .usuario(usuario)
                .observacao(request.observacao())
                .build();
        historicoRepository.save(historico);

        return mapper.toResponse(os);
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id))
            throw new ResourceNotFoundException("Ordem de Serviço", id);
        repository.deleteById(id);
    }
}
