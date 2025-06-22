import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Service } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Wifi, Car, Utensils, X } from "lucide-react";
import BookingForm from "@/components/booking/booking-form";

interface ServiceDetailModalProps {
  serviceId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ServiceDetailModal({
  serviceId,
  isOpen,
  onClose,
}: ServiceDetailModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const { data: service, isLoading } = useQuery<Service>({
    queryKey: [`/api/services/${serviceId}`],
    enabled: !!serviceId && isOpen,
  });

  const { data: availability } = useQuery<{ available: boolean; count: number }>({
    queryKey: [`/api/services/${serviceId}/availability`],
    enabled: !!serviceId && isOpen,
    refetchInterval: 30000,
  });

  const renderStars = (rating: string | null) => {
    if (!rating) return null;
    
    const numRating = parseFloat(rating);
    const fullStars = Math.floor(numRating);
    
    return (
      <div className="flex items-center gap-1 mb-2">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < fullStars
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">
          {service?.rating} ({service?.totalReviews} reviews)
        </span>
      </div>
    );
  };

  const renderAmenityIcon = (amenity: string) => {
    const lower = amenity.toLowerCase();
    if (lower.includes("wifi")) return <Wifi className="w-4 h-4" />;
    if (lower.includes("parking") || lower.includes("car")) return <Car className="w-4 h-4" />;
    if (lower.includes("restaurant") || lower.includes("breakfast") || lower.includes("food")) return <Utensils className="w-4 h-4" />;
    return <div className="w-4 h-4 rounded-full bg-primary" />;
  };

  if (!service && !isLoading) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>{service?.name}</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-64 bg-muted rounded-lg animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
          </div>
        ) : service ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Service Images */}
            <div>
              <div className="mb-4">
                <img
                  src={(service.images as string[])?.[selectedImageIndex] || "https://images.unsplash.com/photo-1566073771259-6a8506099945"}
                  alt={service.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
              {Array.isArray(service.images) && service.images.length > 1 && (
                <div className="grid grid-cols-3 gap-2">
                  {service.images.slice(0, 3).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${service.name} ${index + 1}`}
                      className="h-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Service Details & Booking */}
            <div>
              <div className="mb-6">
                {renderStars(service.rating)}
                <div className="flex items-center gap-1 text-muted-foreground mb-4">
                  <MapPin className="w-4 h-4" />
                  <span>{service.location}</span>
                </div>
                <p className="text-muted-foreground mb-4">{service.description}</p>
                
                {/* Service-specific details */}
                {service.type === "hotel" && (
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="font-medium">Check-in:</span>
                      <span className="ml-2">{service.checkInTime}</span>
                    </div>
                    <div>
                      <span className="font-medium">Check-out:</span>
                      <span className="ml-2">{service.checkOutTime}</span>
                    </div>
                  </div>
                )}
                
                {service.type === "bus" && service.departureTime && (
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="font-medium">Departure:</span>
                      <span className="ml-2">{service.departureTime}</span>
                    </div>
                    <div>
                      <span className="font-medium">Arrival:</span>
                      <span className="ml-2">{service.arrivalTime}</span>
                    </div>
                    <div>
                      <span className="font-medium">Route:</span>
                      <span className="ml-2">{service.route}</span>
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span>
                      <span className="ml-2">{service.duration}</span>
                    </div>
                  </div>
                )}
                
                {/* Amenities */}
                {service.amenities && Array.isArray(service.amenities) && (
                  <div className="mb-6">
                    <h4 className="font-semibold mb-3">Amenities</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {service.amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center gap-2">
                          {renderAmenityIcon(amenity)}
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Booking Section */}
              <div className="bg-muted/50 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-2xl font-bold">${service.price}</span>
                    <span className="text-muted-foreground ml-1">
                      /{service.type === "hotel" ? "night" : "person"}
                    </span>
                  </div>
                  <div>
                    {availability ? (
                      <Badge variant={availability.available ? "default" : "destructive"}>
                        {availability.available 
                          ? `${availability.count} available` 
                          : "Not available"
                        }
                      </Badge>
                    ) : (
                      <Badge variant="outline">Checking availability...</Badge>
                    )}
                  </div>
                </div>
                
                <BookingForm service={service} />
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
