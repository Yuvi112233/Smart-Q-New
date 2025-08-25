import { useLocation } from "wouter";

interface BottomNavProps {
  className?: string;
}

export default function BottomNav({ className = "" }: BottomNavProps) {
  const [location, navigate] = useLocation();

  const navItems = [
    {
      icon: "fas fa-home",
      label: "Home",
      path: "/",
      isActive: location === "/",
    },
    {
      icon: "fas fa-search",
      label: "Search",
      path: "/",
      isActive: false,
    },
    {
      icon: "fas fa-calendar",
      label: "Queue",
      path: "/",
      isActive: false,
    },
    {
      icon: "fas fa-user",
      label: "Profile",
      path: "/profile",
      isActive: location === "/profile",
    },
  ];

  const handleNavigation = (path: string, label: string) => {
    if (label === "Search") {
      // Focus search input on home page if already there
      if (location === "/") {
        const searchInput = document.querySelector('[data-testid="input-search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      } else {
        navigate("/");
      }
    } else if (label === "Queue") {
      // For now, navigate to home. In a real app, this would show user's queue status
      navigate("/");
    } else {
      navigate(path);
    }
  };

  return (
    <nav className={`fixed bottom-0 left-0 right-0 bg-white border-t border-blush-100 px-4 py-2 ${className}`}>
      <div className="flex justify-around">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => handleNavigation(item.path, item.label)}
            className={`flex flex-col items-center py-2 transition-colors ${
              item.isActive 
                ? 'text-blush-500' 
                : 'text-gray-400 hover:text-blush-500'
            }`}
            data-testid={`button-nav-${item.label.toLowerCase()}`}
          >
            <i className={`${item.icon} text-lg mb-1`}></i>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
