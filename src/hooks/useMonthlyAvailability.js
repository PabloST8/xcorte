import { useEffect, useState } from "react";
import { bookingService } from "../services/bookingService";

const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

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

export function useMonthlyAvailability({ enterpriseEmail, monthDate }) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enterpriseEmail || !monthDate) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        const fetchPromises = [];

        for (let day = 1; day <= daysInMonth; day++) {
          const dateObj = new Date(year, month, day);
          const dateStr = formatDate(dateObj);
          const isSunday = dateObj.getDay() === 0;
          const isPast =
            dateObj <
            new Date(today.getFullYear(), today.getMonth(), today.getDate());
          fetchPromises.push(
            (async () => {
              if (isSunday) {
                return [
                  dateStr,
                  {
                    totalSlots: 0,
                    bookedSlots: 0,
                    availableSlots: 0,
                    status: isPast ? "past" : "closed",
                  },
                ];
              }
              if (isPast) {
                return [
                  dateStr,
                  {
                    totalSlots: DEFAULT_TIME_SLOTS.length,
                    bookedSlots: 0,
                    availableSlots: 0,
                    status: "past",
                  },
                ];
              }
              try {
                const bookings = await bookingService.getBookings(
                  enterpriseEmail,
                  dateStr
                );
                const bookedTimes = new Set();
                (bookings || []).forEach((b) => {
                  if (b.startTime) bookedTimes.add(b.startTime);
                });
                const bookedSlots = bookedTimes.size;
                const totalSlots = DEFAULT_TIME_SLOTS.length;
                const availableSlots = totalSlots - bookedSlots;
                let status = "empty";
                if (bookedSlots === 0) status = "empty";
                else if (availableSlots === 0) status = "full";
                else status = "partial";
                return [
                  dateStr,
                  { totalSlots, bookedSlots, availableSlots, status },
                ];
              } catch (err) {
                return [
                  dateStr,
                  {
                    totalSlots: DEFAULT_TIME_SLOTS.length,
                    bookedSlots: 0,
                    availableSlots: DEFAULT_TIME_SLOTS.length,
                    status: "error",
                    message: err?.message || "Erro",
                  },
                ];
              }
            })()
          );
        }
        const entries = await Promise.all(fetchPromises);
        if (cancelled) return;
        setData(Object.fromEntries(entries));
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
  }, [enterpriseEmail, monthDate]);

  return { monthly: data, loading, error };
}
