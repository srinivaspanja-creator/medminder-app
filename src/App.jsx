import { LocalNotifications } from '@capacitor/local-notifications';
import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import useLocalStorage from "./hooks/useLocalStorage";
import useClock from "./hooks/useClock";
import useVoiceRecognition from "./hooks/useVoiceRecognition";
import MedicationGroup from "./components/MedicationGroup";
import AppointmentCard from "./components/AppointmentCard";
import BannerStrip from "./components/BannerStrip";
import VaultSetup from "./components/VaultSetup";
import ReminderTimeEditor from "./components/ReminderTimeEditor";
import EditMedicationForm from "./components/EditMedicationForm";
import NotificationService from "./services/notificationService";

import {
  getDaysUntil,
  formatAppointmentDate,
} from "./utils/medicationUtils";

function App() {
const { currentHour, greeting } = useClock();
const { startVoiceInput } = useVoiceRecognition();
const requestNotificationPermission = async () => {
  try {
    const { display } = await LocalNotifications.checkPermissions();

    if (display !== "granted") {
      await LocalNotifications.requestPermissions();
    }
  } catch (error) {
    console.error("Failed to request notification permission:", error);
  }
};
useEffect(() => {
  requestNotificationPermission();
}, []);

// Editing state
  const [editingMedicationId, setEditingMedicationId] = useState(null);


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
const [reminderTimes, setReminderTimes] = useState([]);
  

// Streak & History states
  const [history, setHistory] = useLocalStorage(
    "MyMedMinder_history",
    []
  );
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

// Checklist search / filter / sort (RC5)
const [medSearchQuery, setMedSearchQuery] = useState('');
const [medStatusFilter, setMedStatusFilter] = useState('all'); // all | pending | taken | missed
const [medSortBy, setMedSortBy] = useState('time'); // time | name
// Automatically save data points to localStorage
  
  
  
 

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

 // Handle checking/unchecking meds & updating inventory balance
const handleUpdateStock = useCallback((id) => {
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
}, [editStockValue, setMedications]);

const toggleTaken = useCallback((id) => {
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
}, [setMedications]);
  // Add medication
const handleAddMedication = async (e) => {
  e.preventDefault();

  if (!name.trim()) {
    alert("Please enter a Medication Name.");
    return;
  }

 const medicationId = Date.now();

const notificationIds = [];

try {
  for (let index = 0; index < reminderTimes.length; index++) {
    const reminderTime = reminderTimes[index];

    const notificationId =
      NotificationService.generateNotificationId(
        medicationId,
        index + 1
      );

    await NotificationService.scheduleMedicationReminder({
      notificationId,
      medicationName: name.trim(),
      reminderTime,
    });

    notificationIds.push(notificationId);
  }
} catch (error) {
  console.error("Failed to schedule medication reminders:", error);
  alert(
    "The medication could not be saved because one or more reminders failed to schedule."
  );
  return;
}

const newMed = {
  id: medicationId,
  name: name.trim(),
  dosage: dosage || "As directed",
  dosageType,
  period,
  instructions: instructions || "No special instructions",
  reminderTimes: [...reminderTimes],
  notificationIds,
  inventory: inventory !== "" ? Number(inventory) : null,
  taken: false,
  takenAt: null,
};
setMedications((prev) => [...prev, newMed]);

  // Reset form
  setName("");
  setDosage("");
  setDosageType("Tablet");
  setPeriod("Morning");
  setInstructions("");
  setInventory("");
  setReminderTimes([]);
};

  // Open the edit form for a given medication
  const handleStartEditMedication = useCallback((med) => {
    setEditingMedicationId(med.id);
  }, []);

  // Close the edit form without saving
  const handleCancelEditMedication = () => {
    setEditingMedicationId(null);
  };

  // Save an edited medication: reschedule all its notifications from scratch
  // so reminder-time changes, additions, and removals are always reflected.
  const handleSaveEditedMedication = async (updatedFields) => {
    const medicationId = editingMedicationId;
    const original = medications.find((med) => med.id === medicationId);
    if (!original) return;

    try {
      if (original.notificationIds && original.notificationIds.length > 0) {
        await NotificationService.cancelMedicationReminders(
          original.notificationIds
        );
      }
    } catch (error) {
      console.error("Failed to cancel existing reminders during edit:", error);
      alert(
        "The medication could not be updated because its existing reminders could not be cancelled. Please try again."
      );
      return;
    }

    const notificationIds = [];

    try {
      for (let index = 0; index < updatedFields.reminderTimes.length; index++) {
        const reminderTime = updatedFields.reminderTimes[index];

        const notificationId = NotificationService.generateNotificationId(
          medicationId,
          index + 1
        );

        await NotificationService.scheduleMedicationReminder({
          notificationId,
          medicationName: updatedFields.name.trim(),
          reminderTime,
        });

        notificationIds.push(notificationId);
      }
    } catch (error) {
      console.error("Failed to reschedule medication reminders:", error);
      alert(
        "The medication could not be updated because one or more reminders failed to reschedule."
      );
      return;
    }

    setMedications((prev) =>
      prev.map((med) =>
        med.id === medicationId
          ? {
              ...med,
              name: updatedFields.name.trim(),
              dosage: updatedFields.dosage || "As directed",
              dosageType: updatedFields.dosageType,
              period: updatedFields.period,
              instructions:
                updatedFields.instructions || "No special instructions",
              inventory:
                updatedFields.inventory !== ""
                  ? Number(updatedFields.inventory)
                  : null,
              reminderTimes: [...updatedFields.reminderTimes],
              notificationIds,
            }
          : med
      )
    );

    setEditingMedicationId(null);
  };


  // Delete medication
  const deleteMedication = useCallback(async (id) => {
  if (
    window.confirm(
      "Are you sure you want to remove this medication from your schedule?"
    )
  ) {
    const medicationToDelete = medications.find((med) => med.id === id);

    // Cancel any scheduled notifications so they don't keep firing
    // for a medication that no longer exists.
    if (
      medicationToDelete?.notificationIds &&
      medicationToDelete.notificationIds.length > 0
    ) {
      try {
        await NotificationService.cancelMedicationReminders(
          medicationToDelete.notificationIds
        );
      } catch (error) {
        console.error(
          "Failed to cancel reminders for deleted medication:",
          error
        );
        // We still remove the medication even if cancellation fails,
        // since leaving it stuck in the list is worse than a stray
        // notification the user can dismiss manually.
      }
    }

    setMedications((prev) => prev.filter((med) => med.id !== id));
  }
}, [medications, setMedications]);

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
  
const checkIfMissed = useCallback((med) => {
    if (med.taken) return false;
    if (med.period === 'Morning' && currentHour >= 12) return true;
    if (med.period === 'Afternoon' && currentHour >= 17) return true;
    return false;
  }, [currentHour]);
const getPeriodIcon = useCallback((period) => {
  if (period === "Morning") {
    return <i className="fa-solid fa-cloud-sun icon-morning"></i>;
  }

  if (period === "Afternoon") {
    return <i className="fa-solid fa-sun icon-afternoon"></i>;
  }

  return <i className="fa-solid fa-moon icon-evening"></i>;
}, []);
 
  // Search + status filter applied across all periods (RC5)
  const visibleMedications = React.useMemo(() => {
    const query = medSearchQuery.trim().toLowerCase();

    return medications.filter((med) => {
      if (query) {
        const haystack = `${med.name} ${med.dosage} ${med.instructions}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      const missed = checkIfMissed(med);

      if (medStatusFilter === 'taken' && !med.taken) return false;
      if (medStatusFilter === 'pending' && (med.taken || missed)) return false;
      if (medStatusFilter === 'missed' && !missed) return false;

      return true;
    });
  }, [medications, medSearchQuery, medStatusFilter, currentHour]);

  const sortMedications = (meds) => {
    const sorted = [...meds];

    if (medSortBy === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Sort by earliest reminder time; meds with no reminder times sort last.
      sorted.sort((a, b) => {
        const aTime =
          Array.isArray(a.reminderTimes) && a.reminderTimes.length > 0
            ? a.reminderTimes[0]
            : '99:99';
        const bTime =
          Array.isArray(b.reminderTimes) && b.reminderTimes.length > 0
            ? b.reminderTimes[0]
            : '99:99';
        return aTime.localeCompare(bTime);
      });
    }

    return sorted;
  };

  const hasActiveMedFilters =
    medSearchQuery.trim() !== '' || medStatusFilter !== 'all';
  const noMedSearchResults =
    medications.length > 0 && visibleMedications.length === 0;

  const clearMedFilters = () => {
    setMedSearchQuery('');
    setMedStatusFilter('all');
  };

  // Overall adherence stats, derived from the last 7 saved daily scores (RC5)
  const overallAdherenceStats = React.useMemo(() => {
    let totalTaken = 0;
    let totalPossible = 0;

    history.forEach((record) => {
      const [takenStr, totalStr] = record.scoreText.split('/');
      const taken = Number(takenStr);
      const total = Number(totalStr);
      if (!Number.isNaN(taken) && !Number.isNaN(total)) {
        totalTaken += taken;
        totalPossible += total;
      }
    });

    const percentage =
      totalPossible === 0 ? null : Math.round((totalTaken / totalPossible) * 100);

    return { totalTaken, totalPossible, percentage };
  }, [history]);

  // Missed-dose counts grouped by medication, most-missed first (RC5)
  const missedByMedication = React.useMemo(() => {
    const counts = {};
    missedHistory.forEach((entry) => {
      counts[entry.medName] = (counts[entry.medName] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([medName, count]) => ({ medName, count }))
      .sort((a, b) => b.count - a.count);
  }, [missedHistory]);

  // Most recent missed-dose log entries, newest first (RC5)
  const recentMissedEntries = React.useMemo(() => {
    return [...missedHistory]
      .sort((a, b) => new Date(b.dateMissed) - new Date(a.dateMissed))
      .slice(0, 10);
  }, [missedHistory]);

  const formatDaysAgo = (dateString) => {
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    const startOfEntryDay = new Date(dateString).setHours(0, 0, 0, 0);
    const days = Math.round((startOfToday - startOfEntryDay) / (1000 * 60 * 60 * 24));

    if (days <= 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  // Grouped + sorted meds per period, memoized so the array reference stays
  // stable across unrelated re-renders (e.g. typing in the Add form) —
  // this is what lets React.memo on MedicationGroup/MedicationCard actually skip work.
  const groupedMedications = React.useMemo(() => {
    const periods = ['Morning', 'Afternoon', 'Evening'];
    const groups = {};
    periods.forEach((p) => {
      groups[p] = sortMedications(
        visibleMedications.filter((med) => med.period === p)
      );
    });
    return groups;
  }, [visibleMedications, medSortBy]);

  // Quick-nav: scroll to a section AND move keyboard focus there, so
  // keyboard/screen-reader users land in the new section instead of just
  // having the page scroll under them with focus left behind.
  const [activeQuickNav, setActiveQuickNav] = useState('add-medication');
  const handleQuickNavClick = useCallback((sectionId) => {
    const el = document.getElementById(sectionId);
    if (!el) return;
    setActiveQuickNav(sectionId);
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Slight delay so focus lands after the scroll starts, rather than
    // fighting it (jumpy behavior on some screen readers otherwise).
    window.setTimeout(() => {
      el.focus({ preventScroll: true });
    }, 300);
  }, []);

  // Reusable function to print out cards for a specific time period
 const renderMedGroup = (timePeriod, sectionTitle) => {
  const filteredMeds = groupedMedications[timePeriod];

  return (
    <MedicationGroup
      sectionTitle={sectionTitle}
      timePeriod={timePeriod}
      filteredMeds={filteredMeds}
      getPeriodIcon={getPeriodIcon}
      checkIfMissed={checkIfMissed}
      editingStockId={editingStockId}
      editStockValue={editStockValue}
      setEditStockValue={setEditStockValue}
      setEditingStockId={setEditingStockId}
      handleUpdateStock={handleUpdateStock}
      toggleTaken={toggleTaken}
      deleteMedication={deleteMedication}
      onEdit={handleStartEditMedication}
    />
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
useEffect(() => {
  if (bannerMessages.length === 0) {
    setBannerIndex(0);
    return;
  }

  if (bannerIndex >= bannerMessages.length) {
    setBannerIndex(0);
  }
}, [bannerMessages, bannerIndex]);

React.useEffect(() => {
  if (bannerMessages.length <= 1) return;
  const timer = setInterval(() => {
    setBannerIndex(prev => (prev + 1) % bannerMessages.length);
  }, 4000);
  return () => clearInterval(timer);
}, [bannerMessages]);
// Dashboard summary values
const totalMedications = medications.length;
const takenToday = medications.filter(med => med.taken).length;
const remainingToday = totalMedications - takenToday;

const completionPercentage =
  totalMedications === 0
    ? 0
    : Math.round((takenToday / totalMedications) * 100);

const editingMedication =
  medications.find((med) => med.id === editingMedicationId) || null;

 return (
    <div className="app-container">
      {/* MEDICATION EDIT MODAL */}
      {editingMedication && (
        <EditMedicationForm
          key={editingMedication.id}
          med={editingMedication}
          onSave={handleSaveEditedMedication}
          onCancel={handleCancelEditMedication}
        />
      )}

      {/* MISSED DOSE ALERT POPUP */}
      
      {/* 1. TOP BANNER */}
      <div className="welcome-banner">
<BannerStrip
  bannerMessages={bannerMessages}
  bannerIndex={bannerIndex}
/>
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
<section className="dashboard-summary" aria-label="Today's medication summary">
  <div className="summary-card">
    <i className="fa-solid fa-pills summary-icon" aria-hidden="true"></i>
   <div className="summary-content">
  <span className="summary-value">{remainingToday}</span>

  <span className="summary-label">
    {remainingToday === 1 ? "Dose Remaining" : "Doses Remaining"}
  </span>

  <div
    className="summary-progress"
    role="progressbar"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow={completionPercentage}
    aria-label="Today's medication completion"
  >
    <div
      className="summary-progress-fill"
      style={{ width: `${completionPercentage}%` }}
    />
  </div>

  <span className="summary-progress-text">
    {completionPercentage}% completed
  </span>
</div>
  </div>

  <div className="summary-card">
    <i className="fa-solid fa-circle-check summary-icon" aria-hidden="true"></i>
    <div>
      <span className="summary-value">{takenToday}</span>
      <span className="summary-label">Taken Today</span>
    </div>
  </div>

  <div className="summary-card">
    <i className="fa-solid fa-fire summary-icon" aria-hidden="true"></i>
    <div>
      <span className="summary-value">{streak}</span>
      <span className="summary-label">
        {streak === 1 ? "Day Streak" : "Day Streak"}
      </span>
    </div>
  </div>
</section>
      <nav className="quick-nav-bar">
        <button type="button" className={activeQuickNav === 'add-medication' ? 'active' : ''} onClick={() => handleQuickNavClick('add-medication')}>
          <i className="fa-solid fa-circle-plus" aria-hidden="true"></i>
          <span>Add</span>
        </button>
        <button type="button" className={activeQuickNav === 'checklist' ? 'active' : ''} onClick={() => handleQuickNavClick('checklist')}>
          <i className="fa-solid fa-calendar-check" aria-hidden="true"></i>
          <span>Checklist</span>
        </button>
       <button type="button" className={activeQuickNav === 'adherence' ? 'active' : ''} onClick={() => handleQuickNavClick('adherence')}>
          <i className="fa-solid fa-chart-line" aria-hidden="true"></i>
          <span>Streak</span>
        </button>
        <button type="button" className={activeQuickNav === 'vault' ? 'active' : ''} onClick={() => handleQuickNavClick('vault')}>
          <i className="fa-solid fa-lock" aria-hidden="true"></i>
          <span>Vault</span>
        </button>
        <button type="button" className={activeQuickNav === 'appointments' ? 'active' : ''} onClick={() => handleQuickNavClick('appointments')}>
          <i className="fa-solid fa-user-doctor" aria-hidden="true"></i>
          <span>Visits</span>
        </button>
      </nav>
      <div className="main-content">
        {/* 2. FORM SECTION */}
        <section className="form-section" id="add-medication" tabIndex={-1} aria-label="Add New Medication section">
 
  <h2><i className="fa-solid fa-circle-plus" aria-hidden="true"></i> Add New Medication</h2>
         <form onSubmit={handleAddMedication}>
           <div className="form-group">
              <label htmlFor="add-med-name">Medication Name *</label>
              <div className="input-with-mic">
                <input 
                  id="add-med-name"
                  name="medication-name"
                  type="text" 
                  placeholder="e.g., Amoxicillin" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required
                />
                <button
                  type="button"
                  className="mic-btn"
                  onClick={() => startVoiceInput(setName)}
                  title="Speak to fill this field"
                  aria-label="Use voice input for medication name"
                >
                  <i className="fa-solid fa-microphone" aria-hidden="true"></i>
                </button>
              </div>
            </div>
            <div className="form-group">
  <label htmlFor="add-med-dosage">Dosage</label>
  <div className="input-with-mic">
    <input 
      id="add-med-dosage"
      name="dosage"
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
      aria-label="Use voice input for dosage"
    >
      <i className="fa-solid fa-microphone" aria-hidden="true"></i>
    </button>
  </div>
</div>

<div className="form-group">
  <label htmlFor="add-med-dosage-type">Form/Type</label>
  <select id="add-med-dosage-type" name="dosage-type" value={dosageType} onChange={(e) => setDosageType(e.target.value)} className="senior-select">
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
              <label htmlFor="add-med-period">Time Period</label>
              <select id="add-med-period" name="period" value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening / Night</option>
              </select>
            </div>
<div className="form-group">
  <label htmlFor="add-med-instructions">Instructions</label>
  <div className="input-with-mic">
    <input 
      id="add-med-instructions"
      name="instructions"
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
      aria-label="Use voice input for instructions"
    >
      <i className="fa-solid fa-microphone" aria-hidden="true"></i>
    </button>
  </div>
</div>            <div className="form-group">
              <label htmlFor="add-med-inventory">Current Pill Count (Optional Stock Tracker)</label>
              <input
                id="add-med-inventory"
                name="inventory"
                type="number"
                min="0"
                placeholder="e.g., 30"
                value={inventory}
                onChange={(e) => setInventory(e.target.value)}
              />

            </div>
<div className="form-group">
  <p className="form-group-heading">Reminder Times</p>

  <ReminderTimeEditor
    value={reminderTimes}
    onChange={setReminderTimes}
  />
</div>
            <button type="submit" className="add-med-btn">Save Medication</button>
          </form>
        </section>

        {/* 3. SCHEDULE CHECKLIST SECTION */}
      <section className="schedule-section" id="checklist" tabIndex={-1} aria-label="Checklist section">
          <div className="schedule-header-block">
            <div>
              <h2>
                <i className="fa-solid fa-calendar-check header-form-icon" aria-hidden="true"></i> Today's Checklist
              </h2>
            
            </div>
          <div className="header-action-buttons">
  <button type="button" className="print-schedule-btn" onClick={() => window.print()}>
    <i className="fa-solid fa-print" aria-hidden="true"></i> Print Report for Doctor
  </button>
  <button type="button" className="export-csv-btn" onClick={handleExportCSV}>
    <i className="fa-solid fa-file-csv" aria-hidden="true"></i> Export CSV
  </button>
</div>
          </div>

          {/* Search / Filter / Sort (RC5) */}
          <div className="schedule-filter-bar">
            <div className="input-with-mic search-input-wrap">
              <input
                type="text"
                className="med-search-input"
                placeholder="Search medications..."
                value={medSearchQuery}
                onChange={(e) => setMedSearchQuery(e.target.value)}
                aria-label="Search medications"
              />
              {medSearchQuery && (
                <button
                  type="button"
                  className="mic-btn"
                  onClick={() => setMedSearchQuery('')}
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                </button>
              )}
            </div>

            <select
              className="senior-select"
              value={medStatusFilter}
              onChange={(e) => setMedStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="taken">Taken</option>
              <option value="missed">Missed</option>
            </select>

            <select
              className="senior-select"
              value={medSortBy}
              onChange={(e) => setMedSortBy(e.target.value)}
              aria-label="Sort medications"
            >
              <option value="time">Sort: Reminder Time</option>
              <option value="name">Sort: Name (A-Z)</option>
            </select>

            {hasActiveMedFilters && (
              <button
                type="button"
                className="reset-day-btn"
                onClick={clearMedFilters}
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Compliance History Log Bar */}
<div className="compliance-tracker-bar" id="adherence" tabIndex={-1} aria-label="Adherence and streak section">
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

          {/* Medication Stats & Missed-Dose History (RC5) */}
          <details className="stats-card">
            <summary className="stats-card-summary">
              <span className="stats-card-title">
                <i className="fa-solid fa-chart-line" aria-hidden="true"></i> Adherence &amp; History
              </span>
              <span className="stats-card-preview">
                <span className="stats-pill stats-pill-good">
                  {overallAdherenceStats.percentage === null
                    ? '— % this week'
                    : `${overallAdherenceStats.percentage}% this week`}
                </span>
                <span className="stats-pill stats-pill-warn">
                  {missedHistory.length} missed
                </span>
                <i className="fa-solid fa-chevron-down stats-chevron" aria-hidden="true"></i>
              </span>
            </summary>

            <div className="stats-card-body">
              <div className="stats-tiles-row">
                <div className="stat-tile">
                  <div
                    className="stat-ring"
                    style={{
                      '--pct': overallAdherenceStats.percentage ?? 0,
                    }}
                  >
                    <span>
                      {overallAdherenceStats.percentage === null
                        ? '—'
                        : `${overallAdherenceStats.percentage}%`}
                    </span>
                  </div>
                  <div className="stat-tile-caption">
                    <span className="stat-tile-label">7-Day Adherence</span>
                    {overallAdherenceStats.totalPossible > 0 && (
                      <span className="stat-tile-sub">
                        {overallAdherenceStats.totalTaken}/
                        {overallAdherenceStats.totalPossible} doses taken
                      </span>
                    )}
                  </div>
                </div>

                <div className="stat-tile stat-tile-count">
                  <span className="stat-big-num">{missedHistory.length}</span>
                  <span className="stat-tile-label">Missed Doses Logged</span>
                </div>
              </div>

              {missedByMedication.length > 0 && (
                <div className="stats-section">
                  <h4>Most Frequently Missed</h4>
                  <div className="chip-row">
                    {missedByMedication.slice(0, 5).map((entry) => (
                      <span className="missed-chip" key={entry.medName}>
                        {entry.medName}
                        <span className="missed-chip-count">
                          {entry.count}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="stats-section">
                <h4>Recent Missed Doses</h4>
                {recentMissedEntries.length === 0 ? (
                  <p className="stats-empty-note">
                    No missed doses logged yet — keep it up!
                  </p>
                ) : (
                  <>
                    <ul className="missed-log-compact">
                      {recentMissedEntries.slice(0, 5).map((entry) => (
                        <li key={entry.id}>
                          <span className="log-dot" aria-hidden="true"></span>
                          <span className="log-text">
                            <strong>{entry.medName}</strong>
                            <span className="log-period">
                              {' '}
                              &middot; {entry.period}
                            </span>
                          </span>
                          <span className="log-time">
                            {formatDaysAgo(entry.dateMissed)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {recentMissedEntries.length > 5 && (
                      <p className="stats-more-note">
                        +{recentMissedEntries.length - 5} more in the last 10
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </details>

          <div className="schedule-timeline-container">
            {noMedSearchResults ? (
              <div className="empty-period-state">
                <i
                  className="fa-solid fa-magnifying-glass empty-period-icon"
                  aria-hidden="true"
                ></i>
                <h4>No medications match your search</h4>
                <p className="empty-period-text">
                  Try a different search term, or clear your filters to see
                  everything again.
                </p>
                <button
                  type="button"
                  className="reset-day-btn"
                  onClick={clearMedFilters}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                {renderMedGroup('Morning', 'Morning Routine')}
                {renderMedGroup('Afternoon', 'Afternoon Routine')}
                {renderMedGroup('Evening', 'Evening / Night Routine')}
              </>
            )}
          </div>
        </section>

        {/* 4. PRESCRIPTION VAULT SECTION */}
        <section className="form-section" id="vault" tabIndex={-1} aria-label="Prescription Vault section">
          <h2><i className="fa-solid fa-lock" aria-hidden="true"></i> Prescription Vault</h2>

          {!vaultPin ? (
            // FIRST TIME SETUP
            <VaultSetup onSetup={handleSetupVault} />
         ) : !vaultUnlocked ? (
  // LOCKED - SHOW PIN ENTRY
  <div className="vault-locked">
    {!showForgotPin ? (
      <>
        <p className="vault-lock-message">
          <i className="fa-solid fa-shield-halved" aria-hidden="true"></i> This section is locked. Enter your PIN to view prescriptions.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCheckPin();
          }}
          noValidate
        >
          <label htmlFor="vault-unlock-pin" className="sr-only">
            Enter 4-digit PIN
          </label>
          <input
            id="vault-unlock-pin"
            name="unlock-pin"
            type="password"
            maxLength="4"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Enter 4-digit PIN"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
            className="vault-pin-input"
          />
          <button type="submit" className="add-med-btn">
            Unlock Vault
          </button>
        </form>
        <button
          type="button"
          className="vault-forgot-link"
          onClick={() => setShowForgotPin(true)}
        >
          Forgot PIN?
        </button>
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
                <label htmlFor="vault-photo-upload" className="add-med-btn vault-upload-btn">
                  <i className="fa-solid fa-camera" aria-hidden="true"></i> Add Prescription Photo
                  <input 
                    id="vault-photo-upload"
                    type="file" 
                    accept="image/*" 
                    onChange={handleAddVaultPhoto} 
                    className="sr-only"
                  />
                </label>
                <button type="button" className="reset-day-btn" onClick={() => setVaultUnlocked(false)}>
                  <i className="fa-solid fa-lock" aria-hidden="true"></i> Lock Vault
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
                        type="button"
                        className="delete-btn vault-delete-btn" 
                        onClick={() => handleDeleteVaultPhoto(photo.id)}
                        title="Delete"
                        aria-label={`Delete prescription photo from ${new Date(photo.dateAdded).toLocaleDateString()}`}
                      >
                        <i className="fa-solid fa-trash-can" aria-hidden="true"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* 5. DOCTOR APPOINTMENTS SECTION */}
        <section className="form-section" id="appointments" tabIndex={-1} aria-label="Doctor Appointments section">
          <h2><i className="fa-solid fa-user-doctor" aria-hidden="true"></i> Doctor Appointments</h2>

          <form onSubmit={handleAddAppointment} className="med-form">
           <div className="form-group">
  <label htmlFor="add-appt-doctor">Doctor Name *</label>
  <div className="input-with-mic">
    <input 
      id="add-appt-doctor"
      name="doctor-name"
      type="text" 
      placeholder="e.g., Dr. Smith"
      value={doctorName}
      onChange={(e) => setDoctorName(e.target.value)}
      required
    />
    <button
      type="button"
      className="mic-btn"
      onClick={() => startVoiceInput(setDoctorName)}
      title="Speak to fill this field"
      aria-label="Use voice input for doctor name"
    >
      <i className="fa-solid fa-microphone" aria-hidden="true"></i>
    </button>
  </div>
</div>
<div className="form-group">
  <label htmlFor="add-appt-purpose">Purpose / Specialty</label>
  <div className="input-with-mic">
    <input 
      id="add-appt-purpose"
      name="appointment-purpose"
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
      aria-label="Use voice input for appointment purpose"
    >
      <i className="fa-solid fa-microphone" aria-hidden="true"></i>
    </button>
  </div>
</div>
<div className="form-group">
              <label htmlFor="add-appt-date">Appointment Date *</label>
              <input 
                id="add-appt-date"
                name="appointment-date"
                type="date" 
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                required
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
  <AppointmentCard
    key={appt.id}
    appt={appt}
    daysUntil={daysUntil}
    isUrgent={isUrgent}
    isPast={isPast}
    editingAppointmentId={editingAppointmentId}
    editDateValue={editDateValue}
    setEditDateValue={setEditDateValue}
    handleSaveEditedDate={handleSaveEditedDate}
    handleCancelEditAppointment={handleCancelEditAppointment}
    handleStartEditAppointment={handleStartEditAppointment}
    handleDeleteAppointment={handleDeleteAppointment}
    formatAppointmentDate={formatAppointmentDate}
  />
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

   
function ForgotPinFlow({ question, answerInput, setAnswerInput, onVerify, onCancel }) {
  const [newPin, setNewPin] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPin.length !== 4) {
      alert("New PIN must be exactly 4 digits.");
      return;
    }
    onVerify(newPin);
  };

  return (
    <div className="vault-forgot-flow">
      <p className="vault-lock-message">
        <i className="fa-solid fa-circle-question" aria-hidden="true"></i> {question}
      </p>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="forgot-pin-answer">Your Answer</label>
          <input
            id="forgot-pin-answer"
            name="security-answer"
            type="text"
            autoComplete="off"
            placeholder="Enter your answer"
            value={answerInput}
            onChange={(e) => setAnswerInput(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="forgot-pin-new-pin">New 4-digit PIN</label>
          <input
            id="forgot-pin-new-pin"
            name="new-pin"
            type="password"
            maxLength="4"
            inputMode="numeric"
            autoComplete="new-password"
            placeholder="Choose a new PIN"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
          />
        </div>
        <button type="submit" className="add-med-btn">
          Reset PIN & Unlock
        </button>
      </form>
      <button type="button" className="vault-forgot-link" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}
export default App;
