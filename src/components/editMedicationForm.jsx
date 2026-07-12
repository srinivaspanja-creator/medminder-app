import { useState } from "react";
import ReminderTimeEditor from "./ReminderTimeEditor";

export default function EditMedicationForm({ med, onSave, onCancel }) {
  const [name, setName] = useState(med.name);
  const [dosage, setDosage] = useState(
    med.dosage === "As directed" ? "" : med.dosage
  );
  const [dosageType, setDosageType] = useState(med.dosageType || "Tablet");
  const [period, setPeriod] = useState(med.period);
  const [instructions, setInstructions] = useState(
    med.instructions === "No special instructions" ? "" : med.instructions
  );
  const [inventory, setInventory] = useState(
    med.inventory === null || med.inventory === undefined
      ? ""
      : String(med.inventory)
  );
  const [reminderTimes, setReminderTimes] = useState(med.reminderTimes || []);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter a Medication Name.");
      return;
    }

    onSave({
      name,
      dosage,
      dosageType,
      period,
      instructions,
      inventory,
      reminderTimes,
    });
  };

  return (
    <div
      className="edit-med-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-med-heading"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        overflowY: "auto",
        padding: "40px 16px",
        zIndex: 1000,
      }}
    >
      <div
        className="form-section edit-med-modal"
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "480px",
          width: "100%",
        }}
      >
        <h2 id="edit-med-heading">
          <i className="fa-solid fa-pen"></i> Edit Medication
        </h2>

        <form onSubmit={handleSubmit} className="med-form">
          <div className="form-group">
            <label>Medication Name *</label>
            <input
              type="text"
              placeholder="e.g., Amoxicillin"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Dosage</label>
            <input
              type="text"
              placeholder="e.g., 500mg"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Form/Type</label>
            <select
              value={dosageType}
              onChange={(e) => setDosageType(e.target.value)}
              className="senior-select"
            >
              <option value="Tablet">Tablet</option>
              <option value="Capsule">Capsule</option>
              <option value="Syrup">Syrup</option>
              <option value="Drops">Drops</option>
              <option value="Injection">Injection</option>
              <option value="Cream/Ointment">Cream/Ointment</option>
              <option value="Inhaler">Inhaler</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Time Period</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="Morning">Morning</option>
              <option value="Afternoon">Afternoon</option>
              <option value="Evening">Evening / Night</option>
            </select>
          </div>

          <div className="form-group">
            <label>Instructions</label>
            <input
              type="text"
              placeholder="e.g., Take with breakfast"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Current Pill Count (Optional Stock Tracker)</label>
            <input
              type="number"
              min="0"
              placeholder="e.g., 30"
              value={inventory}
              onChange={(e) => setInventory(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Reminder Times</label>
            <ReminderTimeEditor
              value={reminderTimes}
              onChange={setReminderTimes}
            />
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
            <button type="submit" className="add-med-btn">
              Save Changes
            </button>
            <button
              type="button"
              className="reset-day-btn"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
