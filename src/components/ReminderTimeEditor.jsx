import { useState } from "react";

export default function ReminderTimeEditor({ value = [], onChange }) {
  const [time, setTime] = useState("");

  const addTime = () => {
    if (!time) return;

    if (value.includes(time)) {
      return;
    }

    const updated = [...value, time].sort();

    onChange(updated);
    setTime("");
  };

  const removeTime = (timeToRemove) => {
    const updated = value.filter((t) => t !== timeToRemove);
    onChange(updated);
  };

  return (
    <div className="reminder-time-editor">
      <label htmlFor="reminder-time">
        Reminder Time
      </label>

      <div className="reminder-time-row">
        <input
          id="reminder-time"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />

        <button
          type="button"
          onClick={addTime}
        >
          Add
        </button>
      </div>

      {value.length > 0 && (
        <ul className="reminder-time-list">
          {value.map((t) => (
            <li key={t}>
              {t}

              <button
                type="button"
                onClick={() => removeTime(t)}
                aria-label={`Remove reminder ${t}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}