package com.progra.tesis.fjchanataxi.service;

public interface MotorAlertasService {
    void evaluarVehiculo(Long vehiculoId);
    void evaluarPlan(Long planId);
    int evaluarTodosLosPlanes();
}
