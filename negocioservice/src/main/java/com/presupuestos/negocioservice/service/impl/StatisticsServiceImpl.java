package com.presupuestos.negocioservice.service.impl;

import com.presupuestos.negocioservice.dto.ProductoEstadisticaDTO;
import com.presupuestos.negocioservice.dto.ProductoResponseDTO;
import com.presupuestos.negocioservice.dto.TotalPorClienteDTO;
import com.presupuestos.negocioservice.model.Presupuesto;
import com.presupuestos.negocioservice.model.PresupuestoItem;
import com.presupuestos.negocioservice.model.Cliente;
import com.presupuestos.negocioservice.repository.PresupuestoRepository;
import com.presupuestos.negocioservice.repository.ClienteRepository;
import com.presupuestos.negocioservice.service.StatisticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StatisticsServiceImpl implements StatisticsService {

    private final PresupuestoRepository presupuestoRepository;
    private final ClienteRepository clienteRepository;

    public StatisticsServiceImpl(PresupuestoRepository presupuestoRepository, ClienteRepository clienteRepository) {
        this.presupuestoRepository = presupuestoRepository;
        this.clienteRepository = clienteRepository;
    }

    @Override
    public BigDecimal calcularIngresoTotalUltimoMes() {
        LocalDateTime haceUnMes = LocalDateTime.now().minusMonths(1);
        List<Presupuesto> presupuestos = presupuestoRepository.findByEstadoAndFechaCreacionAfter("APROBADO", haceUnMes);

        return presupuestos.stream()
                .flatMap(p -> p.getItems().stream())
                .map(item -> item.getPrecioUnitario().multiply(BigDecimal.valueOf(item.getCantidad())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Override
    public List<ProductoEstadisticaDTO> obtenerTopProductosVendidosUltimoMes() {
        LocalDateTime haceUnMes = LocalDateTime.now().minusMonths(1);
        List<Presupuesto> presupuestos = presupuestoRepository.findByEstadoAndFechaCreacionAfter("APROBADO", haceUnMes);

        Map<Long, Integer> cantidadPorProducto = new HashMap<>();

        for (Presupuesto presupuesto : presupuestos) {
            for (PresupuestoItem item : presupuesto.getItems()) {
                cantidadPorProducto.merge(item.getProductoId(), item.getCantidad(), Integer::sum);
            }
        }

        Map<Long, String> mapaNombres = obtenerMapaNombresProductos();

        return cantidadPorProducto.entrySet().stream()
                .sorted(Map.Entry.<Long, Integer>comparingByValue().reversed())
                .limit(5)
                .map(entry -> {
                    String nombre = mapaNombres.getOrDefault(entry.getKey(), "Producto #" + entry.getKey());
                    return new ProductoEstadisticaDTO(nombre, entry.getValue());
                })
                .collect(Collectors.toList());
    }


    private Map<Long, String> obtenerMapaNombresProductos() {
        try {
            ResponseEntity<ProductoResponseDTO[]> response = new RestTemplate()
                    .getForEntity("http://productoservice:8082/api/productos", ProductoResponseDTO[].class);

            ProductoResponseDTO[] productos = response.getBody();
            if (productos == null) return Collections.emptyMap();
            return Arrays.stream(productos)
                    .collect(Collectors.toMap(ProductoResponseDTO::getId, ProductoResponseDTO::getNombre));

        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }


    @Override
    public List<TotalPorClienteDTO> obtenerIngresosPorClienteUltimoMes() {
        LocalDateTime haceUnMes = LocalDateTime.now().minusMonths(1);
        List<Presupuesto> presupuestos = presupuestoRepository.findByEstadoAndFechaCreacionAfter("APROBADO", haceUnMes);

        Map<Long, BigDecimal> ingresosPorCliente = new HashMap<>();

        for (Presupuesto presupuesto : presupuestos) {
            Long clienteId = presupuesto.getClienteId();
            BigDecimal totalPresupuesto = presupuesto.getItems().stream()
                    .map(item -> item.getPrecioUnitario().multiply(BigDecimal.valueOf(item.getCantidad())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            ingresosPorCliente.merge(clienteId, totalPresupuesto, BigDecimal::add);
        }

        return ingresosPorCliente.entrySet().stream()
                .map(entry -> {
                    Cliente cliente = clienteRepository.findById(entry.getKey()).orElse(null);
                    if (cliente != null) {
                        return new TotalPorClienteDTO(entry.getKey(), cliente.getNombre(), entry.getValue());
                    }
                    return null;
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }
}
