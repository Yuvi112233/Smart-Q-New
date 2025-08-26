import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect } from "react";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
}

interface Offer {
  id: string;
  title: string;
  description: string;
  discount: number | null;
  validUntil: string;
}

interface SalonDetails {
  id: string;
  name: string;
  description: string;
  location: string;
  phone: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  operatingHours: string;
  services: Service[];
  offers: Offer[];
  queueCount: number;
}

export default function SalonProfile() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: salon, isLoading, refetch } = useQuery<SalonDetails>({
    queryKey: ["/api/salons", id],
    retry: false,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0, // Consider data stale immediately
    onSuccess: (data) => {
      console.log("Salon data fetched successfully:", data);
      if (data?.offers) {
        console.log("Offers found:", data.offers.length);
      }
    }
  });
  
  // Offers now come from salon payload; no separate fetch needed

  const { data: queueStatus } = useQuery({
    queryKey: [`/api/user/queue-status?salonId=${id}`],
    retry: false,
    enabled: !!user && !!id,
  });

  const [, setLocation] = useLocation();
  
  const joinQueueMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      console.log("Joining queue with:", { salonId: id, serviceId: serviceId || "default-service-id" });
      
      try {
        // Direct fetch implementation
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/queue/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            salonId: id,
            serviceId: serviceId || "default-service-id",
            status: "waiting"
          }),
          credentials: "include"
        });
        
        console.log("Join queue response status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Join queue error:", errorText);
          throw new Error(errorText || "Failed to join queue");
        }
        
        const data = await response.json();
        console.log("Join queue success:", data);
        return data;
      } catch (error) {
        console.error("Join queue exception:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Join queue mutation success:", data);
      
      // Show success toast
      toast({
        title: "Success!",
        description: "You have been added to queue. Redirecting to waiting area...",
        variant: "default",
      });
      
      // Refresh queue status and salon data
      queryClient.invalidateQueries({ queryKey: [`/api/user/queue-status?salonId=${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/salons", id] });
      
      // Navigate to waiting area without full reload
      setLocation(`/waiting-area/${id}`);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: error.message || "Failed to join queue",
        variant: "destructive",
      });
    },
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

  const handleJoinQueue = () => {
    console.log("Join Queue button clicked");
    console.log("Salon data:", salon);
    
    // Always use a default service ID since the server only returns service names, not IDs
    console.log("Using default service ID for queue");
    joinQueueMutation.mutate("default-service-id");
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatRating = (rating: number) => {
    return (rating / 10).toFixed(1);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-blush-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blush-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading salon details...</p>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-blush-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <i className="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Salon Not Found</h1>
            <p className="text-gray-600 mb-4">The salon you're looking for doesn't exist.</p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-blush-50">
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
            <h1 className="font-serif text-lg font-semibold text-gray-800">Salon Profile</h1>
            <button className="text-gray-600 hover:text-blush-500 transition-colors">
              <i className="fas fa-share-alt text-lg"></i>
            </button>
          </div>
        </div>
      </nav>

      {/* Salon Hero */}
      <section className="relative">
        <img 
          src={salon.imageUrl} 
          alt={`${salon.name} interior`}
          className="w-full h-64 object-cover"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl font-bold text-white mb-1" data-testid="text-salon-name">
                {salon.name}
              </h2>
              <div className="flex items-center space-x-4 text-white/90">
                <div className="flex items-center space-x-1">
                  <i className="fas fa-star text-yellow-400"></i>
                  <span data-testid="text-rating">{formatRating(salon.rating)}</span>
                  <span className="text-sm">({salon.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <i className="fas fa-map-marker-alt"></i>
                  <span data-testid="text-location">{salon.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Queue Status Card */}
      {queueStatus && (
        <section className="px-4 py-6">
          <div className="bg-gradient-to-r from-blush-500 to-pink-500 rounded-2xl p-6 text-white mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Current Queue Status</h3>
                <p className="text-white/90">
                  {queueStatus.position - 1 > 0 
                    ? `${queueStatus.position - 1} people ahead of you`
                    : "You're next!"
                  }
                </p>
                <p className="text-sm text-white/75">
                  Estimated wait: {(queueStatus.position - 1) * 15}-{(queueStatus.position - 1) * 20} mins
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">#{queueStatus.position}</div>
                <p className="text-sm text-white/75">Your position</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Services & Pricing */}
      <section className="px-4 pb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Services & Pricing</h3>
        
        <div className="space-y-3">
          {salon.services.map((service) => (
            <Card key={service.id} className="border-gray-100" data-testid={`card-service-${service.id}`}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-gray-800">{service.name}</h4>
                    <p className="text-sm text-gray-600">{service.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{service.duration} mins</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blush-600">{formatPrice(service.price)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Current Offers */}
      <section className="px-4 pb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Current Offers</h3>
        
        {salon?.offers?.length > 0 ? (
          <div className="space-y-4">
            {salon?.offers?.map((offer) => (
              <Card key={offer.id} className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 mb-4 transform transition-all hover:scale-[1.02]">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-amber-100 rounded-full p-3 flex-shrink-0">
                      <i className="fas fa-percentage text-amber-600 text-lg"></i>
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-semibold text-amber-800 text-lg">
                        {offer.title} 
                      </h4>
                      {offer.discount ? (
                        <div className="mt-1 inline-block bg-amber-600 text-white font-bold px-3 py-1 rounded-full text-sm">
                          {offer.discount}% OFF
                        </div>
                      ) : null}
                      {offer.description && (
                        <p className="text-sm text-amber-700 mt-2">{offer.description}</p>
                      )}
                      {offer.validUntil && (
                        <p className="text-xs text-amber-600 mt-2 flex items-center">
                          <i className="fas fa-clock mr-1"></i>
                          Valid until {new Date(offer.validUntil).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-gray-200 text-center p-6">
            <div className="text-gray-400 mb-3">
              <i className="fas fa-percentage text-3xl"></i>
            </div>
            <p className="text-gray-600">No current offers available</p>
          </Card>
        )}
      </section>

      {/* About Section */}
      <section className="px-4 pb-20">
        <h3 className="text-xl font-bold text-gray-800 mb-4">About</h3>
        
        <Card className="border-gray-100 mb-4">
          <CardContent className="p-4">
            <p className="text-gray-600 leading-relaxed">{salon.description}</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="border-gray-100 text-center">
            <CardContent className="p-4">
              <i className="fas fa-clock text-blush-500 text-2xl mb-2"></i>
              <h4 className="font-semibold text-gray-800 text-sm">Operating Hours</h4>
              <p className="text-xs text-gray-600">{salon.operatingHours}</p>
            </CardContent>
          </Card>
          <Card className="border-gray-100 text-center">
            <CardContent className="p-4">
              <i className="fas fa-phone text-blush-500 text-2xl mb-2"></i>
              <h4 className="font-semibold text-gray-800 text-sm">Contact</h4>
              <p className="text-xs text-gray-600">{salon.phone}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Join Queue Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-blush-100">
        <Button 
          className="w-full bg-gradient-to-r from-blush-500 to-pink-500 text-white font-semibold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
          onClick={() => {
            console.log("Join Queue button clicked directly");
            handleJoinQueue();
          }}
          disabled={joinQueueMutation.isPending || !!queueStatus}
          data-testid="button-join-queue"
        >
          {joinQueueMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Joining Queue...
            </>
          ) : queueStatus ? (
            <>
              <i className="fas fa-check-circle mr-2"></i>
              In Queue (Position #{queueStatus?.position || '?'})
            </>
          ) : (
            <>
              <i className="fas fa-plus-circle mr-2"></i>
              Join Queue
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
