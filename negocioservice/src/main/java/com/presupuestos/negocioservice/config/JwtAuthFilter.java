package com.presupuestos.negocioservice.config;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import io.github.cdimascio.dotenv.Dotenv;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.beans.factory.annotation.Value;

import java.io.IOException;
import java.util.Collections;

// JwtAuthFilter.java
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final String jwtSecret;

    public JwtAuthFilter(@Value("${JWT_SECRET}") String jwtSecret) {
        this.jwtSecret = jwtSecret;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain)
            throws ServletException, IOException {

        // ✅ Dejá pasar el preflight sin tocar nada
        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
            res.setStatus(HttpServletResponse.SC_OK);
            chain.doFilter(req, res);
            return;
        }

        String token = null;

        if (req.getCookies() != null) {
            for (Cookie c : req.getCookies()) {
                if ("token".equals(c.getName())) {
                    token = c.getValue();
                    break;
                }
            }
        }
        if (token == null) {
            String h = req.getHeader("Authorization");
            if (h != null && h.startsWith("Bearer ")) token = h.substring(7);
        }

        if (token != null) {
            try {
                String email = JWT.require(Algorithm.HMAC256(jwtSecret))
                        .build()
                        .verify(token)
                        .getSubject();

                if (email != null) {
                    var auth = new UsernamePasswordAuthenticationToken(
                            email, null, Collections.emptyList());
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (Exception e) {
                // ⚠️ Importante: NO cierres la conexión abruptamente.
                res.resetBuffer();
                res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                res.setContentType("text/plain;charset=UTF-8");
                res.getWriter().write("Token inválido o expirado");
                res.flushBuffer();
                return;
            }
        }

        chain.doFilter(req, res);
    }
}

