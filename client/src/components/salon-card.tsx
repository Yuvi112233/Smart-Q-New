import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";

interface Salon {
  id: string;
  name: string;
  location: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  services: string[];
  currentOffer: string | null;
  currentOfferDiscount?: number;
  queueCount: number;
}

interface SalonCardProps {
  salon: Salon;
  className?: string;
}

export default function SalonCard({ salon, className = "" }: SalonCardProps) {
  const [, navigate] = useLocation();

  const formatRating = (rating: number) => {
    return (rating / 10).toFixed(1);
  };

  const getQueueStatus = (count: number) => {
    if (count === 0) {
      return { text: "No queue", color: "bg-green-400" };
    } else if (count <= 3) {
      return { text: `${count} in queue`, color: "bg-green-400" };
    } else if (count <= 6) {
      return { text: `${count} in queue`, color: "bg-yellow-400" };
    } else {
      return { text: `${count} in queue`, color: "bg-red-400" };
    }
  };

  const queueStatus = getQueueStatus(salon.queueCount);

  const handleCardClick = () => {
    navigate(`/salon/${salon.id}`);
  };

  return (
    <Card 
      className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer ${className}`}
      onClick={handleCardClick}
      data-testid={`card-salon-${salon.id}`}
    >
      <img 
        src={salon.imageUrl} 
        alt={`${salon.name} interior`}
        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
      />
      
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h4 className="font-serif text-xl font-semibold text-gray-800" data-testid="text-salon-name">
            {salon.name}
          </h4>
          <div className="flex items-center space-x-1">
            <i className="fas fa-star text-yellow-400 text-sm"></i>
            <span className="text-sm font-medium text-gray-600" data-testid="text-rating">
              {formatRating(salon.rating)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center text-gray-500 text-sm mb-3">
          <i className="fas fa-map-marker-alt mr-2"></i>
          <span data-testid="text-location">{salon.location}</span>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {salon.services.slice(0, 3).map((service, index) => (
            <span 
              key={index}
              className="px-3 py-1 bg-blush-100 text-blush-600 text-xs font-medium rounded-full"
              data-testid={`text-service-${index}`}
            >
              {service}
            </span>
          ))}
          {salon.services.length > 3 && (
            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
              +{salon.services.length - 3} more
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 ${queueStatus.color} rounded-full`}></div>
            <span className="text-sm text-gray-600" data-testid="text-queue-status">
              {queueStatus.text}
            </span>
          </div>
          {salon.currentOffer && (
            <span className="text-sm font-medium text-blush-600" data-testid="text-offer">
              {salon.currentOffer}
              {salon.currentOfferDiscount && (
                <span className="ml-1 bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md text-xs font-bold">
                  {salon.currentOfferDiscount}% off
                </span>
              )}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
