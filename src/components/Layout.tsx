import { Link, Outlet } from "react-router-dom";
import { LoginArea } from "@/components/auth/LoginArea";
import { Button } from "@/components/ui/button";
import { Trash2, Calendar, Home, User } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export function Layout() {
  const { user } = useCurrentUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2">
                <Trash2 className="h-8 w-8 text-green-600" />
                <span className="text-xl font-bold text-gray-900">Garbage Hunters</span>
              </Link>
              
              <nav className="hidden md:flex space-x-4">
                <Link to="/">
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Home
                  </Button>
                </Link>
                <Link to="/cleanups">
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Cleanups
                  </Button>
                </Link>
                <Link to="/schedule">
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Schedule
                  </Button>
                </Link>
                {user && (
                  <Link to="/profile">
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Profile
                    </Button>
                  </Link>
                )}
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <LoginArea />
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        <Outlet />
      </main>
      
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500 text-sm">
            © 2024 Garbage Hunters - Making the world cleaner, one cleanup at a time
          </p>
        </div>
      </footer>
    </div>
  );
}