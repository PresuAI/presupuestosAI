export interface PresupuestoItem {
  productoId: number | null;
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
export interface PresupuestoResponse {
  id: number;
  clienteNombre: string;
  tipoEvento: string;
  estado: string;
  comentarios: string;
  gananciaEstimada: number;
  items: PresupuestoItem[];
}