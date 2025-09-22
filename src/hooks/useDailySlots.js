import { useEffect, useState } from "react";
import { availabilityService } from "../services/availabilityService";
import { bookingService } from "../services/bookingService";

const DEFAULT_TIME_SLOTS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
];

const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export function useDailySlots({
  enterpriseEmail,
  date,
  productId = null,
  employeeId = null,
}) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enterpriseEmail || !date) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const dateStr = formatDate(date);
        try {
          const result = await availabilityService.getAvailableSlots(
            enterpriseEmail,
            dateStr,
            productId,
            employeeId
          );
          if (cancelled) return;
          if (Array.isArray(result) && result.length) {
            const mapped = result.map((s) => ({
              time: s.startTime || s.time || s,
              endTime: s.endTime,
              isAvailable: s.isAvailable !== false,
            }));
            setSlots(mapped);
            setLoading(false);
            return;
          }
        } catch {
          // fallback silencioso
        }
        const bookings = await bookingService.getBookings(
          enterpriseEmail,
          dateStr
        );
        const booked = new Set();

        // Considerar apenas agendamentos ativos (não cancelados)
        const activeStatuses = [
          "scheduled",
          "confirmed",
          "in_progress",
          "agendado",
          "confirmado",
        ];

        (bookings?.data || bookings || []).forEach((b) => {
          if (b.startTime) {
            const isActive =
              !b.status || activeStatuses.includes(b.status.toLowerCase());

            // Se há employeeId especificado, filtrar apenas por esse funcionário
            const matchesEmployee =
              !employeeId || String(b.employeeId) === String(employeeId);

            if (isActive && matchesEmployee) {
              booked.add(b.startTime);

              console.log("🚫 Blocked time slot:", {
                time: b.startTime,
                employee: b.employeeId || b.staffName,
                service: b.productName,
                status: b.status,
                client: b.clientName,
              });
            }
          }
        });

        const mapped = DEFAULT_TIME_SLOTS.map((t) => ({
          time: t,
          isAvailable: !booked.has(t),
        }));
        if (!cancelled) setSlots(mapped);
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [enterpriseEmail, date, productId, employeeId]);

  return { slots, loading, error };
}
