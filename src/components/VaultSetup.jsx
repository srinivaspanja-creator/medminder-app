import React, { useState } from "react";

function VaultSetup({ onSetup }) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

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
        <i className="fa-solid fa-shield-halved" aria-hidden="true"></i> Set up a PIN to protect your prescription photos.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="vault-setup-pin">Create a 4-digit PIN</label>
          <input
            id="vault-setup-pin"
            name="new-pin"
            type="password"
            maxLength="4"
            inputMode="numeric"
            autoComplete="new-password"
            placeholder="e.g., 1234"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          />
        </div>

        <div className="form-group">
          <label htmlFor="vault-setup-confirm-pin">Confirm PIN</label>
          <input
            id="vault-setup-confirm-pin"
            name="confirm-pin"
            type="password"
            maxLength="4"
            inputMode="numeric"
            autoComplete="new-password"
            placeholder="Re-enter PIN"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
          />
        </div>

        <div className="form-group">
          <label htmlFor="vault-setup-question">Security Question (for PIN recovery)</label>
          <input
            id="vault-setup-question"
            name="security-question"
            type="text"
            autoComplete="off"
            placeholder="e.g., What is your pet's name?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="vault-setup-answer">Answer</label>
          <input
            id="vault-setup-answer"
            name="security-answer"
            type="text"
            autoComplete="off"
            placeholder="Your answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        </div>

        <button type="submit" className="add-med-btn">
          Set Up Vault
        </button>
      </form>
    </div>
  );
}

export default VaultSetup;
