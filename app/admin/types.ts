// app/admin/types.ts

export type OrderStatus = "NEW" | "PICKED" | "READY" | "DELIVERED";

export interface Order {
  id: string;
  created_at: string;
  customer_name: string;
  phone: string;
  society_name: string;
  flat_number: string;
  block?: string | null;
  pickup_date: string;
  pickup_slot: string;
  express_delivery: boolean;
  self_drop: boolean;
  notes: string | null;
  items_estimated_total: number | null;
  delivery_charge: number | null;
  express_charge: number | null;
  estimated_total: number | null;
  status: OrderStatus;
  total_price: number | null;
  worker_name?: string | null;
  base_amount?: number | null;
  items_json?: Record<string, number> | null;
}

export type AdminTab =
  | "DASHBOARD"
  | "ORDERS"
  | "WALKIN"
  | "PICKUP"
  | "READY";


export interface Summary {
  from: string;
  to: string;
  totalOrders: number;
  totalRevenue: number;
  statusCounts: Record<OrderStatus, number>;
  revenueByWorker: Record<string, number>;
}
