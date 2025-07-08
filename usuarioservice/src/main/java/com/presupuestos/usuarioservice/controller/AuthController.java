package com.presupuestos.usuarioservice.controller;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.presupuestos.usuarioservice.dto.request.LoginRequestDto;
import com.presupuestos.usuarioservice.dto.request.UsuarioRequestDto;
import com.presupuestos.usuarioservice.model.Usuario;
import com.presupuestos.usuarioservice.repository.UsuarioRepository;
import com.presupuestos.usuarioservice.service.UsuarioService;
import io.github.cdimascio.dotenv.Dotenv;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UsuarioService usuarioService;
    private final UsuarioRepository usuarioRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    private final Dotenv dotenv;

    public AuthController(UsuarioRepository usuarioRepository, Dotenv dotenv) {
        this.usuarioRepository = usuarioRepository;
        this.dotenv = dotenv;
    }

    @GetMapping("/validar-cookie")
    public ResponseEntity<Void> validarCookie(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) {
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.status(401).build();
        }
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody UsuarioRequestDto dto) {
        usuarioService.crearUsuario(dto);
        return ResponseEntity.ok("Usuario registrado correctamente");
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) {
        SecurityContextHolder.clearContext();
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        Cookie tokenCookie = new Cookie("token", "");
        tokenCookie.setHttpOnly(true);
        tokenCookie.setSecure(true); // true en prod si usás HTTPS
        tokenCookie.setPath("/");
        tokenCookie.setMaxAge(0);

        response.addHeader("Set-Cookie",
                "token=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None");

        Cookie jsession = new Cookie("JSESSIONID", "");
        jsession.setHttpOnly(true);
        jsession.setSecure(true);
        jsession.setPath("/");
        jsession.setMaxAge(0);

        response.addHeader("Set-Cookie",
                "JSESSIONID=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None");

        return ResponseEntity.ok().build();
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody LoginRequestDto dto, HttpServletResponse response) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmailAndActivoTrue(dto.getEmail());

        if (usuarioOpt.isEmpty() || !passwordEncoder.matches(dto.getPassword(), usuarioOpt.get().getPassword())) {
            return ResponseEntity.status(HttpServletResponse.SC_UNAUTHORIZED).body(Map.of("mensaje", "Credenciales invalidas"));
        }

        String token = JWT.create()
                .withSubject(dto.getEmail())
                .withIssuedAt(new Date())
                .withExpiresAt(new Date(System.currentTimeMillis() + 86400000))
                .sign(Algorithm.HMAC256(dotenv.get("JWT_SECRET")));

        Cookie cookie = new Cookie("token", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(true); // HTTPS
        cookie.setPath("/");
        cookie.setMaxAge(86400); // 1 día

        response.addHeader("Set-Cookie",
                "token=" + token + "; Path=/; Max-Age=86400; HttpOnly; Secure; SameSite=None");

        return ResponseEntity.ok(Map.of("mensaje", "Login exitoso"));
    }

}
