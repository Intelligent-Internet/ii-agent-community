"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Search, 
  Compass, 
  Heart, 
  PlusSquare, 
  MessageCircle, 
  User,
  Menu,
  Instagram,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Search", href: "/search", icon: Search },
  { name: "Explore", href: "/explore", icon: Compass },
  { name: "Reels", href: "/reels", icon: PlusSquare },
  { name: "Messages", href: "/messages", icon: MessageCircle },
  { name: "Notifications", href: "/notifications", icon: Heart },
  { name: "Create", href: "/create", icon: PlusSquare },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <div className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background p-4 hidden lg:block">
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 py-4 mb-8">
        <Instagram className="h-8 w-8" />
        <h1 className="text-xl font-bold">Instagram</h1>
      </div>

      {/* Navigation */}
      <nav className="space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-12 px-3",
                  isActive && "bg-gray-100 dark:bg-gray-800"
                )}
              >
                <item.icon className="h-6 w-6" />
                <span className="text-base">{item.name}</span>
              </Button>
            </Link>
          );
        })}
        
        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={pathname === "/profile" ? "secondary" : "ghost"}
              className="w-full justify-start gap-3 h-12 px-3"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={user?.profileImage} />
                <AvatarFallback>
                  {user?.displayName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-base">{user?.displayName || 'Profile'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center">
                <Menu className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>

      {/* More Options */}
      <div className="absolute bottom-4 left-4 right-4">
        <Button variant="ghost" className="w-full justify-start gap-3 h-12 px-3">
          <Menu className="h-6 w-6" />
          <span className="text-base">More</span>
        </Button>
      </div>
    </div>
  );
}