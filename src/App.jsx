import React, { useState, useEffect } from 'react';
import './App.css';
import useLocalStorage from "./hooks/useLocalStorage";
import {
  hasInventory,
  isLowStock,
  isOutOfStock,
  getDaysUntil,
  formatAppointmentDate,
} from "./utils/medicationUtils";

function App() {
  // Initialize state from LocalStorage
  const [medications, setMedications] = useLocalStorage(
  "MyMedMinder_list",
  [
    {
      id: 1,
      name: "Amoxicillin",
      dosage: "500mg",
      period: "Morning",
      instructions: "Take with breakfast",
      taken: false,
      inventory: null,
    },
    {
      id: 2,
      name: "Vitamin D3",
      dosage: "2000 IU",
      period: "Afternoon",
      instructions: "Take after lunch",
      taken: false,
      inventory: null,
    },
    {
      id: 3,
      name: "Metformin",
      dosage: "850mg",
      period: "Evening",
      instructions: "Take with dinner",
      taken: false,
      inventory: null,
    },
  ]
);

  // Form states
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [dosageType, setDosageType] = useState('Tablet');
  const [period, setPeriod] = useState('Morning'); 
  const [instructions, setInstructions] = useState('');
  const [inventory, setInventory] = useState('');
  
  // Clock contexts
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [greeting, setGreeting] = useState('Hello');

// Streak & History states
  const [history, setHistory] = useState(() => {
    const savedHistory = localStorage.getItem('MyMedMinder_history');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });
  const [missedHistory, setMissedHistory] = useLocalStorage(
  "MyMedMinder_missed",
  []
);
  
  const [lastRecordedDate, setLastRecordedDate] = useState(() => {
    return localStorage.getItem('MyMedMinder_lastRecordedDate') || '';
  });const [streak, setStreak] = useLocalStorage(
  "MyMedMinder_streak",
  0
);
  // Prescription Vault states
  const [vaultPhotos, setVaultPhotos] = useLocalStorage(
  "MyMedMinder_vaultPhotos",
  []
);
 const [vaultPin, setVaultPin] = useState(() => {
    return localStorage.getItem('MyMedMinder_vaultPin') || null;
  });
  // Doctor Appointment states
  const [appointments, setAppointments] = useLocalStorage(
  "MyMedMinder_appointments",
  []
);
  const [doctorName, setDoctorName] = useState('');
  const [appointmentPurpose, setAppointmentPurpose] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [editingAppointmentId, setEditingAppointmentId] = useState(null);
  const [editDateValue, setEditDateValue] = useState('');
  const [showMissedAlert, setShowMissedAlert] = useState(false);
const [bannerIndex, setBannerIndex] = useState(0);
  const [missedMedsList, setMissedMedsList] = useState([]);
  const [alertedMedIds, setAlertedMedIds] = useState([]);
  const [vaultSecurityQuestion, setVaultSecurityQuestion] = useState(() => {
    return localStorage.getItem('MyMedMinder_vaultSecurityQ') || '';
  });
  const [vaultSecurityAnswer, setVaultSecurityAnswer] = useState(() => {
    return localStorage.getItem('MyMedMinder_vaultSecurityA') || '';
  });
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [vaultSizeWarningShown, setVaultSizeWarningShown] = useState(() => {
    return localStorage.getItem('MyMedMinder_vaultWarningShown') === 'true';
  });
 const [pinInput, setPinInput] = useState('');
const [showForgotPin, setShowForgotPin] = useState(false);
const [editingStockId, setEditingStockId] = useState(null);
const [editStockValue, setEditStockValue] = useState('');
  const [securityAnswerInput, setSecurityAnswerInput] = useState('');
// Automatically save data points to localStorage
  
  
  
  // Update clock contexts
  useEffect(() => {
    const updateTimeContext = () => {
      const hour = new Date().getHours();
      setCurrentHour(hour);
      
      if (hour < 12) {
        setGreeting('Good Morning');
      } else if (hour < 17) {
        setGreeting('Good Afternoon');
      } else {
        setGreeting('Good Evening');
      }
    };
updateTimeContext();
    const interval = setInterval(updateTimeContext, 60000);
    return () => clearInterval(interval);
  }, []);

  // Detect missed doses and trigger alert + sound
  useEffect(() => {
    const checkForMissedDoses = () => {
      const hour = new Date().getHours();
      const newlyMissed = medications.filter(med => {
        if (med.taken) return false;
        const isMissed = 
          (med.period === 'Morning' && hour >= 12) ||
          (med.period === 'Afternoon' && hour >= 17);
        return isMissed && !alertedMedIds.includes(med.id);
      });

      if (newlyMissed.length > 0) {
        setMissedMedsList(newlyMissed);
        setShowMissedAlert(true);
        setAlertedMedIds(prev => [...prev, ...newlyMissed.map(m => m.id)]);

       // Play alert sound using Web Audio API
        try {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const playBeep = (startTime, frequency) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.3);
          };
          const now = audioContext.currentTime;
          playBeep(now, 880);
          playBeep(now + 0.4, 880);
          playBeep(now + 0.8, 880);
        } catch (e) {
          // Audio not supported or blocked, fail silently
        }
      }
    };

   checkForMissedDoses();
    const missedCheckInterval = setInterval(checkForMissedDoses, 60000);
    return () => clearInterval(missedCheckInterval);
  }, [medications, alertedMedIds]);

  // Automatically update streak when all medications for today are taken
  useEffect(() => {
    if (medications.length === 0) return;

    const allTaken = medications.every(med => med.taken);
    const todayKey = new Date().toDateString();

    if (allTaken && lastRecordedDate !== todayKey) {
      const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const currentDayLabel = dayLabels[new Date().getDay()];
      const todayRecord = {
        id: Date.now(),
        dayName: currentDayLabel,
        scoreText: `${medications.length}/${medications.length}`,
        perfect: true
      };

      setHistory(prevHistory => [...prevHistory, todayRecord].slice(-7));
      setStreak(prevStreak => prevStreak + 1);
      setLastRecordedDate(todayKey);
      localStorage.setItem('MyMedMinder_lastRecordedDate', todayKey);
    }
  }, [medications, lastRecordedDate]);

  // Automatically reset checkboxes and break streak at the start of a new day
  useEffect(() => {
    const checkForNewDay = () => {
      const todayKey = new Date().toDateString();
      const lastCheckedDay = localStorage.getItem('MyMedMinder_lastCheckedDay');

      if (lastCheckedDay && lastCheckedDay !== todayKey) {
        const allWereTaken = medications.length > 0 && medications.every(med => med.taken);

        if (!allWereTaken && medications.length > 0 && lastRecordedDate !== lastCheckedDay) {
          // Yesterday wasn't perfect and wasn't already recorded, so streak breaks
          setStreak(0);
          const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const yesterdayDate = new Date();
          yesterdayDate.setDate(yesterdayDate.getDate() - 1);
          const yesterdayLabel = dayLabels[yesterdayDate.getDay()];
          const takenCount = medications.filter(med => med.taken).length;
          const missedRecord = {
            id: Date.now(),
            dayName: yesterdayLabel,
            scoreText: `${takenCount}/${medications.length}`,
            perfect: false
          };
          setHistory(prevHistory => [...prevHistory, missedRecord].slice(-7));
        }

        // Capture any medications missed today, before wiping the checklist
        const stillMissedToday = medications.filter(med => !med.taken);
        if (stillMissedToday.length > 0) {
          const missedEntries = stillMissedToday.map(med => ({
            id: `${med.id}-${todayKey}`,
            medName: med.name,
            period: med.period,
            dateMissed: todayKey
          }));
          setMissedHistory(prev => [...prev, ...missedEntries]);
        }

        // Reset checkboxes for the new day
        setMedications((prev) =>
  prev.map((med) => ({
    ...med,
    taken: false,
    takenAt: null,
  }))
);
        setAlertedMedIds([]);
      }
      localStorage.setItem('MyMedMinder_lastCheckedDay', todayKey);
    };
    checkForNewDay();
    const dayCheckInterval = setInterval(checkForNewDay, 60000);
    return () => clearInterval(dayCheckInterval);
  }, [medications, lastRecordedDate]);
