import { OrderList } from "@/components/admin/OrderList";

export default function AdminOrdersPage() {
  return (
    <div>
      <h1 className="font-headline text-2xl text-oven mb-6">Bestellingen</h1>
      <OrderList />
    </div>
  );
}
