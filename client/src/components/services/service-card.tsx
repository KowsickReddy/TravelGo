import { useLocation } from "wouter";
import { Service } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Clock, Users } from "lucide-react";

interface ServiceCardProps {
  service: Service;
  layout?: "vertical" | "horizontal";
}

export default function ServiceCard({ service, layout = "vertical" }: ServiceCardProps) {
  const [, setLocation] = useLocation();

  const handleViewDetails = () => {
    setLocation(`/booking/${service.id}`);
  };

  const renderStars = (rating: string | null) => {
    if (!rating) return null;
    
    const numRating = parseFloat(rating);
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 >= 0.5;
    
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < fullStars
                ? "fill-yellow-400 text-yellow-400"
                : i === fullStars && hasHalfStar
                ? "fill-yellow-400/50 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">
          ({service.totalReviews})
        </span>
      </div>
    );
  };

  const renderAmenities = () => {
    if (!service.amenities || !Array.isArray(service.amenities)) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mb-4">
        {service.amenities.slice(0, 3).map((amenity, index) => (
          <Badge key={index} variant="secondary" className="text-xs">
            {amenity}
          </Badge>
        ))}
        {service.amenities.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{service.amenities.length - 3} more
          </Badge>
        )}
      </div>
    );
  };

  if (layout === "horizontal") {
    return (
      <Card className="hover:shadow-lg transition-shadow overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3">
            <img
              src={(service.images as string[])?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945"}
              alt={service.name}
              className="w-full h-48 md:h-full object-cover"
            />
          </div>
          <CardContent className="md:w-2/3 p-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-semibold">{service.name}</h3>
              <div className="text-right">
                {service.rating && renderStars(service.rating)}
                <div className="mt-1">
                  <span className="text-2xl font-bold">${service.price}</span>
                  <span className="text-muted-foreground ml-1">
                    /{service.type === "hotel" ? "night" : "person"}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1 text-muted-foreground mb-3">
              <MapPin className="w-4 h-4" />
              <span>{service.location}</span>
            </div>
            
            <p className="text-muted-foreground mb-4 line-clamp-2">
              {service.description}
            </p>
            
            {/* Service-specific details */}
            {service.type === "bus" && (
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Departure:</span>
                  <span className="font-medium ml-1">{service.departureTime}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium ml-1">{service.duration}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Route:</span>
                  <span className="font-medium ml-1">{service.route}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Available:</span>
                  <span className="font-medium ml-1 text-green-600">{service.availability}</span>
                </div>
              </div>
            )}
            
            {renderAmenities()}
            
            <div className="flex justify-between items-center">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Free cancellation
              </Badge>
              <Button onClick={handleViewDetails}>
                View Details
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow overflow-hidden">
      <div className="aspect-video overflow-hidden">
        <img
          src={(service.images as string[])?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945"}
          alt={service.name}
          className="w-full h-full object-cover"
        />
      </div>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold">{service.name}</h3>
          {service.rating && renderStars(service.rating)}
        </div>
        
        <div className="flex items-center gap-1 text-muted-foreground mb-3">
          <MapPin className="w-4 h-4" />
          <span>{service.location}</span>
        </div>
        
        <p className="text-muted-foreground mb-4 line-clamp-2">
          {service.description}
        </p>
        
        {renderAmenities()}
        
        <div className="flex justify-between items-center">
          <div>
            <span className="text-2xl font-bold">${service.price}</span>
            <span className="text-muted-foreground ml-1">
              /{service.type === "hotel" ? "night" : "person"}
            </span>
          </div>
          <Button onClick={handleViewDetails}>
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
