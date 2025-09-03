import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Scissors,
  Check,
} from "lucide-react";
import { formatPrice } from "../types/api.js";
import { allServices, staffMembers } from "../data/services.js";

function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [step, setStep] = useState(1); // 1: date, 2: time, 3: service, 4: barber, 5: confirmation

  // Usar dados dos serviços já alinhados com API
  const services = allServices.map((service) => ({
    id: service.id,
    name: service.name,
    price: formatPrice(service.price),
    duration: service.duration, // já em minutos
    category: service.category,
    description: service.description,
  }));

  // Usar dados dos barbeiros já alinhados com API
  const barbers = staffMembers.map((member) => ({
    id: member.id,
    name: member.name,
    specialty: member.specialty,
    rating: member.rating,
    image: member.image,
  }));

  // Horários disponíveis (usar TimeSlot format no futuro)
  const timeSlots = [
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

  // Gerar calendário
  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Dias vazios do início
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Dias do mês
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isPast = date < today.setHours(0, 0, 0, 0);
      const isWeekend = date.getDay() === 0; // Domingo fechado
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      days.push({
        day,
        date,
        isPast,
        isWeekend,
        isToday,
        isAvailable: !isPast && !isWeekend,
      });
    }

    return days;
  };

  const calendarDays = generateCalendar();
  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  const handleDateSelect = (date) => {
    if (date.isAvailable) {
      setSelectedDate(date.date);
      setStep(2);
    }
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setStep(3);
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setStep(4);
  };

  const handleBarberSelect = (barber) => {
    setSelectedBarber(barber);
    setStep(5);
  };

  const confirmAppointment = () => {
    // Aqui você salvaria o agendamento
    alert("Agendamento confirmado!");
    // Reset
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedService(null);
    setSelectedBarber(null);
    setStep(1);
  };

  const resetBooking = () => {
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedService(null);
    setSelectedBarber(null);
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center px-4 py-4">
          <Link to="/" className="mr-4">
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Agendar Horário</h1>
        </div>
      </header>

      <div className="px-4 py-6">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            {[1, 2, 3, 4, 5].map((stepNumber) => (
              <div
                key={stepNumber}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= stepNumber
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {stepNumber}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Data</span>
            <span>Horário</span>
            <span>Serviço</span>
            <span>Barbeiro</span>
            <span>Confirmar</span>
          </div>
        </div>

        {/* Step 1: Date Selection */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <button onClick={previousMonth}>
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </button>
              <h2 className="text-lg font-bold">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button onClick={nextMonth}>
                <ChevronRight className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-gray-500 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div key={index} className="aspect-square"></div>;
                }

                let dayClass =
                  "aspect-square flex items-center justify-center text-sm rounded-lg border cursor-pointer ";

                if (day.isPast) {
                  dayClass +=
                    "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed";
                } else if (day.isWeekend) {
                  dayClass +=
                    "bg-red-100 text-red-400 border-red-200 cursor-not-allowed";
                } else if (day.isToday) {
                  dayClass += "bg-blue-600 text-white border-blue-600";
                } else if (day.isAvailable) {
                  dayClass +=
                    "bg-white text-gray-900 border-gray-200 hover:bg-blue-50 hover:border-blue-300";
                }

                return (
                  <div
                    key={index}
                    className={dayClass}
                    onClick={() => handleDateSelect(day)}
                  >
                    {day.day}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-center space-x-6 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-white border border-gray-200 rounded mr-2"></div>
                <span className="text-gray-600">Disponível</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-100 border border-red-200 rounded mr-2"></div>
                <span className="text-gray-600">Fechado</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Time Selection */}
        {step === 2 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Selecione o horário
            </h2>
            <p className="text-gray-600 mb-6">
              {selectedDate?.toLocaleDateString("pt-BR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>

            <div className="grid grid-cols-3 gap-3">
              {timeSlots.map((time) => {
                const isUnavailable = Math.random() > 0.7; // Simular horários ocupados
                return (
                  <button
                    key={time}
                    onClick={() => !isUnavailable && handleTimeSelect(time)}
                    disabled={isUnavailable}
                    className={`p-3 rounded-lg border text-center ${
                      isUnavailable
                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                        : selectedTime === time
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-900 border-gray-200 hover:bg-blue-50"
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep(1)}
              className="mt-6 w-full bg-gray-200 text-gray-700 py-3 rounded-lg"
            >
              Voltar
            </button>
          </div>
        )}

        {/* Step 3: Service Selection */}
        {step === 3 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center">
              <Scissors className="w-5 h-5 mr-2" />
              Escolha o serviço
            </h2>

            <div className="space-y-3">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleServiceSelect(service)}
                  className={`w-full p-4 rounded-lg border text-left ${
                    selectedService?.id === service.id
                      ? "bg-blue-50 border-blue-300"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{service.name}</h3>
                      <p className="text-sm text-gray-600">
                        {service.duration} min
                      </p>
                    </div>
                    <span className="font-bold text-blue-600">
                      {service.price}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              className="mt-6 w-full bg-gray-200 text-gray-700 py-3 rounded-lg"
            >
              Voltar
            </button>
          </div>
        )}

        {/* Step 4: Barber Selection */}
        {step === 4 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Escolha o barbeiro
            </h2>

            <div className="space-y-3">
              {barbers.map((barber) => (
                <button
                  key={barber.id}
                  onClick={() => handleBarberSelect(barber)}
                  className={`w-full p-4 rounded-lg border text-left ${
                    selectedBarber?.id === barber.id
                      ? "bg-blue-50 border-blue-300"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{barber.name}</h3>
                      <p className="text-sm text-gray-600">
                        {barber.specialty}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center">
                        <span className="text-yellow-400 mr-1">⭐</span>
                        <span className="text-sm font-medium">
                          {barber.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(3)}
              className="mt-6 w-full bg-gray-200 text-gray-700 py-3 rounded-lg"
            >
              Voltar
            </button>
          </div>
        )}

        {/* Step 5: Confirmation */}
        {step === 5 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-6 flex items-center">
              <Check className="w-5 h-5 mr-2" />
              Confirmar agendamento
            </h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Data:</span>
                <span className="font-medium">
                  {selectedDate?.toLocaleDateString("pt-BR")}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Horário:</span>
                <span className="font-medium">{selectedTime}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Serviço:</span>
                <div className="text-right">
                  <div className="font-medium">{selectedService?.name}</div>
                  <div className="text-sm text-gray-600">
                    {selectedService?.duration} min
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Barbeiro:</span>
                <span className="font-medium">{selectedBarber?.name}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Valor:</span>
                <span className="font-bold text-lg text-blue-600">
                  {selectedService?.price}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={confirmAppointment}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold"
              >
                Confirmar Agendamento
              </button>

              <button
                onClick={resetBooking}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Calendar;
