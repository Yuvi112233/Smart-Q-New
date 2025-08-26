import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect, useState } from "react";

interface QueueEntry {
  id: string;
  userId: string;
  userName: string;
  serviceName: string;
  status: string;
  position: number;
  joinedAt: string;
}

interface QueueStats {
  waiting: number;
  completed: number;
  noShow: number;
}

export default function QueueManagement() {
  const { salonId } = useParams<{ salonId: string }>();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [lastNotification, setLastNotification] = useState<string | null>(null);

  const { data: queue = [], isLoading } = useQuery<QueueEntry[]>({
    queryKey: ["/api/queue", salonId],
    retry: false,
    enabled: !!user && !!salonId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const callCustomerMutation = useMutation({
    mutationFn: async (queueId: string) => {
      return await apiRequest("POST", `/api/queue/${queueId}/call`, {});
    },
    onSuccess: (data: any) => {
      if (data.notification) {
        setLastNotification(data.notification.message);
        toast({
          title: "Customer Notified!",
          description: data.notification.message,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/queue", salonId] });
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
        description: error.message || "Failed to call customer",
        variant: "destructive",
      });
    },
  });

  const completeServiceMutation = useMutation({
    mutationFn: async (queueId: string) => {
      return await apiRequest("POST", `/api/queue/${queueId}/complete`, {});
    },
    onSuccess: () => {
      toast({
        title: "Service Completed!",
        description: "Customer has been marked as completed and loyalty points awarded.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/queue", salonId] });
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
        description: error.message || "Failed to complete service",
        variant: "destructive",
      });
    },
  });

  const markNoShowMutation = useMutation({
    mutationFn: async (queueId: string) => {
      return await apiRequest("POST", `/api/queue/${queueId}/no-show`, {});
    },
    onSuccess: () => {
      toast({
        title: "Marked as No-Show",
        description: "Customer has been marked as no-show.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/queue", salonId] });
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
        description: error.message || "Failed to mark no-show",
        variant: "destructive",
      });
    },
  });

  const removeFromQueueMutation = useMutation({
    mutationFn: async (queueId: string) => {
      return await apiRequest("DELETE", `/api/queue/${queueId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Removed from Queue",
        description: "Customer has been removed from the queue.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/queue", salonId] });
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
        description: error.message || "Failed to remove from queue",
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

  const waitingQueue = queue.filter(entry => entry.status === "waiting");
  const inProgressQueue = queue.filter(entry => entry.status === "in-progress");
  const currentCustomer = inProgressQueue[0];
  const nextCustomer = waitingQueue[0];

  const queueStats: QueueStats = {
    waiting: queue.filter(entry => entry.status === "waiting").length,
    completed: queue.filter(entry => entry.status === "completed").length,
    noShow: queue.filter(entry => entry.status === "no-show").length,
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  const handleCallNextCustomer = () => {
    if (nextCustomer) {
      callCustomerMutation.mutate(nextCustomer.id);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-blush-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blush-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-blush-50 pb-24">
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
            <h1 className="font-serif text-lg font-semibold text-gray-800">Queue Management</h1>
            <button className="text-gray-600 hover:text-blush-500 transition-colors">
              <i className="fas fa-refresh text-lg"></i>
            </button>
          </div>
        </div>
      </nav>

      {/* Last Notification Display */}
      {lastNotification && (
        <div className="px-4 py-2 bg-green-50 border-b border-green-200">
          <div className="flex items-center space-x-2 text-green-800">
            <i className="fas fa-check-circle"></i>
            <span className="text-sm font-medium">Last notification: {lastNotification}</span>
          </div>
        </div>
      )}

      {/* Queue Stats */}
      <section className="px-4 py-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600" data-testid="text-waiting-count">
                {queueStats.waiting}
              </div>
              <p className="text-sm text-blue-700">Waiting</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600" data-testid="text-completed-count">
                {queueStats.completed}
              </div>
              <p className="text-sm text-green-700">Completed</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600" data-testid="text-noshow-count">
                {queueStats.noShow}
              </div>
              <p className="text-sm text-red-700">No Show</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Current Customer */}
      <section className="px-4 pb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Now Serving</h3>
        
        {currentCustomer ? (
          <div className="bg-gradient-to-r from-blush-500 to-pink-500 rounded-2xl p-6 text-white mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-user text-xl"></i>
                </div>
                <div>
                  <h4 className="text-xl font-semibold" data-testid="text-current-customer">
                    {currentCustomer.userName}
                  </h4>
                  <p className="text-white/90">{currentCustomer.serviceName}</p>
                  <p className="text-white/75 text-sm">
                    Started: {formatTime(currentCustomer.joinedAt)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">#1</div>
                <p className="text-white/75 text-sm">Position</p>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-4">
              <Button 
                onClick={() => completeServiceMutation.mutate(currentCustomer.id)}
                disabled={completeServiceMutation.isPending}
                className="flex-1 bg-white/20 backdrop-blur text-white border border-white/30 hover:bg-white/30 transition-all"
                data-testid="button-mark-complete"
              >
                <i className="fas fa-check mr-2"></i>Mark Complete
              </Button>
              <Button 
                onClick={() => markNoShowMutation.mutate(currentCustomer.id)}
                disabled={markNoShowMutation.isPending}
                className="flex-1 bg-white/20 backdrop-blur text-white border border-white/30 hover:bg-white/30 transition-all"
                data-testid="button-mark-noshow"
              >
                <i className="fas fa-times mr-2"></i>No Show
              </Button>
            </div>
          </div>
        ) : (
          <Card className="border-gray-200">
            <CardContent className="p-6 text-center">
              <i className="fas fa-user-slash text-gray-300 text-4xl mb-4"></i>
              <h4 className="text-lg font-semibold text-gray-600 mb-2">No customer being served</h4>
              <p className="text-gray-500">Call the next customer to get started</p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Queue List */}
      <section className="px-4 pb-20">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Waiting Queue</h3>
        
        {waitingQueue.length === 0 ? (
          <Card className="border-gray-200">
            <CardContent className="p-6 text-center">
              <i className="fas fa-list text-gray-300 text-4xl mb-4"></i>
              <h4 className="text-lg font-semibold text-gray-600 mb-2">Queue is empty</h4>
              <p className="text-gray-500">Customers will appear here when they join the queue</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {waitingQueue.map((customer, index) => (
              <Card key={customer.id} className="border-gray-100" data-testid={`card-customer-${customer.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blush-100 rounded-full flex items-center justify-center">
                        <span className="font-bold text-blush-600">#{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800" data-testid="text-customer-name">
                          {customer.userName}
                        </h4>
                        <p className="text-sm text-gray-600" data-testid="text-service-name">
                          {customer.serviceName}
                        </p>
                        <p className="text-xs text-gray-500">
                          Joined: {formatTime(customer.joinedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => callCustomerMutation.mutate(customer.id)}
                        disabled={callCustomerMutation.isPending}
                        className="bg-blush-500 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-blush-600 transition-colors"
                        data-testid={`button-call-${customer.id}`}
                      >
                        <i className="fas fa-phone mr-1"></i>Call
                      </Button>
                      <Button 
                        onClick={() => removeFromQueueMutation.mutate(customer.id)}
                        disabled={removeFromQueueMutation.isPending}
                        className="bg-gray-500 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                        data-testid={`button-remove-${customer.id}`}
                      >
                        <i className="fas fa-times"></i>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Call Next Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-blush-100">
        <Button 
          onClick={handleCallNextCustomer}
          disabled={!nextCustomer || callCustomerMutation.isPending || !!currentCustomer}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          data-testid="button-call-next"
        >
          {callCustomerMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Calling Customer...
            </>
          ) : !nextCustomer ? (
            <>
              <i className="fas fa-user-slash mr-2"></i>
              No Customers in Queue
            </>
          ) : currentCustomer ? (
            <>
              <i className="fas fa-clock mr-2"></i>
              Finish Current Customer First
            </>
          ) : (
            <>
              <i className="fas fa-bell mr-2"></i>
              Call Next Customer
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
