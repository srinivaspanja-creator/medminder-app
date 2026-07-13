import React from "react";
import InventoryStatus from "./InventoryStatus";

function MedicationCard({
  med,
  isMissed,
  editingStockId,
  editStockValue,
  setEditStockValue,
  setEditingStockId,
  handleUpdateStock,
  toggleTaken,
  deleteMedication,
  onEdit,
})
 {
  return (
    <div
      className={`med-card ${med.taken ? "med-taken" : ""} ${
        isMissed ? "med-missed" : ""
      }`}
    >
      <div className="med-info">
        {isMissed && (
          <span className="missed-badge">
            <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> Overdue /
            Missed Dose
          </span>
        )}

<div className="med-card-header">
  <h3>{med.name}</h3>

  <span
    className={`status-badge ${
      isMissed
        ? "status-missed"
        : med.taken
        ? "status-taken"
        : "status-pending"
    }`}
  >
    <i
      className={`fa-solid ${
        isMissed
          ? "fa-triangle-exclamation"
          : med.taken
          ? "fa-circle-check"
          : "fa-clock"
      }`}
      aria-hidden="true"
    ></i>

    {isMissed
      ? "Missed"
      : med.taken
      ? "Taken"
      : "Pending"}
  </span>
</div>

        <p className="med-dosage">
          <i className="fa-solid fa-prescription-bottle-medical icon-inline" aria-hidden="true"></i>
          <strong>Dosage:</strong> {med.dosage}
        </p>

<p className="med-instructions">
  <i className="fa-solid fa-file-medical icon-inline" aria-hidden="true"></i>
  {med.instructions}
</p>

{Array.isArray(med.reminderTimes) &&
  med.reminderTimes.length > 0 && (
    <div className="reminder-times">
      <h4>Reminder Times</h4>
      <ul>
        {med.reminderTimes.map((time) => (
          <li key={time}>
  {new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })}
</li>
        ))}
      </ul>
    </div>
)}
        <InventoryStatus
          med={med}
          editingStockId={editingStockId}
          editStockValue={editStockValue}
          setEditStockValue={setEditStockValue}
          setEditingStockId={setEditingStockId}
          handleUpdateStock={handleUpdateStock}
        />
      </div>

      <div className="card-actions">
        <button
          type="button"
          className={`action-btn ${
            med.taken ? "btn-undo" : "btn-complete"
          } ${isMissed ? "btn-missed-alert" : ""}`}
          onClick={() => toggleTaken(med.id)}
        >
          {med.taken ? (
          <>
  <span className="taken-label">
    <i className="fa-solid fa-circle-check" aria-hidden="true"></i>
    Taken
  </span>

  {med.takenAt && (
    <span className="taken-time">
      Today •{" "}
      {new Date(med.takenAt).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })}
    </span>
  )}
</>
          ) : (
            "Mark as Taken"
          )}
        </button>

        <button
          type="button"
          className="edit-btn"
          onClick={() => onEdit?.(med)}
          title="Edit Medication"
        >
          <i className="fa-solid fa-pen" aria-hidden="true"></i> Edit
        </button>

        <button
          type="button"
          className="delete-btn"
          onClick={() => deleteMedication(med.id)}
          title="Delete Entry"
          aria-label={`Delete ${med.name}`}
        >
          <i className="fa-solid fa-trash-can" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  );
}

export default MedicationCard;
