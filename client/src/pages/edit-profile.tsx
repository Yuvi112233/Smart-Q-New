import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

interface SalonData {
  name: string;
  description: string | null;
  location: string;
  phone: string | null;
  imageUrl: string | null;
  operatingHours: string | null;
}

export default function EditProfile() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<SalonData>({
    name: "",
    description: "",
    location: "",
    phone: "",
    imageUrl: "",
    operatingHours: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch salon data
  const { data: salon, isLoading } = useQuery({
    queryKey: [`/api/salons/${id}`],
    enabled: !!id,
    onSuccess: (data) => {
      setFormData({
        name: data.name || "",
        description: data.description || "",
        location: data.location || "",
        phone: data.phone || "",
        imageUrl: data.imageUrl || "",
        operatingHours: data.operatingHours || ""
      });
    }
  });

  // Update salon mutation
  const updateSalon = useMutation({
    mutationFn: async (data: SalonData) => {
      return apiRequest("PUT", `/api/salons/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Salon profile updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-salons"] });
      setLocation(`/salon-dashboard`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update salon profile",
        variant: "destructive",
      });
      console.error("Update error:", error);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await updateSalon.mutateAsync(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setLocation(`/salon-dashboard`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-blush-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blush-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading salon information...</p>
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
              <h1 className="font-serif text-lg font-semibold text-gray-800">Edit Salon Profile</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Salon Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    data-testid="input-salon-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ""}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={4}
                    data-testid="input-description"
                  />
                </div>
                
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    required
                    data-testid="input-location"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    data-testid="input-phone"
                  />
                </div>
                
                <div>
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl || ""}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    placeholder="https://example.com/image.jpg"
                    data-testid="input-image-url"
                  />
                </div>
                
                <div>
                  <Label htmlFor="operatingHours">Operating Hours</Label>
                  <Input
                    id="operatingHours"
                    value={formData.operatingHours || ""}
                    onChange={(e) => setFormData({...formData, operatingHours: e.target.value})}
                    placeholder="Mon-Fri: 9am-7pm, Sat: 10am-5pm, Sun: Closed"
                    data-testid="input-operating-hours"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit"
                  className="flex-1 bg-blush-500 hover:bg-blush-600"
                  disabled={isSubmitting}
                  data-testid="button-save"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}