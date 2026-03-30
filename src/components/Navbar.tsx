import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Home, FileSearch, User, LogOut, Sun, Moon, Scan } from "lucide-react";

export function Navbar() {
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navLinkClass = (path: string) =>
    `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 font-heading ${
      isActive(path)
        ? "bg-primary/10 text-primary dark:text-glow-sm"
        : "text-muted-foreground hover:text-foreground hover:bg-accent"
    }`;

  return (
    <nav className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <Scan className="h-6 w-6 text-primary dark:text-glow-sm transition-all group-hover:scale-110" />
          <span className="font-heading font-bold text-lg text-foreground dark:text-glow">
            ResumeAI
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <Link to="/" className={navLinkClass("/")}>
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <Link to="/scan" className={navLinkClass("/scan")}>
            <FileSearch className="h-4 w-4" />
            <span className="hidden sm:inline">Scan</span>
          </Link>
          <Link to="/profile" className={navLinkClass("/profile")}>
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-muted-foreground hover:text-destructive gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
