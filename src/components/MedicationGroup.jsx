import React from "react";
import MedicationCard from "./MedicationCard";

function MedicationGroup({
  sectionTitle,
  timePeriod,
  filteredMeds,
  getPeriodIcon,
  checkIfMissed,
  editingStockId,
  editStockValue,
  setEditStockValue,
  setEditingStockId,
  handleUpdateStock,
  toggleTaken,
  deleteMedication,
}) {
  return (
    <div className="time-period-group">
      <h3 className="period-heading">
        {getPeriodIcon(timePeriod)} {sectionTitle}
      </h3>

      {filteredMeds.length === 0 ? (
        <p className="empty-period-text">
          No medications scheduled for this time.
        </p>
      ) : (
        <>
          <p className="sub-instruction">
            Tap the button when you finish taking your dose.
          </p>

          <div className="med-grid">
            {filteredMeds.map((med) => {
              const isMissed = checkIfMissed(med);

              return (
                <MedicationCard
                  key={med.id}
                  med={med}
                  isMissed={isMissed}
                  editingStockId={editingStockId}
                  editStockValue={editStockValue}
                  setEditStockValue={setEditStockValue}
                  setEditingStockId={setEditingStockId}
                  handleUpdateStock={handleUpdateStock}
                  toggleTaken={toggleTaken}
                  deleteMedication={deleteMedication}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default MedicationGroup;