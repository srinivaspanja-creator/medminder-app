import { LocalNotifications } from "@capacitor/local-notifications";

const requestPermission = async () => {
  const permission = await LocalNotifications.requestPermissions();
  return permission;
};
const checkPermission = async () => {
  return await LocalNotifications.checkPermissions();
};

const generateNotificationId = (medicationId, reminderIndex) => {
  return medicationId * 100 + reminderIndex;
};

const scheduleMedicationReminder = async ({
  notificationId,
  medicationName,
  reminderTime,
}) => {
  let scheduleDate;

  if (reminderTime instanceof Date) {
    // One-time notification (used for testing)
    scheduleDate = reminderTime;
  } else {
    // Daily reminder ("HH:mm")
    const [hour, minute] = reminderTime.split(":").map(Number);

    const now = new Date();

    scheduleDate = new Date();

    scheduleDate.setHours(hour, minute, 0, 0);

    // If today's reminder has already passed, schedule for tomorrow.
    if (scheduleDate <= now) {
      scheduleDate.setDate(scheduleDate.getDate() + 1);
    }
  }
console.log("Scheduling notification", {
  notificationId,
  scheduleDate,
 reminderTime,
});
  await LocalNotifications.schedule({
    notifications: [
      {
        id: notificationId,
        title: "Medication Reminder",
        body: `Time to take ${medicationName}`,
        schedule: {
          at: scheduleDate,
          repeats: !(reminderTime instanceof Date),
          every: !(reminderTime instanceof Date) ? "day" : undefined,
        },
      },
    ],
  });
};
const cancelMedicationReminder = async (notificationId) => {
  await LocalNotifications.cancel({
    notifications: [{ id: notificationId }],
  });
};

const cancelMedicationReminders = async (notificationIds) => {
  await LocalNotifications.cancel({
    notifications: notificationIds.map((id) => ({ id })),
  });
};

const NotificationService = {
  checkPermission,
  requestPermission,
  generateNotificationId,
  scheduleMedicationReminder,
  cancelMedicationReminder,
  cancelMedicationReminders,
};
export default NotificationService;