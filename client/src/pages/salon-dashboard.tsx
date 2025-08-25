import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";
import { Link } from "wouter";

interface Salon {
  id: string;
  name: string;
  ownerId: string;
}

interface DashboardStats {
  todayCustomers: number;
  avgWaitTime: number;
  currentQueue: number;
  revenue: number;
}

export default function SalonDashboard() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  const { data: salons, isLoading: salonsLoading } = useQuery<Salon[]>({
    queryKey: ["/api/my-salons"],
    retry: false,
    enabled: !!user,
  });

  // For demo purposes, using mock stats. In a real app, you'd fetch this from API
  const mockStats: DashboardStats = {
    todayCustomers: 24,
    avgWaitTime: 18,
    currentQueue: 7,
    revenue: 1200,
  };

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (authLoading || salonsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-blush-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blush-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If user has no salons, show setup screen
  if (!salons || salons.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-blush-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <i className="fas fa-store text-blush-500 text-6xl mb-4"></i>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to SmartQ</h1>
            <p className="text-gray-600 mb-6">Set up your first salon to get started with queue management.</p>
            <Button className="w-full bg-blush-500 hover:bg-blush-600 mb-4">
              Create Your Salon
            </Button>
            <Button variant="outline" onClick={handleLogout} className="w-full">
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const primarySalon = salons[0]; // For demo, use first salon

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-blush-50 pb-20">
      {/* Navigation */}
      <nav className="bg-white border-b border-blush-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <i className="fas fa-cut text-blush-500 text-xl"></i>
              <div>
                <h1 className="font-serif text-lg font-semibold text-gray-800" data-testid="text-salon-name">
                  {primarySalon.name}
                </h1>
                <p className="text-xs text-gray-500">Owner Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-blush-500 transition-colors">
                <i className="fas fa-bell text-lg"></i>
              </button>
              <button 
                className="text-gray-600 hover:text-blush-500 transition-colors"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <i className="fas fa-user-circle text-lg"></i>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Stats */}
      <section className="px-4 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <i className="fas fa-users text-blush-500 text-xl"></i>
                <span className="text-xs text-green-600 font-medium">+12%</span>
              </div>
              <div className="text-2xl font-bold text-gray-800" data-testid="text-today-customers">
                {mockStats.todayCustomers}
              </div>
              <p className="text-sm text-gray-600">Today's Customers</p>
            </CardContent>
          </Card>

          <Card className="border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <i className="fas fa-clock text-yellow-500 text-xl"></i>
                <span className="text-xs text-red-600 font-medium">+5min</span>
              </div>
              <div className="text-2xl font-bold text-gray-800" data-testid="text-avg-wait-time">
                {mockStats.avgWaitTime}
              </div>
              <p className="text-sm text-gray-600">Avg Wait (mins)</p>
            </CardContent>
          </Card>

          <Card className="border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <i className="fas fa-list text-blue-500 text-xl"></i>
                <span className="text-xs text-gray-600">Active</span>
              </div>
              <div className="text-2xl font-bold text-gray-800" data-testid="text-current-queue">
                {mockStats.currentQueue}
              </div>
              <p className="text-sm text-gray-600">In Queue</p>
            </CardContent>
          </Card>

          <Card className="border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <i className="fas fa-dollar-sign text-green-500 text-xl"></i>
                <span className="text-xs text-green-600 font-medium">+8%</span>
              </div>
              <div className="text-2xl font-bold text-gray-800" data-testid="text-revenue">
                ${(mockStats.revenue / 1000).toFixed(1)}k
              </div>
              <p className="text-sm text-gray-600">Today's Revenue</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="px-4 pb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <Link href={`/queue-management/${primarySalon.id}`}>
            <Button className="w-full h-auto bg-gradient-to-r from-blush-500 to-pink-500 text-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] flex flex-col items-center space-y-2" data-testid="button-manage-queue">
              <i className="fas fa-list-ul text-2xl"></i>
              <div className="font-semibold">Manage Queue</div>
              <div className="text-sm opacity-90">Call next customer</div>
            </Button>
          </Link>

          <Button className="w-full h-auto bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] flex flex-col items-center space-y-2" data-testid="button-edit-profile">
            <i className="fas fa-edit text-2xl"></i>
            <div className="font-semibold">Edit Profile</div>
            <div className="text-sm opacity-90">Update salon info</div>
          </Button>

          <Button className="w-full h-auto bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] flex flex-col items-center space-y-2" data-testid="button-manage-offers">
            <i className="fas fa-percentage text-2xl"></i>
            <div className="font-semibold">Manage Offers</div>
            <div className="text-sm opacity-90">Create promotions</div>
          </Button>

          <Link href={`/analytics/${primarySalon.id}`}>
            <Button className="w-full h-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] flex flex-col items-center space-y-2" data-testid="button-analytics">
              <i className="fas fa-chart-bar text-2xl"></i>
              <div className="font-semibold">Analytics</div>
              <div className="text-sm opacity-90">View reports</div>
            </Button>
          </Link>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="px-4 pb-20">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h3>
        
        <Card className="border-gray-100">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 py-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-check text-green-600 text-sm"></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">Sarah Johnson completed her appointment</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 py-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-plus text-blue-600 text-sm"></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">Mike Chen joined the queue</p>
                  <p className="text-xs text-gray-500">5 minutes ago</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 py-2">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-bell text-yellow-600 text-sm"></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">Emma Davis was notified (Position #1)</p>
                  <p className="text-xs text-gray-500">8 minutes ago</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 py-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-percentage text-purple-600 text-sm"></i>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">New offer "20% Off First Visit" was activated</p>
                  <p className="text-xs text-gray-500">1 hour ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
