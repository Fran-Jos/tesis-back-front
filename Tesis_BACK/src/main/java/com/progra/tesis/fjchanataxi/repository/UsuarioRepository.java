
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

/**
 * Repositorio de usuarios (autenticación, autorización y administración).
 */
@Repository
@Transactional
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    /**
     * Busca un usuario por su correo electrónico.
     * @param email correo a buscar (único)
     * @return Optional con el usuario si existe
     * Uso típico: login/autenticación.
     */
    Optional<Usuario> findByEmail(String email);
    Optional<Usuario> findByEmailIgnoreCase(String email);

    /**
     * Verifica si ya existe un usuario con el correo indicado.
     * @param email correo a validar
     * @return true si existe
     * Uso típico: evitar duplicados al crear.
     */
    boolean existsByEmail(String email);

    /**
     * Busca un usuario por su cédula.
     * @param cedula número de cédula
     * @return Optional con el usuario si existe
     */
    Optional<Usuario> findByCedula(String cedula);

    /**
     * Verifica si ya existe un usuario con la cédula indicada.
     * @param cedula número de cédula
     * @return true si existe
     */
    boolean existsByCedula(String cedula);

    /**
     * Lista usuarios por estado (ACTIVO/INACTIVO).
     * @param estado estado a filtrar
     * @return lista de usuarios
     */
    List<Usuario> findByEstado(EstadoUsuario estado);

    /**
     * Lista usuarios por rol (ADMIN/TECNICO/OPERADOR).
     * @param rol rol a filtrar
     * @return lista de usuarios
     */
    List<Usuario> findByRol(Rol rol);

    List<Usuario> findByNombreContainingIgnoreCase(String nombre);

    List<Usuario> findByApellidoContainingIgnoreCase(String apellido);

    List<Usuario> findByNombreContainingIgnoreCaseAndApellidoContainingIgnoreCase(String nombre, String apellido);

    @Query("select u from Usuario u where lower(u.nombre) like lower(concat('%', :token, '%')) " +
            "or lower(u.apellido) like lower(concat('%', :token, '%')) " +
            "or lower(u.email) like lower(concat('%', :token, '%')) " +
            "or lower(u.cedula) like lower(concat('%', :token, '%'))")
    List<Usuario> searchNombreApellidoEmailCedula(@Param("token") String token);

    /**
     * Búsqueda paginada por nombre, apellido o email (contiene, case-insensitive).
     * @param nombre texto a buscar en nombre
     * @param apellido texto a buscar en apellido
     * @param email texto a buscar en email
     * @param pageable paginación y orden
     * @return página de resultados
     * Uso típico: listados con buscador en la UI.
     */
    Page<Usuario> findByNombreContainingIgnoreCaseOrApellidoContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String nombre, String apellido, String email, Pageable pageable);
}
