package com.presupuestos.negocioservice.controller;

import com.presupuestos.negocioservice.dto.ProductoEstadisticaDTO;
import com.presupuestos.negocioservice.dto.TotalPorClienteDTO;
import com.presupuestos.negocioservice.service.StatisticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/estadisticas")
public class StatisticsController {

    private final StatisticsService statisticsService;

    public StatisticsController(StatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }

    @GetMapping("/ingresos-mensuales")
    public ResponseEntity<BigDecimal> obtenerIngresoTotalUltimoMes() {
        return ResponseEntity.ok(statisticsService.calcularIngresoTotalUltimoMes());
    }

    @GetMapping("/productos-top")
    public ResponseEntity<List<ProductoEstadisticaDTO>> obtenerTopProductos() {
        return ResponseEntity.ok(statisticsService.obtenerTopProductosVendidosUltimoMes());
    }

    @GetMapping("/ingresos-por-cliente")
    public ResponseEntity<List<TotalPorClienteDTO>> obtenerIngresosPorCliente() {
        return ResponseEntity.ok(statisticsService.obtenerIngresosPorClienteUltimoMes());
    }
}
