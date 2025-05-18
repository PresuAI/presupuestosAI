package com.presupuestos.usuarioservice.service;

import com.presupuestos.usuarioservice.dto.request.UsuarioRequestDto;
import com.presupuestos.usuarioservice.dto.response.UsuarioResponseDto;

public interface UsuarioService {
    UsuarioResponseDto crearUsuario(UsuarioRequestDto dto);
}
