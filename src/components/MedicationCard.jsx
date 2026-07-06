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
}) {
  return (
    <div
      className={`med-card ${med.taken ? "med-taken" : ""} ${
        isMissed ? "med-missed" : ""
      }`}
    >
      <div className="med-info">
        {isMissed && (
          <span className="missed-badge">
            <i className="fa-solid fa-triangle-exclamation"></i> Overdue /
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
    ></i>

    {isMissed
      ? "Missed"
      : med.taken
      ? "Taken"
      : "Pending"}
  </span>
</div>

        <p className="med-dosage">
          <i className="fa-solid fa-prescription-bottle-medical icon-inline"></i>
          <strong>Dosage:</strong> {med.dosage}
        </p>

        <p className="med-instructions">
          <i className="fa-solid fa-file-medical icon-inline"></i>
          {med.instructions}
        </p>

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
          className={`action-btn ${
            med.taken ? "btn-undo" : "btn-complete"
          } ${isMissed ? "btn-missed-alert" : ""}`}
          onClick={() => toggleTaken(med.id)}
        >
          {med.taken ? (
            <>
              <i className="fa-solid fa-circle-check"></i> Taken
              {med.takenAt && (
                <span className="taken-time">
                  {" "}
                  at{" "}
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
          className="delete-btn"
          onClick={() => deleteMedication(med.id)}
          title="Delete Entry"
        >
          <i className="fa-solid fa-trash-can"></i>
        </button>
      </div>
    </div>
  );
}

export default MedicationCard;