package com.presupuestos.usuarioservice.mapper;

import com.presupuestos.usuarioservice.dto.request.UsuarioRequestDto;
import com.presupuestos.usuarioservice.dto.response.UsuarioResponseDto;
import com.presupuestos.usuarioservice.model.Rol;
import com.presupuestos.usuarioservice.model.Usuario;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class UsuarioMapperTest {

    @Test
    void toEntity_deberiaMapearCorrectamente() {
        UsuarioRequestDto dto = new UsuarioRequestDto();
        dto.setNombre("Manuel");
        dto.setEmail("manuel@gmail.com");
        dto.setRol("admin");
        dto.setActivo(true);

        Usuario usuario = UsuarioMapper.toEntity(dto);

        assertNotNull(usuario);
        assertEquals("Manuel", usuario.getNombre());
        assertEquals("manuel@gmail.com", usuario.getEmail());
        assertEquals(Rol.ADMIN, usuario.getRol());
        assertTrue(usuario.isActivo());
    }

    @Test
    void toDto_deberiaMapearCorrectamente() {
        Usuario usuario = new Usuario("Manuel", "manuel@gmail.com", Rol.ADMIN, true);
        usuario.setId(1L);

        UsuarioResponseDto dto = UsuarioMapper.toDto(usuario);

        assertNotNull(dto);
        assertEquals(1L, dto.getId());
        assertEquals("Manuel", dto.getNombre());
        assertEquals("manuel@gmail.com", dto.getEmail());
        assertEquals(Rol.ADMIN, dto.getRol());
        assertTrue(dto.isActivo());
    }
}
