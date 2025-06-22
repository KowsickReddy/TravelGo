import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import BookingForm from "@/components/booking/booking-form";
import { Service } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Clock, Users, Wifi, Car, Utensils } from "lucide-react";

export default function Booking() {
  const [, params] = useRoute("/booking/:id");
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const serviceId = params?.id ? parseInt(params.id) : null;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "You need to be logged in to make a booking.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: service, isLoading, error } = useQuery<Service>({
    queryKey: [`/api/services/${serviceId}`],
    enabled: !!serviceId && isAuthenticated,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) return false;
      return failureCount < 3;
    },
  });

  const { data: availability } = useQuery<{ available: boolean; count: number }>({
    queryKey: [`/api/services/${serviceId}/availability`],
    enabled: !!serviceId && isAuthenticated,
    refetchInterval: 30000, // Check every 30 seconds
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!serviceId) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Invalid Service</h1>
            <p className="text-muted-foreground">The service you're trying to book could not be found.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-64 bg-muted rounded"></div>
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Service Not Found</h1>
            <p className="text-muted-foreground">
              The service you're trying to book could not be found or is no longer available.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const renderAmenityIcon = (amenity: string) => {
    const lower = amenity.toLowerCase();
    if (lower.includes("wifi")) return <Wifi className="w-4 h-4" />;
    if (lower.includes("parking") || lower.includes("car")) return <Car className="w-4 h-4" />;
    if (lower.includes("restaurant") || lower.includes("breakfast") || lower.includes("food")) return <Utensils className="w-4 h-4" />;
    return <div className="w-4 h-4 rounded-full bg-primary" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{service.name}</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{service.location}</span>
            </div>
            {service.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium text-foreground">{service.rating}</span>
                <span>({service.totalReviews} reviews)</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Service Details */}
          <div className="space-y-6">
            {/* Main Image */}
            <div className="aspect-video rounded-lg overflow-hidden">
              <img 
                src={(service.images as string[])?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945"} 
                alt={service.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Description */}
            {service.description && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3">About this {service.type}</h3>
                  <p className="text-muted-foreground mb-4">{service.description}</p>
                  
                  {/* Service-specific details */}
                  {service.type === "hotel" && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
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
                  
                  {service.type === "bus" && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
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
                </CardContent>
              </Card>
            )}

            {/* Amenities */}
            {service.amenities && Array.isArray(service.amenities) && service.amenities.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3">Amenities</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {service.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        {renderAmenityIcon(amenity)}
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Booking Form */}
          <div className="lg:sticky lg:top-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-2xl font-bold">₹{new Intl.NumberFormat('en-IN').format(Number(service.price))}</span>
                    <span className="text-muted-foreground ml-1">
                      /{service.type === "hotel" ? "night" : "person"}
                    </span>
                  </div>
                  <div className="text-right">
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
