package com.progra.tesis.fjchanataxi.dto.dashboard;

import com.progra.tesis.fjchanataxi.enums.EstadoTarea;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardTareaDTO {

    private Long id;
    private String nombre;
    private EstadoTarea estado;
    private String asignadoANombre;
}
