package org.example.oficinainacioadriano.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String from;

    @Async
    public void enviarCodigoVerificacao(String destinatario, String nome, String codigo) {
        String assunto = "Verificação de Email — Oficina Inácio Adriano";
        String corpo = buildEmail(nome,
                "Seu código de verificação de email",
                "Use o código abaixo para verificar seu email. Ele expira em <strong>15 minutos</strong>.",
                codigo,
                "Se você não criou uma conta, ignore este email.");
        enviar(destinatario, assunto, corpo);
    }

    @Async
    public void enviarCodigoResetSenha(String destinatario, String nome, String codigo) {
        String assunto = "Redefinição de Senha — Oficina Inácio Adriano";
        String corpo = buildEmail(nome,
                "Redefinição de senha",
                "Use o código abaixo para redefinir sua senha. Ele expira em <strong>15 minutos</strong>.",
                codigo,
                "Se você não solicitou a redefinição, ignore este email.");
        enviar(destinatario, assunto, corpo);
    }

    @Async
    public void enviarCodigo2FA(String destinatario, String nome, String codigo) {
        String assunto = "Código de Acesso — Oficina Inácio Adriano";
        String corpo = buildEmail(nome,
                "Verificação em duas etapas",
                "Use o código abaixo para concluir seu login. Ele expira em <strong>10 minutos</strong>.",
                codigo,
                "Se você não tentou fazer login, altere sua senha imediatamente.");
        enviar(destinatario, assunto, corpo);
    }

    private void enviar(String destinatario, String assunto, String corpo) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(destinatario);
            helper.setSubject(assunto);
            helper.setText(corpo, true);
            mailSender.send(msg);
        } catch (Exception e) {
            log.error("Erro ao enviar email para {}: {}", destinatario, e.getMessage());
        }
    }

    private String buildEmail(String nome, String titulo, String mensagem, String codigo, String aviso) {
        return """
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head><meta charset="UTF-8"></head>
                <body style="margin:0;padding:0;background:#F8FAFC;font-family:Arial,sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 0;">
                    <tr><td align="center">
                      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.1);overflow:hidden;">
                        <tr>
                          <td style="background:#2563EB;padding:24px;text-align:center;">
                            <h1 style="color:#fff;margin:0;font-size:20px;">Oficina Inácio Adriano</h1>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:32px;">
                            <p style="color:#374151;font-size:16px;margin:0 0 8px;">Olá, <strong>%s</strong>!</p>
                            <h2 style="color:#111827;font-size:18px;margin:0 0 12px;">%s</h2>
                            <p style="color:#6B7280;font-size:14px;margin:0 0 24px;">%s</p>
                            <div style="text-align:center;margin:0 0 24px;">
                              <span style="display:inline-block;background:#EFF6FF;border:2px dashed #2563EB;border-radius:8px;padding:16px 32px;font-size:32px;font-weight:700;letter-spacing:8px;color:#2563EB;">%s</span>
                            </div>
                            <p style="color:#9CA3AF;font-size:12px;margin:0;text-align:center;">%s</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="background:#F9FAFB;padding:16px;text-align:center;border-top:1px solid #E5E7EB;">
                            <p style="color:#9CA3AF;font-size:12px;margin:0;">Oficina Inácio Adriano © 2026</p>
                          </td>
                        </tr>
                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """.formatted(nome, titulo, mensagem, codigo, aviso);
    }
}
