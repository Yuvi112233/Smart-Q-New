import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";

interface Visit {
  id: string;
  salonName: string;
  serviceName: string;
  visitDate: string;
  totalAmount: number;
  pointsEarned: number;
  rating: number | null;
}

export default function UserProfile() {
  const { toast } = useToast();
  const { user, isLoading: authLoading, logout } = useAuth();

  const { data: visits, isLoading } = useQuery<Visit[]>({
    queryKey: ["/api/user/visits"],
    retry: false,
    enabled: !!user,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  const handleLogout = async () => {
    try {
      // Use the logoutMutation directly from useAuth hook
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      // Redirect to home page
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const loyaltyProgress = user ? (user.loyaltyPoints % 1000) / 1000 * 100 : 0;
  const pointsToNextReward = user ? 1000 - (user.loyaltyPoints % 1000) : 0;

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-blush-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blush-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-blush-50 pb-20">
      {/* Navigation */}
      <nav className="bg-white border-b border-blush-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button 
              className="text-gray-600 hover:text-blush-500 transition-colors"
              onClick={() => window.history.back()}
              data-testid="button-back"
            >
              <i className="fas fa-arrow-left text-lg"></i>
            </button>
            <h1 className="font-serif text-lg font-semibold text-gray-800">My Profile</h1>
            <button 
              className="flex items-center px-3 py-2 bg-blush-500 text-white rounded-md hover:bg-blush-600 transition-colors"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <i className="fas fa-sign-out-alt text-lg mr-2"></i>
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Profile Header */}
      <section className="px-4 py-6">
        <div className="bg-gradient-to-r from-blush-500 to-pink-500 rounded-2xl p-6 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <i className="fas fa-user text-2xl text-white"></i>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold" data-testid="text-user-name">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.firstName || 'Anonymous User'
                }
              </h2>
              <p className="text-white/90" data-testid="text-user-email">{user?.email || 'No email'}</p>
              <p className="text-white/75 text-sm" data-testid="text-user-phone">{user?.phone || 'No phone'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Loyalty Points */}
      <section className="px-4 pb-6">
        <Card className="border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Loyalty Points</h3>
              <i className="fas fa-star text-yellow-400 text-xl"></i>
            </div>
            
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-blush-600 mb-1" data-testid="text-loyalty-points">
                {user?.loyaltyPoints || 0}
              </div>
              <p className="text-gray-600">Total Points Earned</p>
            </div>
            
            <div className="bg-blush-50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Next Reward</span>
                <span className="text-sm font-medium text-blush-600">
                  {pointsToNextReward} points to go
                </span>
              </div>
              <div className="w-full bg-blush-200 rounded-full h-2">
                <div 
                  className="bg-blush-500 h-2 rounded-full" 
                  style={{ width: `${loyaltyProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Free premium service at next 1000 points</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Recent Visits */}
      <section className="px-4 pb-20">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Visits</h3>
        
        {!visits || visits.length === 0 ? (
          <Card className="border-gray-100">
            <CardContent className="pt-6 text-center">
              <i className="fas fa-calendar-times text-gray-300 text-6xl mb-4"></i>
              <h4 className="text-xl font-semibold text-gray-600 mb-2">No visits yet</h4>
              <p className="text-gray-500 mb-4">Start visiting salons to see your history here</p>
              <Button 
                onClick={() => window.location.href = "/"}
                className="bg-blush-500 hover:bg-blush-600"
              >
                Find Salons
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {visits.map((visit) => (
              <Card key={visit.id} className="border-gray-100" data-testid={`card-visit-${visit.id}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800" data-testid="text-salon-name">
                        {visit.salonName}
                      </h4>
                      <p className="text-sm text-gray-600" data-testid="text-service-name">
                        {visit.serviceName}
                      </p>
                      <p className="text-xs text-gray-500" data-testid="text-visit-date">
                        {formatDate(visit.visitDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      {visit.rating && (
                        <div className="flex items-center space-x-1 mb-1">
                          <i className="fas fa-star text-yellow-400 text-sm"></i>
                          <span className="text-sm font-medium">{visit.rating}.0</span>
                        </div>
                      )}
                      <div className="text-sm text-blush-600 font-medium">
                        +{visit.pointsEarned} pts
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-sm text-gray-600">
                      Total: <span className="font-medium">{formatPrice(visit.totalAmount)}</span>
                    </span>
                    <button className="text-blush-500 text-sm font-medium hover:text-blush-600 transition-colors">
                      Rebook
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
