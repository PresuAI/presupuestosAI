package com.presupuestos.usuarioservice.controller;

import com.presupuestos.usuarioservice.dto.request.ActualizarRolRequestDto;
import com.presupuestos.usuarioservice.dto.request.UsuarioRequestDto;
import com.presupuestos.usuarioservice.dto.response.UsuarioResponseDto;
import com.presupuestos.usuarioservice.model.Rol;
import com.presupuestos.usuarioservice.model.Usuario;
import com.presupuestos.usuarioservice.service.UsuarioService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;


import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping
    public ResponseEntity<UsuarioResponseDto> crearUsuario(@Valid @RequestBody UsuarioRequestDto dto) {
        UsuarioResponseDto creado = usuarioService.crearUsuario(dto);
        return new ResponseEntity<>(creado, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<UsuarioResponseDto>> obtenerUsuarios() {
        List<UsuarioResponseDto> usuarios = usuarioService.listarUsuarios();
        return ResponseEntity.ok(usuarios);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarUsuario(@PathVariable Long id) {
        usuarioService.eliminarUsuario(id);
        return ResponseEntity.noContent().build(); // 204 No Content
    }

    @PutMapping("/{id}/rol")
    public ResponseEntity<String> actualizarRol(
            @PathVariable Long id,
            @RequestBody @Valid ActualizarRolRequestDto request
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String emailActual = authentication.getName();
        System.out.println("Usuario autenticado: " + emailActual);
        try {
            usuarioService.actualizarRolDeUsuario(id, request.getNuevoRol(), emailActual);
            return ResponseEntity.ok("Rol actualizado correctamente");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    @GetMapping("/validar-sesion")
    public ResponseEntity<?> validarSesion(@AuthenticationPrincipal String email) {
        return ResponseEntity.ok().body("Sesión válida para: " + email);
    }

}
