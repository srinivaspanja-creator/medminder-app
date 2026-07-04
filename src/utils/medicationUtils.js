export const hasInventory = (med) =>
  med.inventory !== null &&
  med.inventory !== undefined &&
  med.inventory !== "";

export const isLowStock = (med) =>
  hasInventory(med) &&
  Number(med.inventory) > 0 &&
  Number(med.inventory) <= 5;

export const isOutOfStock = (med) =>
  hasInventory(med) &&
  Number(med.inventory) === 0;

export const getDaysUntil = (dateString) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = dateString.split("-").map(Number);

  const appointmentDay = new Date(year, month - 1, day);
  appointmentDay.setHours(0, 0, 0, 0);

  const diffTime = appointmentDay - today;

  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

export const formatAppointmentDate = (dateString) => {
  const [year, month, day] = dateString.split("-").map(Number);

  const localDate = new Date(year, month - 1, day);

  return localDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

  if (period === "Afternoon") {
    return <i className="fa-solid fa-sun icon-afternoon"></i>;
  }

  return <i className="fa-solid fa-moon icon-evening"></i>;
};