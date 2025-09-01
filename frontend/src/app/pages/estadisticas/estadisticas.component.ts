import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstadisticasService, ProductoEstadistica, TotalPorCliente } from '../../services/estadistica.service';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estadisticas.component.html',
  styleUrls: ['./estadisticas.component.scss']
})
export class EstadisticasComponent implements OnInit {
  cargando = false;
  errorMsg: string | null = null;

  ingresoUltimoMes: number | string = 0;
  topProductos: ProductoEstadistica[] = [];
  ingresosClientes: TotalPorCliente[] = [];

  constructor(private stats: EstadisticasService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.errorMsg = null;

    // Pedimos en paralelo
    Promise.all([
      this.stats.ingresosMensuales().toPromise(),
      this.stats.productosTop().toPromise(),
      this.stats.ingresosPorCliente().toPromise()
    ])
      .then(([ingreso, productos, clientes]) => {
        this.ingresoUltimoMes = ingreso ?? 0;
        this.topProductos = productos ?? [];
        this.ingresosClientes = (clientes ?? []).sort(
          (a, b) => Number(b.total) - Number(a.total)
        );
      })
      .catch((err) => {
        console.error('[ESTADISTICAS] error:', err);
        this.errorMsg = 'No se pudieron cargar las estadísticas.';
      })
      .finally(() => (this.cargando = false));
  }

  // Para la barra proporcional (productos top)
  maxCantidad(): number {
    return this.topProductos.reduce((m, p) => Math.max(m, p.cantidad), 0) || 1;
  }

  // Formateo simple de moneda (UYU)
  money(v: number | string): string {
    const n = Number(v);
    if (Number.isNaN(n)) return String(v);
    return n.toLocaleString('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 });
  }
}
