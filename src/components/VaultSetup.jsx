import React, { useState } from "react";

function VaultSetup({ onSetup }) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const handleSubmit = () => {
    if (pin.length !== 4) {
      alert("PIN must be exactly 4 digits.");
      return;
    }
    if (pin !== confirmPin) {
      alert("PINs don't match. Please try again.");
      return;
    }
    if (!question.trim() || !answer.trim()) {
      alert("Please fill in a security question and answer for PIN recovery.");
      return;
    }
    onSetup(pin, question.trim(), answer.trim());
  };

  return (
    <div className="vault-setup">
      <p className="vault-lock-message">
        <i className="fa-solid fa-shield-halved"></i> Set up a PIN to protect your prescription photos.
      </p>

      <div className="form-group">
        <label>Create a 4-digit PIN</label>
        <input
          type="password"
          maxLength="4"
          inputMode="numeric"
          placeholder="e.g., 1234"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
        />
      </div>

      <div className="form-group">
        <label>Confirm PIN</label>
        <input
          type="password"
          maxLength="4"
          inputMode="numeric"
          placeholder="Re-enter PIN"
          value={confirmPin}
          onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
        />
      </div>

      <div className="form-group">
        <label>Security Question (for PIN recovery)</label>
        <input
          type="text"
          placeholder="e.g., What is your pet's name?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Answer</label>
        <input
          type="text"
          placeholder="Your answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
      </div>

      <button className="add-med-btn" onClick={handleSubmit}>
        Set Up Vault
      </button>
    </div>
  );
}

export default VaultSetup;