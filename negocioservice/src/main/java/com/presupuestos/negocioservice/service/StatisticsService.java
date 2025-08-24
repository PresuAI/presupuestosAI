package com.presupuestos.negocioservice.service;

import com.presupuestos.negocioservice.dto.ProductoEstadisticaDTO;
import com.presupuestos.negocioservice.dto.TotalPorClienteDTO;

import java.math.BigDecimal;
import java.util.List;

public interface StatisticsService {
    BigDecimal calcularIngresoTotalUltimoMes();
    List<ProductoEstadisticaDTO> obtenerTopProductosVendidosUltimoMes();
    List<TotalPorClienteDTO> obtenerIngresosPorClienteUltimoMes();
}
