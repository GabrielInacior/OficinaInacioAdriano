package org.example.oficinainacioadriano.dto.response;

public record TokenResponse(String token, String tipo, Long expiresIn, Boolean requires2fa, String tempToken) {

    public TokenResponse(String token, Long expiresIn) {
        this(token, "Bearer", expiresIn, false, null);
    }

    public static TokenResponse requires2fa(String tempToken) {
        return new TokenResponse(null, null, null, true, tempToken);
    }
}
