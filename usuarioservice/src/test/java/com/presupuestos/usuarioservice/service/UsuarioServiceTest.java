package com.presupuestos.usuarioservice.service;

import com.presupuestos.usuarioservice.dto.request.UsuarioRequestDto;
import com.presupuestos.usuarioservice.dto.response.UsuarioResponseDto;
import com.presupuestos.usuarioservice.model.Rol;
import com.presupuestos.usuarioservice.model.Usuario;
import com.presupuestos.usuarioservice.repository.UsuarioRepository;
import com.presupuestos.usuarioservice.service.impl.UsuarioServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private UsuarioServiceImpl usuarioService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void crearUsuario_deberiaGuardarUsuario() {
        UsuarioRequestDto requestDto = new UsuarioRequestDto();
        requestDto.setNombre("Manuel");
        requestDto.setEmail("correo@gmail.com");
        requestDto.setRol("ADMIN");
        requestDto.setActivo(true);
        Usuario usuario = new Usuario("Manuel", "correo@gmail.com", Rol.ADMIN, true);
        usuario.setId(1L);

        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuario);

        UsuarioResponseDto response = usuarioService.crearUsuario(requestDto);

        assertNotNull(response);
        assertEquals("Manuel", response.getNombre());
        assertEquals("correo@gmail.com", response.getEmail());
        assertEquals(Rol.ADMIN, response.getRol());
        assertTrue(response.isActivo());
    }

    @Test
    void obtenerUsuarios_deberiaRetornarListaUsuarios() {
        Usuario usuario = new Usuario("Manuel", "manuel@gmail.com", Rol.USUARIO, true);
        usuario.setId(1L);
        List<Usuario> usuarios = List.of(usuario);

        when(usuarioRepository.findAll()).thenReturn(usuarios);

        List<UsuarioResponseDto> resultado = usuarioService.listarUsuarios();

        assertEquals(1, resultado.size());
        assertEquals("Manuel", resultado.get(0).getNombre());
        verify(usuarioRepository, times(1)).findAll();
    }

    @Test
    void cambiarRol_deberiaActualizarRol() {
        Usuario superAdmin = new Usuario("Super", "super@gmail.com", Rol.SUPERADMIN, true);
        Usuario usuario = new Usuario("Manuel", "manuel@gmail.com", Rol.USUARIO, true);
        usuario.setId(1L);
        superAdmin.setId(2L);

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(usuarioRepository.findByEmail("super@gmail.com")).thenReturn(Optional.of(superAdmin));

        usuarioService.actualizarRolDeUsuario(1L, "ADMIN", "super@gmail.com");

        assertEquals(Rol.ADMIN, usuario.getRol());
        verify(usuarioRepository).save(usuario);
    }

    @Test
    void cambiarRol_usuarioNoEncontrado_deberiaLanzarExcepcion() {
        when(usuarioRepository.findById(99L)).thenReturn(Optional.empty());

        Exception exception = assertThrows(RuntimeException.class, () -> {
            usuarioService.actualizarRolDeUsuario(99L, "ADMIN", "super@gmail.com");
        });

        assertTrue(exception.getMessage().contains("Usuario solicitante no encontrado"));
    }

    @Test
    void cambiarRol_usuarioNoAutorizado_deberiaLanzarExcepcion() {
        Usuario noSuperAdmin = new Usuario("Admin", "admin@gmail.com", Rol.ADMIN, true);
        Usuario usuario = new Usuario("Manuel", "manuel@gmail.com", Rol.USUARIO, true);
        usuario.setId(1L);
        noSuperAdmin.setId(2L);

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(usuarioRepository.findByEmail("admin@gmail.com")).thenReturn(Optional.of(noSuperAdmin));

        Exception exception = assertThrows(RuntimeException.class, () -> {
            usuarioService.actualizarRolDeUsuario(1L, "ADMIN", "admin@gmail.com");
        });

        assertTrue(exception.getMessage().contains("No tienes permiso para cambiar roles."));
    }

    @Test
    void cambiarRol_rolInvalido_deberiaLanzarExcepcion() {
        Usuario superAdmin = new Usuario("Super", "super@gmail.com", Rol.SUPERADMIN, true);
        Usuario usuario = new Usuario("Manuel", "manuel@gmail.com", Rol.USUARIO, true);
        usuario.setId(1L);
        superAdmin.setId(2L);

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuario));
        when(usuarioRepository.findByEmail("super@gmail.com")).thenReturn(Optional.of(superAdmin));

        Exception exception = assertThrows(RuntimeException.class, () -> {
            usuarioService.actualizarRolDeUsuario(1L, "ROL_INVALIDO", "super@gmail.com");
        });

        assertTrue(exception.getMessage().contains("Rol inválido: ROL_INVALIDO"));
    }

    @Test
    void crearUsuario_emailYaExiste_deberiaLanzarExcepcion() {
        UsuarioRequestDto dto = new UsuarioRequestDto();
        dto.setEmail("correo@gmail.com");

        when(usuarioRepository.existsByEmail("correo@gmail.com")).thenReturn(true);

        Exception ex = assertThrows(IllegalArgumentException.class, () ->
                usuarioService.crearUsuario(dto)
        );

        assertEquals("Ya existe un usuario con ese email.", ex.getMessage());
    }

    @Test
    void eliminarUsuario_usuarioNoExiste_deberiaLanzarExcepcion() {
        Long id = 99L;
        when(usuarioRepository.existsById(id)).thenReturn(false);

        Exception ex = assertThrows(IllegalArgumentException.class, () ->
                usuarioService.eliminarUsuario(id)
        );

        assertEquals("Usuario no encontrado.", ex.getMessage());
    }

    @Test
    void eliminarUsuario_existente_deberiaEliminar() {
        Long id = 1L;
        when(usuarioRepository.existsById(id)).thenReturn(true);

        usuarioService.eliminarUsuario(id);

        verify(usuarioRepository).deleteById(id);
    }

    @Test
    void cambiarRol_modificarPropioRol_deberiaLanzarExcepcion() {
        Usuario superAdmin = new Usuario("Super", "super@gmail.com", Rol.SUPERADMIN, true);
        superAdmin.setId(1L); // El mismo ID del usuario a modificar

        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(superAdmin));
        when(usuarioRepository.findByEmail("super@gmail.com")).thenReturn(Optional.of(superAdmin));

        Exception ex = assertThrows(RuntimeException.class, () ->
                usuarioService.actualizarRolDeUsuario(1L, "ADMIN", "super@gmail.com")
        );

        assertEquals("No puedes modificar tu propio rol.", ex.getMessage());
    }

    @Test
    void cambiarRol_usuarioAModificarNoExiste_deberiaLanzarExcepcion() {
        Usuario superAdmin = new Usuario("Super", "super@gmail.com", Rol.SUPERADMIN, true);
        superAdmin.setId(2L);

        when(usuarioRepository.findById(1L)).thenReturn(Optional.empty());
        when(usuarioRepository.findByEmail("super@gmail.com")).thenReturn(Optional.of(superAdmin));

        Exception ex = assertThrows(RuntimeException.class, () ->
                usuarioService.actualizarRolDeUsuario(1L, "ADMIN", "super@gmail.com")
        );

        assertEquals("Usuario a modificar no encontrado", ex.getMessage());
    }
}