const startVoiceInput = (setter) => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Voice input isn't supported in this browser. Please try Chrome.");
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    setter(transcript);
  };
  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
  };
  recognition.start();
};
 // Handle checking/unchecking meds & updating inventory balance
const handleUpdateStock = (id) => {
  const newValue =
    editStockValue === ""
      ? null
      : Math.max(0, Number(editStockValue));

  setMedications((prev) =>
    prev.map((med) =>
      med.id === id
        ? {
            ...med,
            inventory: newValue,
          }
        : med
    )
  );

  setEditingStockId(null);
  setEditStockValue("");
};

const toggleTaken = (id) => {
  // Remove from missed meds if user marks it as taken
  setMissedMedsList((prev) =>
    prev.filter((med) => med.id !== id)
  );

  setMedications((prev) =>
    prev.map((med) => {
      if (med.id !== id) return med;

      const taken = !med.taken;

      let inventory = med.inventory;

      if (
        inventory !== null &&
        inventory !== undefined &&
        inventory !== ""
      ) {
        inventory = taken
          ? Math.max(0, Number(inventory) - 1)
          : Number(inventory) + 1;
      }

      return {
        ...med,
        taken,
        inventory,
        takenAt: taken ? new Date().toISOString() : null,
      };
    })
  );
};
  // Add medication
  const handleAddMedication = (e) => {
    e.preventDefault();
    if (!name) {
      alert("Please enter a Medication Name.");
      return;
    }

    const newMed = {
  id: Date.now(),
  name: name.trim(),
  dosage: dosage || "As directed",
  dosageType,
  period,
  instructions: instructions || "No special instructions",
  inventory: inventory !== "" ? Number(inventory) : null,
  taken: false,
  takenAt: null,
};
    setMedications((prev) => [...prev, newMed]);
    
  };

  // Delete medication
  const deleteMedication = (id) => {
  if (
    window.confirm(
      "Are you sure you want to remove this medication from your schedule?"
    )
  ) {
    setMedications((prev) => prev.filter((med) => med.id !== id));
  }
};

  // Reset checklist & log compliance score for history
  const handleResetForTomorrow = () => {
    if (medications.length === 0) {
      alert("Add some medications to your schedule before tracking history!");
      return;
    }

    if (window.confirm("Are you sure you want to reset your checklist for a new day? This will save today's compliance score and clear all checks.")) {
      
      // Calculate today's adherence metrics
      const totalCount = medications.length;
      const takenCount = medications.filter(med => med.taken).length;
      const isPerfectDay = takenCount === totalCount;

      // Fetch current day string label (e.g., "Mon")
      const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const currentDayLabel = dayLabels[new Date().getDay()];

      // Construct history payload record
      const todayRecord = {
        id: Date.now(),
        dayName: currentDayLabel,
        scoreText: `${takenCount}/${totalCount}`,
        perfect: isPerfectDay
      };

      // Update states (Keep rolling history capped at last 7 records)
      setHistory(prevHistory => [...prevHistory, todayRecord].slice(-7));
      setStreak(prevStreak => isPerfectDay ? prevStreak + 1 : 0);

      // Clean checkmarks for tomorrow
  
setMedications((prev) =>
  prev.map((med) => ({
    ...med,
    taken: false,
    takenAt: null,
  }))
);
    }
  };

  // Set up the vault PIN and security question for the first time
  const handleSetupVault = (pin, question, answer) => {
    localStorage.setItem('MyMedMinder_vaultPin', pin);
    localStorage.setItem('MyMedMinder_vaultSecurityQ', question);
    localStorage.setItem('MyMedMinder_vaultSecurityA', answer.toLowerCase().trim());
    setVaultPin(pin);
    setVaultSecurityQuestion(question);
    setVaultSecurityAnswer(answer.toLowerCase().trim());
    setVaultUnlocked(true);
  };

  // Check entered PIN against stored PIN
  const handleCheckPin = () => {
    if (pinInput === vaultPin) {
      setVaultUnlocked(true);
      setPinInput('');

      if (!vaultSizeWarningShown) {
        alert("Heads up: The Prescription Vault has limited storage space (a few photos work best). For important documents, we recommend also keeping a physical or cloud backup.");
        localStorage.setItem('MyMedMinder_vaultWarningShown', 'true');
        setVaultSizeWarningShown(true);
      }
    } else {
      alert("Incorrect PIN. Please try again.");
      setPinInput('');
    }
  };

  // Verify security answer and allow PIN reset
  const handleVerifySecurityAnswer = (newPin) => {
    if (securityAnswerInput.toLowerCase().trim() === vaultSecurityAnswer) {
      localStorage.setItem('MyMedMinder_vaultPin', newPin);
      setVaultPin(newPin);
      setVaultUnlocked(true);
      setShowForgotPin(false);
      setSecurityAnswerInput('');
      alert("PIN reset successfully! You're now unlocked.");
    } else {
      alert("That answer doesn't match. Please try again.");
      setSecurityAnswerInput('');
    }
  };

  // Add a new prescription photo to the vault
  const handleAddVaultPhoto = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 1500000) {
      alert("This image is quite large. For best results, please use a smaller photo (under 1.5MB) to avoid filling up storage.");
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const newPhoto = {
        id: Date.now(),
        imageData: e.target.result,
        dateAdded: new Date().toISOString(),
        label: file.name
      };
      setVaultPhotos(prev => [...prev, newPhoto]);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };
