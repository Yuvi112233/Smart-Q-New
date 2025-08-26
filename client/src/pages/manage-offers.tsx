import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

interface Offer {
  id: string;
  title: string;
  description: string | null;
  discount: number | null;
  validUntil: string | null;
  isActive: boolean;
}

interface NewOffer {
  title: string;
  description: string | null;
  discount: number | null;
  validUntil: string | null;
  isActive: boolean;
}

export default function ManageOffers() {
  const { salonId } = useParams<{ salonId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOffer, setNewOffer] = useState<NewOffer>({
    title: "",
    description: "",
    discount: 0,
    validUntil: "",
    isActive: true
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch salon offers
  const { data: offers, isLoading, refetch } = useQuery<Offer[]>({
    queryKey: [`/api/salons/${salonId}/offers`],
    enabled: !!salonId,
    refetchOnWindowFocus: true,
    staleTime: 0 // Consider data stale immediately
  });

  // Create offer mutation
  const createOffer = useMutation({
    mutationFn: async (data: NewOffer) => {
      const payload = {
        ...data,
        salonId: salonId
      };
      console.log("Creating offer with payload:", payload);
      return apiRequest("POST", `/api/salons/${salonId}/offers`, payload);
    },
    onSuccess: (data) => {
      console.log("Offer created successfully:", data);
      toast({
        title: "Success",
        description: "Offer created successfully",
      });
      
      // Force refetch all offers
      refetch();
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salonId}/offers`] });
      
      // Update local state with the new offer
      queryClient.setQueryData([`/api/salons/${salonId}/offers`], (oldData: Offer[] | undefined) => {
        if (!oldData) return [data];
        return [data, ...oldData];
      });
      
      setShowAddForm(false);
      setNewOffer({
        title: "",
        description: "",
        discount: 0,
        validUntil: "",
        isActive: true
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create offer",
        variant: "destructive",
      });
      console.error("Create error:", error);
    }
  });

  // Delete offer mutation
  const deleteOffer = useMutation({
    mutationFn: async (offerId: string) => {
      console.log(`Deleting offer with ID: ${offerId}`);
      return apiRequest("DELETE", `/api/salons/${salonId}/offers/${offerId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Offer deleted successfully",
      });
      // Force refetch offers
      refetch();
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salonId}/offers`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete offer",
        variant: "destructive",
      });
      console.error("Delete error:", error);
    }
  });

  // Toggle offer status mutation
  const toggleOfferStatus = useMutation({
    mutationFn: async ({ offerId, isActive }: { offerId: string, isActive: boolean }) => {
      return apiRequest("PATCH", `/api/salons/${salonId}/offers/${offerId}`, { isActive });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Offer status updated",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salonId}/offers`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update offer status",
        variant: "destructive",
      });
      console.error("Update error:", error);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await createOffer.mutateAsync(newOffer);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (confirm("Are you sure you want to delete this offer?")) {
      await deleteOffer.mutateAsync(offerId);
    }
  };

  const handleToggleStatus = async (offerId: string, currentStatus: boolean) => {
    await toggleOfferStatus.mutateAsync({ offerId, isActive: !currentStatus });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No expiration";
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-blush-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blush-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading offers...</p>
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
            <div className="flex items-center space-x-3">
              <button 
                className="text-gray-600 hover:text-blush-500 transition-colors"
                onClick={() => setLocation("/salon-dashboard")}
                data-testid="button-back"
              >
                <i className="fas fa-arrow-left text-lg"></i>
              </button>
              <h1 className="font-serif text-lg font-semibold text-gray-800">Manage Offers</h1>
            </div>
            <Button 
              onClick={() => setShowAddForm(!showAddForm)}
              size="sm"
              className="bg-blush-500 hover:bg-blush-600"
              data-testid="button-add-offer"
            >
              {showAddForm ? "Cancel" : "Add Offer"}
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {showAddForm && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Offer</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Offer Title *</Label>
                  <Input
                    id="title"
                    value={newOffer.title}
                    onChange={(e) => setNewOffer({...newOffer, title: e.target.value})}
                    required
                    data-testid="input-title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newOffer.description || ""}
                    onChange={(e) => setNewOffer({...newOffer, description: e.target.value})}
                    rows={3}
                    data-testid="input-description"
                  />
                </div>
                
                <div>
                  <Label htmlFor="discount">Discount Percentage</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={newOffer.discount || 0}
                    onChange={(e) => setNewOffer({...newOffer, discount: parseInt(e.target.value)})}
                    data-testid="input-discount"
                  />
                </div>
                
                <div>
                  <Label htmlFor="validUntil">Valid Until</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={newOffer.validUntil || ""}
                    onChange={(e) => setNewOffer({...newOffer, validUntil: e.target.value})}
                    data-testid="input-valid-until"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={newOffer.isActive}
                    onCheckedChange={(checked) => setNewOffer({...newOffer, isActive: checked})}
                    data-testid="switch-is-active"
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                
                <Button 
                  type="submit"
                  className="w-full bg-blush-500 hover:bg-blush-600 mt-4"
                  disabled={isSubmitting}
                  data-testid="button-create"
                >
                  {isSubmitting ? "Creating..." : "Create Offer"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <h2 className="text-xl font-bold text-gray-800 mb-4">Current Offers</h2>
        
        {offers && offers.length > 0 ? (
          <div className="space-y-4">
            {offers.map((offer) => (
              <Card key={offer.id} className={`border-l-4 ${offer.isActive ? 'border-l-green-500' : 'border-l-gray-300'}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-800">{offer.title}</h3>
                      <p className="text-sm text-gray-600">{offer.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        {offer.discount && (
                          <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">
                            {offer.discount}% OFF
                          </span>
                        )}
                        <span>Valid until: {formatDate(offer.validUntil)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`active-${offer.id}`}
                          checked={offer.isActive}
                          onCheckedChange={() => handleToggleStatus(offer.id, offer.isActive)}
                          data-testid={`switch-active-${offer.id}`}
                        />
                        <Label htmlFor={`active-${offer.id}`} className="text-sm">
                          {offer.isActive ? "Active" : "Inactive"}
                        </Label>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteOffer(offer.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        data-testid={`button-delete-${offer.id}`}
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-gray-500 mb-4">
                <i className="fas fa-percentage text-4xl opacity-30"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Offers Yet</h3>
              <p className="text-gray-500 mb-4">Create your first offer to attract more customers</p>
              {!showAddForm && (
                <Button 
                  onClick={() => setShowAddForm(true)}
                  className="bg-blush-500 hover:bg-blush-600"
                  data-testid="button-create-first"
                >
                  Create First Offer
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}