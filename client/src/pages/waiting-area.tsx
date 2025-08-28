import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

interface QueueStatus {
  id: string;
  position: number;
  status: string;
  createdAt: string;
  salonId: string;
  serviceId: string;
}

interface SalonDetails {
  id: string;
  name: string;
  services: Array<{
    id: string;
    name: string;
    duration: number;
  }>;
}

export default function WaitingArea() {
  const { salonId } = useParams<{ salonId: string }>();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  // Extract queueId from query params
  const query = new URLSearchParams(location.split("?")[1]);
  const queueId = query.get("queueId");

  useEffect(() => {
    console.log("WaitingArea user:", user, "authLoading:", authLoading, "queueId:", queueId);
  }, [user, authLoading, queueId]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Redirecting to login...",
        variant: "destructive",
      });
      setLocation("/login");
    }
  }, [user, authLoading, toast, setLocation]);

  // Fetch queue status
  const { data: queueStatus, isLoading: queueLoading } = useQuery<QueueStatus>({
    queryKey: ["queue-status", queueId],
    enabled: !!queueId,
    retry: false,
    queryFn: () => apiRequest(`/api/user/queue-status/${queueId}`),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch salon details
  const { data: salon, isLoading: salonLoading } = useQuery<SalonDetails>({
    queryKey: ["/api/salons", salonId],
    enabled: !!salonId,
    retry: false,
    queryFn: () => apiRequest(`/api/salons/${salonId}`),
  });

  // Redirect if user is not in queue
  useEffect(() => {
    if (!queueLoading && !queueStatus && queueId) {
      toast({
        title: "Not in queue",
        description: "You are not currently in the queue for this salon.",
        variant: "destructive",
      });
      setTimeout(() => setLocation(`/salon/${salonId}`), 1000);
    }
  }, [queueLoading, queueStatus, queueId, salonId, toast, setLocation]);

  // Calculate estimated wait time
  const estimatedWaitTime = () => {
    if (!queueStatus || !salon?.services) return "Unknown";

    const service = salon.services.find(s => s.id === queueStatus.serviceId);
    const avgDuration = service?.duration || 15;
    const waitMinutes = (queueStatus.position - 1) * avgDuration;

    if (waitMinutes <= 0) return "You're next!";
    if (waitMinutes < 60) return `${waitMinutes} minutes`;

    const hours = Math.floor(waitMinutes / 60);
    const minutes = waitMinutes % 60;
    return `${hours} hour${hours > 1 ? "s" : ""} ${minutes > 0 ? `${minutes} minutes` : ""}`;
  };

  if (authLoading || queueLoading || salonLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-blush-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blush-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading queue information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-blush-50 p-6">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg border-blush-100">
          <CardHeader className="bg-gradient-to-r from-blush-500 to-rose-500 text-white">
            <CardTitle className="text-2xl font-bold text-center">You're in the Queue!</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold mb-2">You are in the queue at {salon?.name}</h2>
              <div className="flex flex-col items-center justify-center space-y-4 mt-6">
                <div className="bg-blush-100 rounded-full w-24 h-24 flex items-center justify-center">
                  <span className="text-3xl font-bold text-blush-700">#{queueStatus?.position}</span>
                </div>
                <p className="text-gray-600">Your position in line</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-gray-700 mb-2">Estimated Wait Time</h3>
              <p className="text-2xl font-bold text-blush-600">{estimatedWaitTime()}</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-blue-700 mb-2">What's Next?</h3>
              <p className="text-gray-700">
                We'll notify you when it's your turn via WhatsApp. Feel free to relax nearby!
              </p>
            </div>

            <div className="flex justify-center mt-6">
              <Button variant="outline" onClick={() => setLocation(`/salon/${salonId}`)} className="mr-4">
                Back to Salon
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  toast({
                    title: "Coming Soon",
                    description: "Leave queue functionality will be available soon.",
                    variant: "default",
                  });
                }}
              >
                Leave Queue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
