"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Search, 
  PlusSquare, 
  Heart, 
  User
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Search", href: "/search", icon: Search },
  { name: "Create", href: "/create", icon: PlusSquare },
  { name: "Notifications", href: "/notifications", icon: Heart },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t lg:hidden">
      <nav className="flex items-center justify-around py-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href} className="flex-1">
              <div className="flex flex-col items-center justify-center py-2">
                <item.icon 
                  className={cn(
                    "h-6 w-6",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} 
                />
              </div>
            </Link>
          );
        })}
        
        {/* Profile */}
        <Link href="/profile" className="flex-1">
          <div className="flex flex-col items-center justify-center py-2">
            <Avatar className={cn(
              "h-6 w-6",
              pathname === "/profile" && "ring-2 ring-primary ring-offset-1"
            )}>
              <AvatarImage src={user?.profileImage} />
              <AvatarFallback>
                {user?.displayName?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </Link>
      </nav>
    </div>
  );
}