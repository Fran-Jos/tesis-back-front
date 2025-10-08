package com.progra.tesis.fjchanataxi.config;

import com.progra.tesis.fjchanataxi.enums.EstadoUsuario;
import com.progra.tesis.fjchanataxi.enums.Rol;
import com.progra.tesis.fjchanataxi.model.Usuario;
import com.progra.tesis.fjchanataxi.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    CommandLineRunner initAdminUser() {
        return args -> {
            if (usuarioRepository.count() == 0) {
                Usuario admin = Usuario.builder()
                        .nombre("Administrador")
                        .apellido("Principal")
                        .email("admin@tesis.com")
                        .password(passwordEncoder.encode("Admin1234"))
                        .estado(EstadoUsuario.ACTIVO)
                        .rol(Rol.ADMIN)
                        .build();
                usuarioRepository.save(admin);
            }
        };
    }
}
