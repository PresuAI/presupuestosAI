package com.presupuestos.usuarioservice.mapper;

import com.presupuestos.usuarioservice.dto.request.UsuarioRequestDto;
import com.presupuestos.usuarioservice.dto.response.UsuarioResponseDto;
import com.presupuestos.usuarioservice.model.Rol;
import com.presupuestos.usuarioservice.model.Usuario;

public class UsuarioMapper {

    public static Usuario toEntity(UsuarioRequestDto dto) {
        Usuario usuario = new Usuario();
        usuario.setNombre(dto.getNombre());
        usuario.setEmail(dto.getEmail());
        usuario.setRol(Rol.valueOf(dto.getRol().toUpperCase()));
        usuario.setActivo(dto.isActivo());
        return usuario;
    }

    public static UsuarioResponseDto toDto(Usuario usuario) {
        return new UsuarioResponseDto(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getEmail(),
                usuario.getRol(),
                usuario.isActivo()
        );
    }
}