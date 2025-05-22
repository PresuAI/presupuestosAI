package com.presupuestos.usuarioservice.service;

import com.presupuestos.usuarioservice.dto.request.UsuarioRequestDto;
import com.presupuestos.usuarioservice.dto.response.UsuarioResponseDto;

import java.util.List;

public interface UsuarioService {
    UsuarioResponseDto crearUsuario(UsuarioRequestDto dto);
    List<UsuarioResponseDto> listarUsuarios();
    void eliminarUsuario(Long id);
    void actualizarRolDeUsuario(Long id, String nuevoRolTexto, String emailSolicitante);
}
