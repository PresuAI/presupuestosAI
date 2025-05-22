package com.presupuestos.usuarioservice.repository;

import com.presupuestos.usuarioservice.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    boolean existsByEmail(String email);
    Optional<Usuario> findByEmailAndActivoTrue(String email);

    Optional<Object> findByEmail(String email);
}