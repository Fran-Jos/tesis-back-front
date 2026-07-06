package com.progra.tesis.fjchanataxi.model;

import com.progra.tesis.fjchanataxi.enums.EstadoUsuario;
import com.progra.tesis.fjchanataxi.enums.Rol;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"registrosKilometraje","ordenesCreadas","ordenesComoResponsable","tareasAsignadas","alertasCreadas"})
@Entity
@Table(name = "usuario")
public class Usuario {
    @Id
    @SequenceGenerator(name = "usu_seq", sequenceName = "usu_seq", allocationSize = 1)
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "usu_seq")
    @EqualsAndHashCode.Include
    @Column(name = "usu_id")
    private Long id;
    @NotBlank
    @Column(name = "usu_nombre", nullable = false)
    private String nombre;
    @NotBlank
    @Column(name = "usu_apellido", nullable = false)
    private String apellido;
    @Column(name = "usu_cedula", unique = true)
    private String cedula;
    @Column(name = "usu_celular", length = 20)
    private String numeroCelular;
    @Email @NotBlank
    @Column(name = "usu_email", unique = true, nullable = false)
    private String email;
    @NotBlank
    @Column(name = "usu_password", nullable = false)
    private String password;
    @Enumerated(EnumType.STRING)
    @Column(name = "usu_rol", nullable = false)
    private Rol rol;
    @Enumerated(EnumType.STRING)
    @Column(name = "usu_estado", nullable = false)
    private EstadoUsuario estado;
    // Relaciones
    @Builder.Default
    @OneToMany(mappedBy = "usuario", fetch = FetchType.LAZY)
    private List<RegistroKilometraje> registrosKilometraje = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "creadoPor", fetch = FetchType.LAZY)
    private List<OrdenMantenimiento> ordenesCreadas = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "responsable", fetch = FetchType.LAZY)
    private List<OrdenMantenimiento> ordenesComoResponsable = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "asignadoA", fetch = FetchType.LAZY)
    private List<Tarea> tareasAsignadas = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "creadaPor", fetch = FetchType.LAZY)
    private List<Alerta> alertasCreadas = new ArrayList<>();
}
