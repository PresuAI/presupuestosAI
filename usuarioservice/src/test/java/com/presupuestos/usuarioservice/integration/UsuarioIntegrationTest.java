package com.presupuestos.usuarioservice.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.presupuestos.usuarioservice.config.DotenvTestConfig;
import com.presupuestos.usuarioservice.dto.request.ActualizarRolRequestDto;
import com.presupuestos.usuarioservice.model.Rol;
import com.presupuestos.usuarioservice.model.Usuario;
import com.presupuestos.usuarioservice.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Import(DotenvTestConfig.class)
@ActiveProfiles("test")
public class UsuarioIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @BeforeEach
    void setUp() {
        usuarioRepository.deleteAll();
        Usuario u1 = new Usuario("Manuel", "manuel@gmail.com", Rol.ADMIN, true);
        Usuario u2 = new Usuario("Santiago", "santiago@gmail.com", Rol.USUARIO, true);
        Usuario superadmin = new Usuario("Super", "super@admin.com", Rol.SUPERADMIN, true);
        usuarioRepository.saveAll(List.of(u1, u2, superadmin));
    }

    @Test
    @WithMockUser(username = "admin@gmail.com", roles = {"SUPERADMIN"})
    void obtenerUsuarios_deberiaRetornar200YListaCorrecta() throws Exception {
        mockMvc.perform(get("/api/usuarios")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size()", is(3)))
                .andExpect(jsonPath("$[0].email", is("manuel@gmail.com")))
                .andExpect(jsonPath("$[1].rol", is("USUARIO")));
    }

    @Test
    @WithMockUser(username = "admin@gmail.com", roles = {"ADMIN"})
    void crearUsuario_deberiaRetornar201YPersistirUsuario() throws Exception {
        String requestBody = """
        {
            "nombre": "Nuevo Usuario",
            "email": "nuevo@correo.com",
            "rol": "USUARIO",
            "activo": true
        }
    """;

        mockMvc.perform(post("/api/usuarios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("nuevo@correo.com"));

        List<Usuario> usuarios = usuarioRepository.findAll();
        assertTrue(usuarios.stream().anyMatch(u -> "nuevo@correo.com".equals(u.getEmail())));
    }

    @Test
    @WithMockUser(username = "admin@gmail.com", roles = {"ADMIN"})
    void crearUsuario_conDatosInvalidos_deberiaRetornar400() throws Exception {
        String invalidBody = """
        {
            "nombre": "",
            "email": "no-es-un-mail",
            "rol": "OTRO",
            "activo": true
        }
    """;

        mockMvc.perform(post("/api/usuarios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidBody))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "super@admin.com", roles = {"SUPERADMIN"})
    void asignarRol_deberiaActualizarRolYRetornar200() throws Exception {
        Usuario usuario = new Usuario("Manuel", "manuel@correo.com", Rol.USUARIO, true);
        usuario = usuarioRepository.save(usuario); // se genera el ID

        ActualizarRolRequestDto requestDto = new ActualizarRolRequestDto();
        requestDto.setNuevoRol("ADMIN");

        mockMvc.perform(put("/api/usuarios/" + usuario.getId() + "/rol")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isOk())
                .andExpect(content().string("Rol actualizado correctamente"));

        Usuario actualizado = usuarioRepository.findById(usuario.getId()).orElseThrow();
        assertEquals(Rol.ADMIN, actualizado.getRol());
    }

    @Test
    @WithMockUser(username = "user@correo.com", roles = {"USUARIO"})
    void asignarRol_conUsuarioComun_deberiaRetornar403() throws Exception {
        Usuario usuario = new Usuario("Otro", "otro@correo.com", Rol.USUARIO, true);
        usuario = usuarioRepository.save(usuario);

        ActualizarRolRequestDto requestDto = new ActualizarRolRequestDto();
        requestDto.setNuevoRol("ADMIN");

        mockMvc.perform(put("/api/usuarios/" + usuario.getId() + "/rol")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isForbidden());
    }

}