import { ReservationList } from "@/components/admin/ReservationList";

export default function AdminReservationsPage() {
  return (
    <div>
      <h1 className="font-headline text-2xl text-oven mb-6">Reserveringen</h1>
      <ReservationList />
    </div>
  );
}
