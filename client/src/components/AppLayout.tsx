import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home, Compass, Shield, Users, Plane, Calendar,
  Bell, User, LogOut, Settings, Tv, Heart, ChevronDown,
  Zap, Menu, X
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/discovery", label: "Discover", icon: Compass },
  { href: "/dream-board", label: "Dream Board", icon: Heart },
  { href: "/trust", label: "Trust Ladder", icon: Shield },
  { href: "/lounge", label: "Social Lounge", icon: Users },
  { href: "/wingman-tv", label: "Wingman TV", icon: Tv },
  { href: "/travel", label: "Travel", icon: Plane },
  { href: "/events", label: "Events", icon: Calendar },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { data: notifications } = trpc.notifications.getAll.useQuery(
    { limit: 5 },
    { enabled: isAuthenticated }
  );
  const { data: wingman } = trpc.wingman.getMyWingman.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Aurora Background */}
      <div className="aurora-bg">
        <div className="aurora-orb aurora-orb-1" />
        <div className="aurora-orb aurora-orb-2" />
        <div className="aurora-orb aurora-orb-3" />
        <div className="aurora-orb aurora-orb-4" />
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "nav-glass shadow-lg" : "bg-transparent"}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/dashboard">
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[oklch(0.58_0.28_290)] to-[oklch(0.72_0.18_200)] flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="font-display font-bold text-lg gradient-text">Wingman</span>
                <span className="text-xs text-muted-foreground font-mono-alt">.vip</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.slice(0, 6).map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}>
                  <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location === href
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}>
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                </Link>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
                    More <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-card border-border">
                  {NAV_ITEMS.slice(6).map(({ href, label, icon: Icon }) => (
                    <DropdownMenuItem key={href} asChild>
                      <Link href={href}>
                        <div className="flex items-center gap-2 cursor-pointer">
                          <Icon className="w-4 h-4" /> {label}
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Wingman Status */}
              {wingman && (
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full glass text-xs">
                  <div className={`w-1.5 h-1.5 rounded-full ${wingman.status === "active" ? "bg-green-400 animate-pulse" : "bg-yellow-400"}`} />
                  <span className="text-muted-foreground">{wingman.wingmanName}</span>
                </div>
              )}

              {/* Notifications */}
              <Link href="/notifications">
                <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full text-[10px] flex items-center justify-center text-white font-bold">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              </Link>

              {/* User Menu */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-[oklch(0.72_0.18_200)] flex items-center justify-center text-xs font-bold text-white">
                        {user?.name?.[0]?.toUpperCase() || "W"}
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card border-border w-48">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile"><div className="flex items-center gap-2 cursor-pointer"><User className="w-4 h-4" /> Profile</div></Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/notifications"><div className="flex items-center gap-2 cursor-pointer"><Settings className="w-4 h-4" /> Settings</div></Link>
                    </DropdownMenuItem>
                    {user?.role === "admin" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin"><div className="flex items-center gap-2 cursor-pointer text-primary"><Zap className="w-4 h-4" /> Admin</div></Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive">
                      <LogOut className="w-4 h-4 mr-2" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button size="sm" className="btn-aurora rounded-lg px-4" onClick={() => window.location.href = getLoginUrl()}>
                  Sign In
                </Button>
              )}

              {/* Mobile Menu Toggle */}
              <button
                className="lg:hidden p-2 rounded-lg hover:bg-white/5"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="lg:hidden glass border-t border-border">
            <div className="container mx-auto px-4 py-3 grid grid-cols-2 gap-1">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}>
                  <button
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      location === href ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon className="w-4 h-4" /> {label}
                  </button>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}
