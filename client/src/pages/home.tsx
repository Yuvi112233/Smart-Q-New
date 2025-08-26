import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import SalonCard from "@/components/salon-card";
import BottomNav from "@/components/ui/bottom-nav";
import { useEffect, useState } from "react";

interface Salon {
  id: string;
  name: string;
  location: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  services: string[];
  currentOffer: string | null;
  queueCount: number;
}

export default function Home() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: salons, isLoading } = useQuery<Salon[]>({
    queryKey: ["/api/salons"],
    retry: false,
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

  const filteredSalons = salons?.filter(salon =>
    salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    salon.location.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-blush-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blush-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading salons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-blush-50 pb-20">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-blush-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <i className="fas fa-cut text-blush-500 text-xl"></i>
              <h1 className="font-serif text-xl font-bold text-gray-800">SmartQ</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                className="text-gray-600 hover:text-blush-500 transition-colors"
                data-testid="button-notifications"
              >
                <i className="fas fa-bell text-lg"></i>
              </button>
              <button 
                className="text-gray-600 hover:text-blush-500 transition-colors"
                onClick={() => window.location.href = "/profile"}
                data-testid="button-profile"
              >
                <i className="fas fa-user-circle text-lg"></i>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 py-12 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Skip the Wait, Book Your Spot
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join virtual queues at your favorite salons and get notified when it's your turn
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <Input
              type="text"
              placeholder="Search salons near you..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-blush-200 rounded-2xl shadow-lg focus:outline-none focus:border-blush-400 focus:ring-2 focus:ring-blush-100 transition-all"
              data-testid="input-search"
            />
            <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>
      </section>

      {/* Salons Grid */}
      <section className="px-4 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold text-gray-800">
              {searchQuery ? `Search Results (${filteredSalons.length})` : 'Nearby Salons'}
            </h3>
            <button className="text-blush-500 font-medium hover:text-blush-600 transition-colors">
              View All <i className="fas fa-arrow-right ml-1"></i>
            </button>
          </div>

          {filteredSalons.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-search text-gray-300 text-6xl mb-4"></i>
              <h4 className="text-xl font-semibold text-gray-600 mb-2">
                {searchQuery ? 'No salons found' : 'No salons available'}
              </h4>
              <p className="text-gray-500">
                {searchQuery ? 'Try adjusting your search terms' : 'Check back later for new salons'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSalons.map((salon) => (
                <SalonCard key={salon.id} salon={salon} />
              ))}
            </div>
          )}
        </div>
      </section>

      <BottomNav />
    </div>
  );
}
