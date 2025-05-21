package com.presupuestos.usuarioservice.service.impl;

import com.presupuestos.usuarioservice.dto.request.UsuarioRequestDto;
import com.presupuestos.usuarioservice.dto.response.UsuarioResponseDto;
import com.presupuestos.usuarioservice.mapper.UsuarioMapper;
import com.presupuestos.usuarioservice.model.Usuario;
import com.presupuestos.usuarioservice.repository.UsuarioRepository;
import com.presupuestos.usuarioservice.service.UsuarioService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UsuarioServiceImpl implements UsuarioService {

    private final UsuarioRepository usuarioRepository;

    public UsuarioServiceImpl(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    @Transactional
    public UsuarioResponseDto crearUsuario(UsuarioRequestDto dto) {
        if (usuarioRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Ya existe un usuario con ese email.");
        }

        Usuario usuario = UsuarioMapper.toEntity(dto);
        Usuario guardado = usuarioRepository.save(usuario);
        return UsuarioMapper.toDto(guardado);
    }

    @Override
    public List<UsuarioResponseDto> listarUsuarios() {
        List<Usuario> usuarios = usuarioRepository.findAll();
        return usuarios.stream()
                .map(UsuarioMapper::toDto)
                .collect(Collectors.toList());
    }
    @Override
    public void eliminarUsuario(Long id) {
        if (!usuarioRepository.existsById(id)) {
            throw new IllegalArgumentException("Usuario no encontrado.");
        }
        usuarioRepository.deleteById(id);
    }
}
