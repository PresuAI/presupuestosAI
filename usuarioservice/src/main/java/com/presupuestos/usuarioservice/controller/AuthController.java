package com.presupuestos.usuarioservice.controller;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @GetMapping("/validar-cookie")
    public ResponseEntity<Void> validarCookie(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) {
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.status(401).build();
        }
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
        tokenCookie.setSecure(false); // true en prod si usás HTTPS
        tokenCookie.setPath("/");
        tokenCookie.setMaxAge(0);
        response.addCookie(tokenCookie);

        Cookie jsession = new Cookie("JSESSIONID", "");
        jsession.setHttpOnly(true);
        jsession.setSecure(false);
        jsession.setPath("/");
        jsession.setMaxAge(0);
        response.addCookie(jsession);

        return ResponseEntity.ok().build();
    }
}
