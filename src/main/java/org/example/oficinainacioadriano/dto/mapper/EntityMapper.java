package org.example.oficinainacioadriano.dto.mapper;

import org.example.oficinainacioadriano.dto.response.*;
import org.example.oficinainacioadriano.entity.*;
import org.springframework.stereotype.Component;

/**
 * Mapper centralizado para converter entidades em DTOs de resposta.
 */
@Component
public class EntityMapper {

    public UsuarioResponse toResponse(Usuario u) {
        return new UsuarioResponse(u.getId(), u.getNome(), u.getEmail(), u.getRole().name(), u.getAtivo());
    }

    public StatusOrdemServicoResponse toResponse(StatusOrdemServico s) {
        return new StatusOrdemServicoResponse(s.getCodStatus(), s.getDescricao());
    }

    public FormaPagamentoResponse toResponse(FormaPagamento f) {
        return new FormaPagamentoResponse(f.getCodForma(), f.getNome());
    }

    public ClienteResponse toResponse(Cliente c) {
        return new ClienteResponse(c.getCodCliente(), c.getNome(), c.getCpf(), c.getTelefone());
    }

    public ModeloResponse toResponse(Modelo m) {
        return new ModeloResponse(m.getCodModelo(), m.getNome());
    }

    public VeiculoResponse toResponse(Veiculo v) {
        return new VeiculoResponse(
                v.getCodVeiculo(),
                v.getPlaca(),
                v.getModelo().getNome(),
                v.getAno(),
                v.getCliente().getNome());
    }

    public CidadeResponse toResponse(Cidade c) {
        return new CidadeResponse(c.getCodCidade(), c.getNome(), c.getUf());
    }

    public FornecedorResponse toResponse(Fornecedor f) {
        return new FornecedorResponse(
                f.getCodFornecedor(),
                f.getRazaoSocial(),
                f.getCnpj(),
                f.getCidade().getNome() + "/" + f.getCidade().getUf());
    }

    public CategoriaPecaResponse toResponse(CategoriaPeca c) {
        return new CategoriaPecaResponse(c.getCodCategoria(), c.getNome());
    }

    public PecaResponse toResponse(Peca p) {
        return new PecaResponse(
                p.getCodPeca(),
                p.getNome(),
                p.getPrecoVenda(),
                p.getEstoqueMinimo(),
                p.getCategoria().getNome(),
                p.getFornecedor().getRazaoSocial());
    }

    public EspecialidadeResponse toResponse(Especialidade e) {
        return new EspecialidadeResponse(e.getCodEspecialidade(), e.getNome());
    }

    public MecanicoResponse toResponse(Mecanico m) {
        return new MecanicoResponse(
                m.getCodMecanico(),
                m.getNome(),
                m.getEspecialidade().getNome(),
                m.getComissaoPercentual());
    }

    public OrdemServicoResponse toResponse(OrdemServico os) {
        return new OrdemServicoResponse(
                os.getCodOrdem(),
                os.getDataEntrada(),
                os.getKmAtual(),
                os.getVeiculo().getPlaca() + " - " + os.getVeiculo().getModelo().getNome(),
                os.getVeiculo().getCliente().getNome(),
                os.getStatus().getDescricao());
    }

    public PagamentoResponse toResponse(Pagamento p) {
        return new PagamentoResponse(
                p.getCodPagamento(),
                p.getValor(),
                p.getData(),
                p.getOrdemServico().getCodOrdem(),
                p.getFormaPagamento().getNome());
    }

    public MecanicoOrdemServicoResponse toResponse(MecanicoOrdemServico mos) {
        return new MecanicoOrdemServicoResponse(
                mos.getMecanico().getCodMecanico(),
                mos.getMecanico().getNome(),
                mos.getOrdemServico().getCodOrdem(),
                mos.getHorasTrabalhadas());
    }

    public PecaOrdemServicoResponse toResponse(PecaOrdemServico pos) {
        return new PecaOrdemServicoResponse(
                pos.getOrdemServico().getCodOrdem(),
                pos.getPeca().getCodPeca(),
                pos.getPeca().getNome(),
                pos.getQuantidade(),
                pos.getValorCobrado());
    }
}