// Delete a prescription photo from the vault
  const handleDeleteVaultPhoto = (id) => {
    if (window.confirm("Delete this prescription photo permanently?")) {
      setVaultPhotos(prev => prev.filter(photo => photo.id !== id));
    }
  };

  // Add a new doctor appointment
  const handleAddAppointment = (e) => {
    e.preventDefault();
    if (!doctorName.trim() || !appointmentDate) {
      alert("Please enter a doctor's name and appointment date.");
      return;
    }
    const newAppointment = {
      id: Date.now(),
      doctorName: doctorName.trim(),
      purpose: appointmentPurpose.trim() || 'General Checkup',
      date: appointmentDate
    };
    setAppointments(prev => [...prev, newAppointment].sort((a, b) => new Date(a.date) - new Date(b.date)));
    setDoctorName('');
    setAppointmentPurpose('');
    setAppointmentDate('');
  };

  // Delete an appointment
 const handleDeleteAppointment = (id) => {
    if (window.confirm("Delete this appointment reminder?")) {
      setAppointments(prev => prev.filter(appt => appt.id !== id));
    }
  };

 // Start editing an appointment's date
  const handleStartEditAppointment = (appt) => {
    setEditingAppointmentId(appt.id);
    setEditDateValue(appt.date);
  };

  // Save the edited date
  const handleSaveEditedDate = (apptId) => {
    if (!editDateValue) {
      alert("Please select a date.");
      return;
    }
    setAppointments(prev => 
      prev.map(a => a.id === apptId ? { ...a, date: editDateValue } : a)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
    );
    setEditingAppointmentId(null);
    setEditDateValue('');
  };

  // Cancel editing
  const handleCancelEditAppointment = () => {
    setEditingAppointmentId(null);
    setEditDateValue('');
  };


  // Export medication list as a CSV file
  const handleExportCSV = () => {
    const headers = ['Name', 'Dosage', 'Time Period', 'Instructions', 'Stock Remaining', 'Taken Today'];
    const rows = medications.map(med => [
      med.name,
      med.dosage,
      med.period,
      med.instructions,
      med.inventory ?? '',
      med.taken ? 'Yes' : 'No'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MyMedMinder_export_${new Date().toISOString().split('T')[0]}.csv`);
   document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
 };
  // Check if missed
  
const checkIfMissed = (med) => {
    if (med.taken) return false;
    if (med.period === 'Morning' && currentHour >= 12) return true;
    if (med.period === 'Afternoon' && currentHour >= 17) return true;
    return false;
  };
const getPeriodIcon = (period) => {
  if (period === "Morning") {
    return <i className="fa-solid fa-cloud-sun icon-morning"></i>;
  }

  if (period === "Afternoon") {
    return <i className="fa-solid fa-sun icon-afternoon"></i>;
  }

  return <i className="fa-solid fa-moon icon-evening"></i>;
};
 
  // Reusable function to print out cards for a specific time period
 const renderMedGroup = (timePeriod, sectionTitle) => {
    const filteredMeds = medications.filter(med => med.period === timePeriod);
    return (
      <div className="time-period-group">
        <h3 className="period-heading">
          {getPeriodIcon(timePeriod)} {sectionTitle}
        </h3>
        {filteredMeds.length === 0 ? (
          <p className="empty-period-text">No medications scheduled for this time.</p>
        ) : (
          <>
          <p className="sub-instruction">Tap the button when you finish taking your dose.</p>
          <div className="med-grid">
            {filteredMeds.map((med) => {
              const isMissed = checkIfMissed(med);
              
              return (
                <div 
                  key={med.id} 
                  className={`med-card ${med.taken ? 'med-taken' : ''} ${isMissed ? 'med-missed' : ''}`}
                >
                  <div className="med-info">
                    {isMissed && (
                      <span className="missed-badge">
                        <i className="fa-solid fa-triangle-exclamation"></i> Overdue / Missed Dose
                      </span>
                    )}
                    
                    <h3>{med.name}</h3>
                    <p className="med-dosage">
                      <i className="fa-solid fa-prescription-bottle-medical icon-inline"></i> 
                      <strong>Dosage:</strong> {med.dosage}
                    </p>
                    <p className="med-instructions">
                      <i className="fa-solid fa-file-medical icon-inline"></i> 
                      {med.instructions}
                    </p>
                    {/* Inventory Status Badges */}
                    {med.inventory !== undefined && med.inventory !== null && (
  <div className="inventory-status-row" style={{ marginTop: '8px', fontSize: '0.9rem', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
    {editingStockId === med.id ? (
      <>
        <input
          type="number"
          min="0"
          value={editStockValue}
          onChange={(e) => setEditStockValue(e.target.value)}
          style={{ width: '70px', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
          autoFocus
        />
        <button
          type="button"
          onClick={() => handleUpdateStock(med.id)}
          style={{ background: '#5b6bf5', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}
        >
          <i className="fa-solid fa-check"></i> Save
        </button>
        <button
          type="button"
          onClick={() => { setEditingStockId(null); setEditStockValue(''); }}
          style={{ background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}
        >
          Cancel
        </button>
      </>
    ) : (
      <>
        <span style={{ color: '#64748b' }}>
          <i className="fa-solid fa-pills"></i> Stock: <strong>{med.inventory}</strong> left
        </span>

        <button
          type="button"
          onClick={() => { setEditingStockId(med.id); setEditStockValue(String(med.inventory)); }}
          title="Update stock count"
          style={{ background: 'none', border: 'none', color: '#5b6bf5', cursor: 'pointer', padding: '2px 4px' }}
        >
          <i className="fa-solid fa-pen"></i>
        </button>

        {Number(med.inventory) <= 5 && Number(med.inventory) > 0 && (
          <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
            <i className="fa-solid fa-triangle-exclamation"></i> Low Stock
          </span>
        )}

        {Number(med.inventory) === 0 && (
          <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
            <i className="fa-solid fa-circle-xmark"></i> Out of Stock
          </span>
        )}
      </>
    )}
  </div>
)}
  </div>                  
                  <div className="card-actions">
                    <button 
                      className={`action-btn ${med.taken ? 'btn-undo' : 'btn-complete'} ${isMissed ? 'btn-missed-alert' : ''}`}
                      onClick={() => toggleTaken(med.id)}
                    >
                      {med.taken ? (
                        <>
                          <i className="fa-solid fa-circle-check"></i> Taken
                          {med.takenAt && (
                            <span className="taken-time">
                              {' '}at {new Date(med.takenAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </span>
                          )}
                        </>
                      ) : 'Mark as Taken'}
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
           })}
          </div>
          </>
        )}
      </div>
    );
  };
const bannerMessages = React.useMemo(() => {
  const msgs = [];

  // Missed dose alert (moved from the old red banner)
  if (missedMedsList.length > 0) {
    msgs.push({
      icon: 'fa-triangle-exclamation',
      text: `${missedMedsList.map(m => m.name).join(', ')} ${missedMedsList.length === 1 ? 'was' : 'were'} due earlier and not marked as taken.`
    });
  }

// Carried-over missed doses from previous days (up to 3 days old)
  const todayForAging = new Date();
  missedHistory.forEach(entry => {
    const daysOld = Math.floor((todayForAging - new Date(entry.dateMissed)) / (1000 * 60 * 60 * 24));
    if (daysOld >= 1 && daysOld <= 3) {
      msgs.push({
        icon: 'fa-triangle-exclamation',
        text: `${entry.medName} (${entry.period}) was missed ${daysOld === 1 ? 'yesterday' : daysOld + ' days ago'}.`
      });
    }
  });

  // Doses remaining / all taken
  const remaining = medications.filter(med => !med.taken).length;
  if (remaining === 0) {
    msgs.push({ icon: 'fa-circle-check', text: 'All doses taken today — great job!' });
  } else {
    msgs.push({
      icon: 'fa-pills',
      text: `${remaining} dose${remaining === 1 ? '' : 's'} remaining today.`
    });
  }

  // Low stock warnings
  medications
     .filter(med => med.inventory !== undefined && med.inventory !== null && med.inventory <= 5)
    .forEach(med => {
      msgs.push({
        icon: 'fa-triangle-exclamation',
        text: `${med.name} running low — ${med.inventory} left.`
      });
    });

  // Upcoming appointments (within next 3 days)
 appointments.forEach(appt => {
    const daysAway = Math.ceil((new Date(appt.date) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysAway >= 0 && daysAway <= 3) {
      msgs.push({
        icon: 'fa-calendar-days',
        text: `${appt.doctorName} (${appt.purpose}) in ${daysAway === 0 ? 'today' : daysAway + ' day' + (daysAway === 1 ? '' : 's')}.`
      });
    }
  });

  // Fallback if nothing else
  if (msgs.length === 0) {
    msgs.push({ icon: 'fa-star', text: 'Stay consistent — keep your streak going!' });
  }

  return msgs;
}, [medications, appointments, missedMedsList, missedHistory]);

React.useEffect(() => {
  if (bannerMessages.length <= 1) return;
  const timer = setInterval(() => {
    setBannerIndex(prev => (prev + 1) % bannerMessages.length);
  }, 4000);
  return () => clearInterval(timer);
}, [bannerMessages]);
 return (
    <div className="app-container">
      {/* MISSED DOSE ALERT POPUP */}
      
      {/* 1. TOP BANNER */}
      <div className="welcome-banner">
{bannerMessages.length > 0 && (
  <div className="info-banner-strip">
    <i className={`fa-solid ${bannerMessages[bannerIndex].icon} info-banner-icon`}></i>
    <span key={bannerIndex} className="info-banner-text">
      {bannerMessages[bannerIndex].text}
    </span>
  </div>
)}
      <h1>
  <img src="/logo.png" alt="MyMedMinder Logo" className="header-logo" />
  MyMedMinder
</h1>
<hr className="header-divider" />
<p className="header-greeting" style={{ fontStyle: 'italic' }}>
  {greeting}!
</p>
<p className="header-date">
  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
</p>
      </div>

      <nav className="quick-nav-bar">
        <button onClick={() => document.getElementById('add-medication').scrollIntoView({ behavior: 'smooth' })}>
          <i className="fa-solid fa-circle-plus"></i>
          <span>Add</span>
        </button>
        <button onClick={() => document.getElementById('checklist').scrollIntoView({ behavior: 'smooth' })}>
          <i className="fa-solid fa-calendar-check"></i>
          <span>Checklist</span>
        </button>
       <button onClick={() => document.getElementById('adherence').scrollIntoView({ behavior: 'smooth' })}>
          <i className="fa-solid fa-chart-line"></i>
          <span>Streak</span>
        </button>
        <button onClick={() => document.getElementById('vault').scrollIntoView({ behavior: 'smooth' })}>
          <i className="fa-solid fa-lock"></i>
          <span>Vault</span>
        </button>
        <button onClick={() => document.getElementById('appointments').scrollIntoView({ behavior: 'smooth' })}>
          <i className="fa-solid fa-user-doctor"></i>
          <span>Visits</span>
        </button>
      </nav>
      <div className="main-content">
        {/* 2. FORM SECTION */}
        <section className="form-section" id="add-medication">
 
  <h2><i className="fa-solid fa-circle-plus"></i> Add New Medication</h2>
         <form onSubmit={handleAddMedication}>
           <div className="form-group">
              <label>Medication Name *</label>
              <div className="input-with-mic">
                <input 
                  type="text" 
                  placeholder="e.g., Amoxicillin" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                />
                <button
                  type="button"
                  className="mic-btn"
                  onClick={() => startVoiceInput(setName)}
                  title="Speak to fill this field"
                >
                  <i className="fa-solid fa-microphone"></i>
                </button>
              </div>
            </div>
            <div className="form-group">
  <label>Dosage</label>
  <div className="input-with-mic">
    <input 
      type="text" 
      placeholder="e.g., 500mg" 
      value={dosage} 
      onChange={(e) => setDosage(e.target.value)} 
    />
    <button
      type="button"
      className="mic-btn"
      onClick={() => startVoiceInput(setDosage)}
      title="Speak to fill this field"
    >
      <i className="fa-solid fa-microphone"></i>
    </button>
  </div>
</div>

<div className="form-group">
  <label>Form/Type</label>
  <select value={dosageType} onChange={(e) => setDosageType(e.target.value)} className="senior-select">
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
  <div className="input-with-mic">
    <input 
      type="text" 
      placeholder="e.g., Take with breakfast" 
      value={instructions} 
      onChange={(e) => setInstructions(e.target.value)} 
    />
    <button
      type="button"
      className="mic-btn"
      onClick={() => startVoiceInput(setInstructions)}
      title="Speak to fill this field"
    >
      <i className="fa-solid fa-microphone"></i>
    </button>
  </div>
</div>            <div className="form-group">
              <label>Current Pill Count (Optional Stock Tracker)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g., 30"
                value={inventory}
                onChange={(e) => setInventory(e.target.value)}
              />
            </div>

            <button type="submit" className="add-med-btn">Save Medication</button>
          </form>
        </section>

        {/* 3. SCHEDULE CHECKLIST SECTION */}
      <section className="schedule-section" id="checklist">
          <div className="schedule-header-block">
            <div>
              <h2>
                <i className="fa-solid fa-calendar-check header-form-icon"></i> Today's Checklist
              </h2>
            
            </div>
          <div className="header-action-buttons">
  <button className="print-schedule-btn" onClick={() => window.print()}>
    <i className="fa-solid fa-print"></i> Print Report for Doctor
  </button>
  <button className="export-csv-btn" onClick={handleExportCSV}>
    <i className="fa-solid fa-file-csv"></i> Export CSV
  </button>
</div>
          </div>
          {/* Compliance History Log Bar */}
          {/* Compliance History Log Bar */}
<div className="compliance-tracker-bar" id="adherence">
<div className="streak-badge-box">
              <span className="streak-fire-icon">
              {streak > 0 ? '🔥' : '⭐'}
              </span>
              <div>
                <div className="streak-count-value">{streak} Days</div>
                <div className="streak-label-text">Perfect Adherence Streak</div>
              </div>
            </div>

            <div className="history-grid-container">
              <div className="history-grid-title">Last 7 Saved Days:</div>
              <div className="history-dots-row">
                {Array.from({ length: Math.max(0, 7 - history.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="history-bubble bubble-empty" title="No log entry">
                    <span className="bubble-day">-</span>
                    <div className="bubble-circle"><i className="fa-solid fa-minus"></i></div>
                  </div>
                ))}

                {history.map((record) => (
                  <div key={record.id} className={`history-bubble ${record.perfect ? 'bubble-perfect' : 'bubble-missed'}`}>
                    <span className="bubble-day">{record.dayName}</span>
                    <div className="bubble-circle" title={`Score: ${record.scoreText}`}>
                      {record.perfect ? (
                        <i className="fa-solid fa-check"></i>
                      ) : (
                        <span className="bubble-score-micro">{record.scoreText}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="schedule-timeline-container">
            {renderMedGroup('Morning', 'Morning Routine')}
            {renderMedGroup('Afternoon', 'Afternoon Routine')}
           {renderMedGroup('Evening', 'Evening / Night Routine')}
          </div>
        </section>

        {/* 4. PRESCRIPTION VAULT SECTION */}
        <section className="form-section" id="vault">
          <h2><i className="fa-solid fa-lock"></i> Prescription Vault</h2>

          {!vaultPin ? (
            // FIRST TIME SETUP
            <VaultSetup onSetup={handleSetupVault} />
          ) : !vaultUnlocked ? (
            // LOCKED - SHOW PIN ENTRY
            <div className="vault-locked">
              {!showForgotPin ? (
                <>
                  <p className="vault-lock-message">
                    <i className="fa-solid fa-shield-halved"></i> This section is locked. Enter your PIN to view prescriptions.
                  </p>
                  <input 
                    type="password" 
                    maxLength="4"
                    inputMode="numeric"
                    placeholder="Enter 4-digit PIN"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                    className="vault-pin-input"
                  />
                  <button className="add-med-btn" onClick={handleCheckPin}>Unlock Vault</button>
                  <p className="vault-forgot-link" onClick={() => setShowForgotPin(true)}>Forgot PIN?</p>
                </>
              ) : (
                <ForgotPinFlow 
                  question={vaultSecurityQuestion}
                  answerInput={securityAnswerInput}
                  setAnswerInput={setSecurityAnswerInput}
                  onVerify={handleVerifySecurityAnswer}
                  onCancel={() => setShowForgotPin(false)}
                />
              )}
            </div>
          ) : (
            // UNLOCKED - SHOW VAULT CONTENTS
            <div className="vault-unlocked">
              <div className="vault-upload-row">
                <label className="add-med-btn vault-upload-btn">
                  <i className="fa-solid fa-camera"></i> Add Prescription Photo
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAddVaultPhoto} 
                    style={{ display: 'none' }} 
                  />
                </label>
                <button className="reset-day-btn" onClick={() => setVaultUnlocked(false)}>
                  <i className="fa-solid fa-lock"></i> Lock Vault
                </button>
              </div>

              {vaultPhotos.length === 0 ? (
                <p className="empty-period-text">No prescriptions saved yet. Add your first one above.</p>
              ) : (
                <div className="vault-photo-grid">
                  {vaultPhotos.map(photo => (
                    <div key={photo.id} className="vault-photo-card">
                      <img src={photo.imageData} alt={photo.label} className="vault-photo-img" />
                      <p className="vault-photo-date">
                        {new Date(photo.dateAdded).toLocaleDateString()}
                      </p>
                      <button 
                        className="delete-btn vault-delete-btn" 
                        onClick={() => handleDeleteVaultPhoto(photo.id)}
                        title="Delete"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* 5. DOCTOR APPOINTMENTS SECTION */}
        <section className="form-section" id="appointments">
          <h2><i className="fa-solid fa-user-doctor"></i> Doctor Appointments</h2>

          <form onSubmit={handleAddAppointment} className="med-form">
           <div className="form-group">
  <label>Doctor Name *</label>
  <div className="input-with-mic">
    <input 
      type="text" 
      placeholder="e.g., Dr. Smith"
      value={doctorName}
      onChange={(e) => setDoctorName(e.target.value)}
    />
    <button
      type="button"
      className="mic-btn"
      onClick={() => startVoiceInput(setDoctorName)}
      title="Speak to fill this field"
    >
      <i className="fa-solid fa-microphone"></i>
    </button>
  </div>
</div>
<div className="form-group">
  <label>Purpose / Specialty</label>
  <div className="input-with-mic">
    <input 
      type="text" 
      placeholder="e.g., Cardiology Follow-up"
      value={appointmentPurpose}
      onChange={(e) => setAppointmentPurpose(e.target.value)}
    />
    <button
      type="button"
      className="mic-btn"
      onClick={() => startVoiceInput(setAppointmentPurpose)}
      title="Speak to fill this field"
    >
      <i className="fa-solid fa-microphone"></i>
    </button>
  </div>
</div>
<div className="form-group">
              <label>Appointment Date *</label>
              <input 
                type="date" 
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
              />
            </div>
            <button type="submit" className="add-med-btn">Add Appointment</button>
          </form>

          {appointments.length === 0 ? (
            <p className="empty-period-text">No upcoming appointments. Add one above to get reminders.</p>
          ) : (
            <div className="appointment-list">
              {appointments.map(appt => {
                const daysUntil = getDaysUntil(appt.date);
                const isUrgent = daysUntil <= 3 && daysUntil >= 0;
                const isPast = daysUntil < 0;

                return (
                  <div 
                    key={appt.id} 
                    className={`appointment-card ${isUrgent ? 'appointment-urgent' : ''} ${isPast ? 'appointment-past' : ''}`}
                  >
                    <div className="appointment-info">
                      <h3>{appt.doctorName}</h3>
                      <p className="appointment-purpose">{appt.purpose}</p>
                      <p className="appointment-date">
                        <i className="fa-solid fa-calendar-day"></i>{' '}
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
                            <span className="countdown-badge countdown-past">Past</span>
                          ) : daysUntil === 0 ? (
                            <span className="countdown-badge countdown-today">Today</span>
                          ) : (
                            <span className={`countdown-badge ${isUrgent ? 'countdown-urgent' : ''}`}>
                              in {daysUntil} day{daysUntil === 1 ? '' : 's'}
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
              })}
            </div>
         )}
        </section>
      </div>

      <footer className="app-footer">
        <div className="footer-content">
          <img src="/logo.png" alt="MyMedMinder Logo" className="footer-logo" />
         <p className="footer-tagline">Made with care for your health journey.</p>
          <p className="footer-disclaimer">
            MyMedMinder is not a medical device and does not diagnose, treat, cure, or prevent any medical condition. Always consult a healthcare professional for medical advice, diagnosis, or treatment.
          </p>
          <p className="footer-meta">MyMedMinder &copy; {new Date().getFullYear()} &nbsp;|&nbsp; mymedmindersupport@gmail.com &nbsp;|&nbsp; Version 2.0</p>
        </div>
      </footer>
    </div>
  );
}


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
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
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
          onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
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
      <button className="add-med-btn" onClick={handleSubmit}>Set Up Vault</button>
    </div>
  );
}

function ForgotPinFlow({ question, answerInput, setAnswerInput, onVerify, onCancel }) {
  const [newPin, setNewPin] = useState('');

  const handleSubmit = () => {
    if (newPin.length !== 4) {
      alert("New PIN must be exactly 4 digits.");
      return;
    }
    onVerify(newPin);
  };

  return (
    <div className="vault-forgot-flow">
      <p className="vault-lock-message">
        <i className="fa-solid fa-circle-question"></i> {question}
      </p>
      <div className="form-group">
        <label>Your Answer</label>
        <input 
          type="text" 
          placeholder="Enter your answer"
          value={answerInput}
          onChange={(e) => setAnswerInput(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>New 4-digit PIN</label>
        <input 
          type="password" 
          maxLength="4"
          inputMode="numeric"
          placeholder="Choose a new PIN"
          value={newPin}
          onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
        />
      </div>
      <button className="add-med-btn" onClick={handleSubmit}>Reset PIN & Unlock</button>
      <p className="vault-forgot-link" onClick={onCancel}>Cancel</p>
    </div>
  );
}
export default App;