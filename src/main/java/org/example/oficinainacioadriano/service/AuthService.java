package org.example.oficinainacioadriano.service;

import lombok.RequiredArgsConstructor;
import org.example.oficinainacioadriano.dto.mapper.EntityMapper;
import org.example.oficinainacioadriano.dto.request.*;
import org.example.oficinainacioadriano.dto.response.TokenResponse;
import org.example.oficinainacioadriano.dto.response.UsuarioResponse;
import org.example.oficinainacioadriano.entity.Usuario;
import org.example.oficinainacioadriano.exception.BusinessException;
import org.example.oficinainacioadriano.exception.DuplicateResourceException;
import org.example.oficinainacioadriano.exception.ResourceNotFoundException;
import org.example.oficinainacioadriano.repository.UsuarioRepository;
import org.example.oficinainacioadriano.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final EntityMapper mapper;
    private final EmailService emailService;

    private static final SecureRandom RNG = new SecureRandom();

    // ── Cadastro ─────────────────────────────────────────────────────────────

    @Transactional
    public UsuarioResponse register(RegisterRequest request) {
        if (usuarioRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("Email já cadastrado: " + request.email());
        }

        String codigo = gerarCodigo6Digitos();

        Usuario usuario = Usuario.builder()
                .nome(request.nome())
                .email(request.email())
                .senha(passwordEncoder.encode(request.senha()))
                .emailVerificado(false)
                .codigoVerificacao(codigo)
                .codigoVerificacaoExpiraEm(LocalDateTime.now().plusMinutes(15))
                .codigoTipo("EMAIL_VERIFICACAO")
                .build();

        usuarioRepository.save(usuario);
        emailService.enviarCodigoVerificacao(usuario.getEmail(), usuario.getNome(), codigo);
        return mapper.toResponse(usuario);
    }

    @Transactional
    public void verifyEmail(VerifyEmailRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        if (Boolean.TRUE.equals(usuario.getEmailVerificado())) {
            throw new BusinessException("Email já verificado");
        }
        validarCodigo(usuario, request.codigo(), "EMAIL_VERIFICACAO");

        usuario.setEmailVerificado(true);
        limparCodigo(usuario);
        usuarioRepository.save(usuario);
    }

    @Transactional
    public void resendVerification(ForgotPasswordRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        if (Boolean.TRUE.equals(usuario.getEmailVerificado())) {
            throw new BusinessException("Email já verificado");
        }

        String codigo = gerarCodigo6Digitos();
        usuario.setCodigoVerificacao(codigo);
        usuario.setCodigoVerificacaoExpiraEm(LocalDateTime.now().plusMinutes(15));
        usuario.setCodigoTipo("EMAIL_VERIFICACAO");
        usuarioRepository.save(usuario);
        emailService.enviarCodigoVerificacao(usuario.getEmail(), usuario.getNome(), codigo);
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    @Transactional
    public TokenResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.senha()));

        Usuario usuario = usuarioRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        if (!Boolean.TRUE.equals(usuario.getEmailVerificado())) {
            throw new BusinessException("Email não verificado. Verifique seu email antes de fazer login.");
        }

        if (Boolean.TRUE.equals(usuario.getDoisFatoresAtivo())) {
            String codigo = gerarCodigo6Digitos();
            String tempToken = UUID.randomUUID().toString();
            usuario.setCodigoVerificacao(codigo);
            usuario.setCodigoVerificacaoExpiraEm(LocalDateTime.now().plusMinutes(10));
            usuario.setCodigoTipo("DOIS_FATORES");
            usuario.setTempToken2fa(tempToken);
            usuario.setTempToken2faExpiraEm(LocalDateTime.now().plusMinutes(10));
            usuarioRepository.save(usuario);
            emailService.enviarCodigo2FA(usuario.getEmail(), usuario.getNome(), codigo);
            return TokenResponse.requires2fa(tempToken);
        }

        String token = jwtTokenProvider.generateToken(usuario.getEmail(), usuario.getRole().name());
        return new TokenResponse(token, jwtTokenProvider.getExpiration());
    }

    @Transactional
    public TokenResponse verify2FA(Verify2FARequest request) {
        Usuario usuario = usuarioRepository.findByTempToken2fa(request.tempToken())
                .orElseThrow(() -> new BusinessException("Token inválido ou expirado"));

        if (usuario.getTempToken2faExpiraEm().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Token expirado. Faça login novamente.");
        }
        validarCodigo(usuario, request.codigo(), "DOIS_FATORES");

        limparCodigo(usuario);
        usuario.setTempToken2fa(null);
        usuario.setTempToken2faExpiraEm(null);
        usuarioRepository.save(usuario);

        String token = jwtTokenProvider.generateToken(usuario.getEmail(), usuario.getRole().name());
        return new TokenResponse(token, jwtTokenProvider.getExpiration());
    }

    // ── Esqueci a senha ───────────────────────────────────────────────────────

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        usuarioRepository.findByEmail(request.email()).ifPresent(usuario -> {
            String codigo = gerarCodigo6Digitos();
            usuario.setCodigoVerificacao(codigo);
            usuario.setCodigoVerificacaoExpiraEm(LocalDateTime.now().plusMinutes(15));
            usuario.setCodigoTipo("RESET_SENHA");
            usuarioRepository.save(usuario);
            emailService.enviarCodigoResetSenha(usuario.getEmail(), usuario.getNome(), codigo);
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        validarCodigo(usuario, request.codigo(), "RESET_SENHA");

        usuario.setSenha(passwordEncoder.encode(request.novaSenha()));
        limparCodigo(usuario);
        usuarioRepository.save(usuario);
    }

    // ── Perfil ────────────────────────────────────────────────────────────────

    @Transactional
    public UsuarioResponse updateAccount(String email, UpdateAccountRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        if (!usuario.getEmail().equals(request.email()) && usuarioRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("Email já cadastrado: " + request.email());
        }

        usuario.setNome(request.nome());
        usuario.setEmail(request.email());
        return mapper.toResponse(usuarioRepository.save(usuario));
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        if (!passwordEncoder.matches(request.senhaAtual(), usuario.getSenha())) {
            throw new BusinessException("Senha atual incorreta");
        }

        usuario.setSenha(passwordEncoder.encode(request.novaSenha()));
        usuarioRepository.save(usuario);
    }

    @Transactional
    public UsuarioResponse toggle2FA(String email, boolean ativar) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
        usuario.setDoisFatoresAtivo(ativar);
        return mapper.toResponse(usuarioRepository.save(usuario));
    }

    @Transactional(readOnly = true)
    public UsuarioResponse getProfile(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
        return mapper.toResponse(usuario);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String gerarCodigo6Digitos() {
        return String.format("%06d", RNG.nextInt(1_000_000));
    }

    private void validarCodigo(Usuario usuario, String codigo, String tipo) {
        if (!tipo.equals(usuario.getCodigoTipo())
                || !codigo.equals(usuario.getCodigoVerificacao())
                || usuario.getCodigoVerificacaoExpiraEm() == null
                || usuario.getCodigoVerificacaoExpiraEm().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Código inválido ou expirado");
        }
    }

    private void limparCodigo(Usuario usuario) {
        usuario.setCodigoVerificacao(null);
        usuario.setCodigoVerificacaoExpiraEm(null);
        usuario.setCodigoTipo(null);
    }
}

