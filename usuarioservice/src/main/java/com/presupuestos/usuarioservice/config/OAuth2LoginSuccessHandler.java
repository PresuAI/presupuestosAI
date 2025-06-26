package com.presupuestos.usuarioservice.config;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.presupuestos.usuarioservice.model.Usuario;
import com.presupuestos.usuarioservice.repository.UsuarioRepository;
import io.github.cdimascio.dotenv.Dotenv;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import jakarta.servlet.http.Cookie;

import java.io.IOException;
import java.util.Date;
import java.util.Optional;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final Dotenv dotenv;
    private final UsuarioRepository usuarioRepository;

    public OAuth2LoginSuccessHandler(Dotenv dotenv, UsuarioRepository usuarioRepository) {
        this.dotenv = dotenv;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        DefaultOAuth2User oauthUser = (DefaultOAuth2User) authentication.getPrincipal();
        String email = oauthUser.getAttribute("email");

        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmailAndActivoTrue(email);

        if (usuarioOpt.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Usuario no autorizado");
            return;
        }

        String token = JWT.create()
                .withSubject(email)
                .withIssuedAt(new Date())
                .withExpiresAt(new Date(System.currentTimeMillis() + 86400000))
                .sign(Algorithm.HMAC256(dotenv.get("JWT_SECRET")));

       /* response.setContentType("application/json");
        response.getWriter().write("{\"token\": \"" + token + "\"}"); */

        // 🔁 Redirigir con el token en la URL (solo para desarrollo)



        Cookie cookie = new Cookie("token", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // true si usás HTTPS
        cookie.setPath("/");
        cookie.setMaxAge(86400); // 1 día

        response.addCookie(cookie);

        // Redireccionar sin token en la URL
        response.sendRedirect("http://localhost:4200/login");

    }
}