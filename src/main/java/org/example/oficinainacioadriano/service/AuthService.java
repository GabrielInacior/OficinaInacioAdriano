package org.example.oficinainacioadriano.service;

import lombok.RequiredArgsConstructor;
import org.example.oficinainacioadriano.dto.mapper.EntityMapper;
import org.example.oficinainacioadriano.dto.request.ChangePasswordRequest;
import org.example.oficinainacioadriano.dto.request.LoginRequest;
import org.example.oficinainacioadriano.dto.request.RegisterRequest;
import org.example.oficinainacioadriano.dto.request.UpdateAccountRequest;
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

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final EntityMapper mapper;

    @Transactional
    public UsuarioResponse register(RegisterRequest request) {
        if (usuarioRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("Email já cadastrado: " + request.email());
        }

        Usuario usuario = Usuario.builder()
                .nome(request.nome())
                .email(request.email())
                .senha(passwordEncoder.encode(request.senha()))
                .build();

        return mapper.toResponse(usuarioRepository.save(usuario));
    }

    public TokenResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.senha()));

        Usuario usuario = usuarioRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        String token = jwtTokenProvider.generateToken(usuario.getEmail(), usuario.getRole().name());
        return new TokenResponse(token, jwtTokenProvider.getExpiration());
    }

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

    @Transactional(readOnly = true)
    public UsuarioResponse getProfile(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
        return mapper.toResponse(usuario);
    }
}
