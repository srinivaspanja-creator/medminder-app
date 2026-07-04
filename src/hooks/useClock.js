import { useEffect, useState } from "react";

export default function useClock() {
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    const updateTimeContext = () => {
      const hour = new Date().getHours();
      setCurrentHour(hour);

      if (hour < 12) {
        setGreeting("Good Morning");
      } else if (hour < 17) {
        setGreeting("Good Afternoon");
      } else {
        setGreeting("Good Evening");
      }
    };

    updateTimeContext();

    const interval = setInterval(updateTimeContext, 60000);

    return () => clearInterval(interval);
  }, []);

  return {
    currentHour,
    greeting,
  };
}