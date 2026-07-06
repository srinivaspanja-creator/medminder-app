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
        <div className="empty-period-state">
  <i
    className="fa-solid fa-pills empty-period-icon"
    aria-hidden="true"
  ></i>

  <h4>No medications scheduled</h4>

  <p className="empty-period-text">
    Enjoy your free time! There are no medications planned for this period.
  </p>
</div>
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