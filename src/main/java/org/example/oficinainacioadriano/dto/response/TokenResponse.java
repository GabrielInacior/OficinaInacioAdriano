package org.example.oficinainacioadriano.dto.response;

public record TokenResponse(String token, String tipo, Long expiresIn) {

    public TokenResponse(String token, Long expiresIn) {
        this(token, "Bearer", expiresIn);
    }
}
