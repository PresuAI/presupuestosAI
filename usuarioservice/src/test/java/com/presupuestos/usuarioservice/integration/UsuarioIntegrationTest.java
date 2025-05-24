package com.presupuestos.usuarioservice.integration;

import com.presupuestos.usuarioservice.config.DotenvTestConfig;
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
import org.springframework.test.context.TestPropertySource;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Import(DotenvTestConfig.class)
@ActiveProfiles("test")
public class UsuarioIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @BeforeEach
    void setUp() {
        usuarioRepository.deleteAll();
        Usuario u1 = new Usuario("Manuel", "manuel@gmail.com", Rol.ADMIN, true);
        Usuario u2 = new Usuario("Santiago", "santiago@gmail.com", Rol.USUARIO, true);
        usuarioRepository.saveAll(List.of(u1, u2));
    }

    @Test
    @WithMockUser(username = "admin@gmail.com", roles = {"SUPERADMIN"})
    void obtenerUsuarios_deberiaRetornar200YListaCorrecta() throws Exception {
        mockMvc.perform(get("/api/usuarios")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size()", is(2)))
                .andExpect(jsonPath("$[0].email", is("manuel@gmail.com")))
                .andExpect(jsonPath("$[1].rol", is("USUARIO")));
    }
}