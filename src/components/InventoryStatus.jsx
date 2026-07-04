export default function InventoryStatus({
  med,
  editingStockId,
  editStockValue,
  setEditStockValue,
  setEditingStockId,
  handleUpdateStock,
}) {
  if (med.inventory === undefined || med.inventory === null) {
    return null;
  }

  return (
    <div
      className="inventory-status-row"
      style={{
        marginTop: "8px",
        fontSize: "0.9rem",
        display: "flex",
        gap: "10px",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      {editingStockId === med.id ? (
        <>
          <input
            type="number"
            min="0"
            value={editStockValue}
            onChange={(e) => setEditStockValue(e.target.value)}
            style={{
              width: "70px",
              padding: "4px 6px",
              border: "1px solid #cbd5e1",
              borderRadius: "4px",
            }}
            autoFocus
          />

          <button
            type="button"
            onClick={() => handleUpdateStock(med.id)}
            style={{
              background: "#5b6bf5",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              padding: "4px 10px",
              cursor: "pointer",
            }}
          >
            <i className="fa-solid fa-check"></i> Save
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingStockId(null);
              setEditStockValue("");
            }}
            style={{
              background: "#e2e8f0",
              color: "#334155",
              border: "none",
              borderRadius: "4px",
              padding: "4px 10px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <span style={{ color: "#64748b" }}>
            <i className="fa-solid fa-pills"></i> Stock:{" "}
            <strong>{med.inventory}</strong> left
          </span>

          <button
            type="button"
            onClick={() => {
              setEditingStockId(med.id);
              setEditStockValue(String(med.inventory));
            }}
            title="Update stock count"
            style={{
              background: "none",
              border: "none",
              color: "#5b6bf5",
              cursor: "pointer",
              padding: "2px 4px",
            }}
          >
            <i className="fa-solid fa-pen"></i>
          </button>

          {Number(med.inventory) <= 5 && Number(med.inventory) > 0 && (
            <span
              style={{
                background: "#fef3c7",
                color: "#b45309",
                padding: "2px 6px",
                borderRadius: "4px",
                fontSize: "0.8rem",
                fontWeight: "bold",
              }}
            >
              <i className="fa-solid fa-triangle-exclamation"></i> Low Stock
            </span>
          )}

          {Number(med.inventory) === 0 && (
            <span
              style={{
                background: "#fee2e2",
                color: "#b91c1c",
                padding: "2px 6px",
                borderRadius: "4px",
                fontSize: "0.8rem",
                fontWeight: "bold",
              }}
            >
              <i className="fa-solid fa-circle-xmark"></i> Out of Stock
            </span>
          )}
        </>
      )}
    </div>
  );
}