export interface PresupuestoItem {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  totalItem: number;
}
export interface PresupuestoRequest {
  clienteId: number;
  estado: string;
  tipoEvento: string;
  comentarios: string;
  gananciaEstimada: number;
  items: PresupuestoItem[];
}