package org.example.oficinainacioadriano.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.oficinainacioadriano.dto.request.*;
import org.example.oficinainacioadriano.dto.response.TokenResponse;
import org.example.oficinainacioadriano.dto.response.UsuarioResponse;
import org.example.oficinainacioadriano.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<UsuarioResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<Void> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        authService.verifyEmail(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Void> resendVerification(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.resendVerification(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/verify-2fa")
    public ResponseEntity<TokenResponse> verify2FA(@Valid @RequestBody Verify2FARequest request) {
        return ResponseEntity.ok(authService.verify2FA(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/profile")
    public ResponseEntity<UsuarioResponse> profile(Authentication authentication) {
        return ResponseEntity.ok(authService.getProfile(authentication.getName()));
    }

    @PutMapping("/profile")
    public ResponseEntity<UsuarioResponse> updateProfile(Authentication authentication,
            @Valid @RequestBody UpdateAccountRequest request) {
        return ResponseEntity.ok(authService.updateAccount(authentication.getName(), request));
    }

    @PutMapping("/password")
    public ResponseEntity<Void> changePassword(Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(authentication.getName(), request);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/2fa")
    public ResponseEntity<UsuarioResponse> toggle2FA(Authentication authentication,
            @RequestParam boolean ativar) {
        return ResponseEntity.ok(authService.toggle2FA(authentication.getName(), ativar));
    }
}
