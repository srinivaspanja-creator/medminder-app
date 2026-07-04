import React from "react";

function AppointmentCard({
  appt,
  daysUntil,
  isUrgent,
  isPast,
  editingAppointmentId,
  editDateValue,
  setEditDateValue,
  handleSaveEditedDate,
  handleCancelEditAppointment,
  handleStartEditAppointment,
  handleDeleteAppointment,
  formatAppointmentDate,
}) {
  return (
    <div
      className={`appointment-card ${
        isUrgent ? "appointment-urgent" : ""
      } ${isPast ? "appointment-past" : ""}`}
    >
      <div className="appointment-info">
        <h3>{appt.doctorName}</h3>

        <p className="appointment-purpose">{appt.purpose}</p>

        <p className="appointment-date">
          <i className="fa-solid fa-calendar-day"></i>{" "}
          {formatAppointmentDate(appt.date)}
        </p>
      </div>

      <div className="appointment-countdown">
        {editingAppointmentId === appt.id ? (
          <div className="appointment-edit-row">
            <input
              type="date"
              value={editDateValue}
              onChange={(e) => setEditDateValue(e.target.value)}
              className="appointment-edit-date-input"
            />

            <button
              className="add-med-btn appointment-save-btn"
              onClick={() => handleSaveEditedDate(appt.id)}
              title="Save"
            >
              <i className="fa-solid fa-check"></i>
            </button>

            <button
              className="reset-day-btn appointment-cancel-btn"
              onClick={handleCancelEditAppointment}
              title="Cancel"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        ) : (
          <>
            {isPast ? (
              <span className="countdown-badge countdown-past">
                Past
              </span>
            ) : daysUntil === 0 ? (
              <span className="countdown-badge countdown-today">
                Today
              </span>
            ) : (
              <span
                className={`countdown-badge ${
                  isUrgent ? "countdown-urgent" : ""
                }`}
              >
                in {daysUntil} day{daysUntil === 1 ? "" : "s"}
              </span>
            )}

            <button
              className="reset-day-btn appointment-edit-btn"
              onClick={() => handleStartEditAppointment(appt)}
              title="Edit Date"
            >
              <i className="fa-solid fa-pen"></i>
            </button>

            <button
              className="delete-btn appointment-delete-btn"
              onClick={() => handleDeleteAppointment(appt.id)}
              title="Delete"
            >
              <i className="fa-solid fa-trash-can"></i>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default AppointmentCard;