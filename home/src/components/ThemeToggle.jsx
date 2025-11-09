import { Moon, SunMedium } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const safeTheme = theme === "light" || theme === "dark" ? theme : "dark";

  const titles = {
    light: "Light mode (click for dark)",
    dark: "Dark mode (click for light)",
  };

  const Icon = () => {
    if (safeTheme === "dark") {
      return <Moon size={16} />;
    }
    return <SunMedium size={16} />;
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={titles[safeTheme]}
      title={titles[safeTheme]}
      data-variant={safeTheme}
      onClick={toggleTheme}
    >
      <Icon />
    </button>
  );
}

export default ThemeToggle;
