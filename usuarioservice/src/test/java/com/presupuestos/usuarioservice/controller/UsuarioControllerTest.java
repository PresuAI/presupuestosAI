package com.presupuestos.usuarioservice.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.presupuestos.usuarioservice.config.DotenvTestConfig;
import com.presupuestos.usuarioservice.dto.request.ActualizarRolRequestDto;
import com.presupuestos.usuarioservice.dto.request.UsuarioRequestDto;
import com.presupuestos.usuarioservice.dto.response.UsuarioResponseDto;
import com.presupuestos.usuarioservice.model.Rol;
import com.presupuestos.usuarioservice.service.UsuarioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UsuarioController.class)
@Import(DotenvTestConfig.class)
@AutoConfigureMockMvc(addFilters = false)
class UsuarioControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UsuarioService usuarioService;

    @Autowired
    private ObjectMapper objectMapper;

    private UsuarioResponseDto usuarioDto;

    @BeforeEach
    void setUp() {
        usuarioDto = new UsuarioResponseDto(1L, "Manuel", "manuel@gmail.com", Rol.ADMIN, true);
    }

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"SUPERADMIN"})
    void crearUsuario_deberiaRetornar201() throws Exception {
        UsuarioRequestDto request = new UsuarioRequestDto();
        request.setNombre("Manuel");
        request.setEmail("manuel@gmail.com");
        request.setRol("ADMIN");
        request.setActivo(true);

        Mockito.when(usuarioService.crearUsuario(any(UsuarioRequestDto.class)))
                .thenReturn(usuarioDto);

        mockMvc.perform(post("/api/usuarios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("manuel@gmail.com"));
    }

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"SUPERADMIN"})
    void obtenerUsuarios_deberiaRetornarListaUsuarios() throws Exception {
        Mockito.when(usuarioService.listarUsuarios()).thenReturn(List.of(usuarioDto));

        mockMvc.perform(get("/api/usuarios"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(1))
                .andExpect(jsonPath("$[0].email").value("manuel@gmail.com"));
    }

    @Test
    @WithMockUser(username = "test@gmail.com", roles = {"SUPERADMIN"})
    void eliminarUsuario_deberiaRetornar204() throws Exception {
        mockMvc.perform(delete("/api/usuarios/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    void actualizarRol_deberiaRetornar200() throws Exception {
        ActualizarRolRequestDto request = new ActualizarRolRequestDto();
        request.setNuevoRol("ADMIN");

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "super@gmail.com", null,
                        List.of(new SimpleGrantedAuthority("ROLE_SUPERADMIN"))
                )
        );

        mockMvc.perform(put("/api/usuarios/1/rol")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().string("Rol actualizado correctamente"));
    }

    @Test
    void actualizarRol_deberiaRetornar403CuandoLanzaExcepcion() throws Exception {
        ActualizarRolRequestDto request = new ActualizarRolRequestDto();
        request.setNuevoRol("ADMIN");

        Mockito.doThrow(new RuntimeException("No tienes permiso"))
                .when(usuarioService).actualizarRolDeUsuario(anyLong(), anyString(), anyString());

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "admin@gmail.com", null,
                        List.of(new SimpleGrantedAuthority("ROLE_USUARIO"))
                )
        );

        mockMvc.perform(put("/api/usuarios/1/rol")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(content().string("No tienes permiso"));
    }

}