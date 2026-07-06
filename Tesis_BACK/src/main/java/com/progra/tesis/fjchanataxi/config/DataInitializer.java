// java
package com.progra.tesis.fjchanataxi.config;

import com.progra.tesis.fjchanataxi.enums.EstadoUsuario;
import com.progra.tesis.fjchanataxi.enums.Rol;
import com.progra.tesis.fjchanataxi.model.Usuario;
import com.progra.tesis.fjchanataxi.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initAdminUser(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            crearUsuarioSiNoExiste(usuarioRepository, passwordEncoder,
                    "admin@tesis.com", "Administrador", "Principal", "0991001000", Rol.ADMIN, "Admin1234");

            crearUsuarioSiNoExiste(usuarioRepository, passwordEncoder,
                    "operador@tesis.com", "operador", "OP", "0992002000", Rol.OPERADOR, "Operador123");

            crearUsuarioSiNoExiste(usuarioRepository, passwordEncoder,
                    "tecnico@tesis.com", "Tecnico", "TEC", "0993003000", Rol.TECNICO, "Tecnico123");
        };
    }

    private void crearUsuarioSiNoExiste(UsuarioRepository usuarioRepository,
                                        PasswordEncoder passwordEncoder,
                                        String email,
                                        String nombre,
                                        String apellido,
                                        String celular,
                                        Rol rol,
                                        String passwordPlano) {
        if (usuarioRepository.existsByEmail(email)) {
            return;
        }

        Usuario usuario = Usuario.builder()
                .nombre(nombre)
                .apellido(apellido)
                .numeroCelular(celular)
                .email(email)
                .password(passwordEncoder.encode(passwordPlano))
                .estado(EstadoUsuario.ACTIVO)
                .rol(rol)
                .build();

        usuarioRepository.save(usuario);
    }
}
