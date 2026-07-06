
package com.progra.tesis.fjchanataxi.repository;

import com.progra.tesis.fjchanataxi.enums.EstadoUsuario;
import com.progra.tesis.fjchanataxi.enums.Rol;
import com.progra.tesis.fjchanataxi.model.Usuario;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
@Repository
@Transactional
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByEmail(String email);
    Optional<Usuario> findByEmailIgnoreCase(String email);

    boolean existsByEmail(String email);
    Optional<Usuario> findByCedula(String cedula);
    boolean existsByCedula(String cedula);
    List<Usuario> findByEstado(EstadoUsuario estado);
    List<Usuario> findByRol(Rol rol);
    List<Usuario> findByNombreContainingIgnoreCase(String nombre);
    List<Usuario> findByApellidoContainingIgnoreCase(String apellido);
    List<Usuario> findByNombreContainingIgnoreCaseAndApellidoContainingIgnoreCase(String nombre, String apellido);

    @Query("select u from Usuario u where lower(u.nombre) like lower(concat('%', :token, '%')) " +
            "or lower(u.apellido) like lower(concat('%', :token, '%')) " +
            "or lower(u.email) like lower(concat('%', :token, '%')) " +
            "or lower(u.cedula) like lower(concat('%', :token, '%'))")
    List<Usuario> searchNombreApellidoEmailCedula(@Param("token") String token);


     // Búsqueda paginada por nombre, apellido o email (contiene, case-insensitive).
    Page<Usuario> findByNombreContainingIgnoreCaseOrApellidoContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String nombre, String apellido, String email, Pageable pageable);
}
