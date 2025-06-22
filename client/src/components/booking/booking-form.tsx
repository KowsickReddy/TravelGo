import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Service, CreateBookingParams, User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar, Users, CreditCard } from "lucide-react";
import PaymentModal from "@/components/payment/payment-modal";
import { formatIndianCurrency } from "@/utils/currency";

const bookingSchema = z.object({
  checkInDate: z.string().min(1, "Check-in date is required"),
  checkOutDate: z.string().optional(),
  guests: z.string().min(1, "Number of guests is required"),
}).refine((data) => {
  if (data.checkOutDate && data.checkInDate) {
    return new Date(data.checkOutDate) > new Date(data.checkInDate);
  }
  return true;
}, {
  message: "Check-out date must be after check-in date",
  path: ["checkOutDate"],
});

import { z } from "zod";

const bookingSchema = z.object({
  checkInDate: z.string().min(1, "Check-in date is required"),
  checkOutDate: z.string().min(1, "Check-out date is required"),
  guests: z.number().min(1, "At least 1 guest is required").max(20, "Maximum 20 guests allowed"),
  specialRequests: z.string().optional(),
}).refine((data) => {
  const checkIn = new Date(data.checkInDate);
  const checkOut = new Date(data.checkOutDate);
  return checkOut > checkIn;
}, {
  message: "Check-out date must be after check-in date",
  path: ["checkOutDate"],
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  service: Service;
}

export default function BookingForm({ service }: BookingFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [nights, setNights] = useState(1);
  const { user } = useAuth();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingBookingId, setPendingBookingId] = useState<number | null>(null);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      checkInDate: "",
      checkOutDate: "",
      guests: "1",
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: CreateBookingParams) => {
      const response = await apiRequest("POST", "/api/bookings", bookingData);
      return response.json();
    },
    onSuccess: (result: any) => {
      // Show payment modal instead of success message
      setPendingBookingId(result.id);
      setShowPaymentModal(true);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You need to be logged in to make a booking.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }

      const errorMessage = error.message.includes("Service is no longer available") 
        ? "This service is no longer available. Please try another option."
        : "Failed to create booking. Please try again.";

      toast({
        title: "Booking Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const calculateNights = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return 1;

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays || 1;
  };

  const calculateTotal = () => {
    const basePrice = parseFloat(service.price);
    const guestCount = parseInt(form.watch("guests") || "1");

    if (service.type === "hotel") {
      const calculatedNights = calculateNights(
        form.watch("checkInDate"),
        form.watch("checkOutDate") || ""
      );
      setNights(calculatedNights);
      return basePrice * calculatedNights;
    } else {
      // For buses, price is per person
      return basePrice * guestCount;
    }
  };

  const total = calculateTotal();
  const serviceFee = total * 0.05; // 5% service fee
  const finalTotal = total + serviceFee;

  const onSubmit = (data: BookingFormData) => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to make a booking.",
        variant: "destructive",
      });
      return;
    }

    const bookingData: CreateBookingParams = {
      userId: user.id,
      serviceId: service.id,
      checkInDate: data.checkInDate,
      checkOutDate: service.type === "hotel" ? data.checkOutDate : data.checkInDate,
      guests: parseInt(data.guests),
      totalPrice: finalTotal.toFixed(2),
      status: "confirmed",
      bookingDetails: {
        serviceName: service.name,
        serviceType: service.type,
        location: service.location,
        ...(service.type === "bus" && {
          departureTime: service.departureTime,
          arrivalTime: service.arrivalTime,
          route: service.route,
        }),
        ...(service.type === "hotel" && {
          checkInTime: service.checkInTime,
          checkOutTime: service.checkOutTime,
          nights: nights,
        }),
      },
    };

    createBookingMutation.mutate(bookingData);
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Payment Successful",
      description: "Your booking has been confirmed! Check your email for details.",
    });

    // Reset form
    form.reset();
    setPendingBookingId(null);
    setShowPaymentModal(false);

    // Refresh bookings
    queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
    queryClient.invalidateQueries({ queryKey: [`/api/services/${service.id}/availability`] });
    setLocation("/dashboard");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Booking Details */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="checkInDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {service.type === "hotel" ? "Check-in" : "Travel Date"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {service.type === "hotel" && (
              <FormField
                control={form.control}
                name="checkOutDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Check-out
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        min={form.watch("checkInDate") || new Date().toISOString().split('T')[0]}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <FormField
            control={form.control}
            name="guests"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {service.type === "hotel" ? "Guests" : "Passengers"}
                </FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select number" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 {service.type === "hotel" ? "Guest" : "Passenger"}</SelectItem>
                      <SelectItem value="2">2 {service.type === "hotel" ? "Guests" : "Passengers"}</SelectItem>
                      <SelectItem value="3">3 {service.type === "hotel" ? "Guests" : "Passengers"}</SelectItem>
                      <SelectItem value="4">4 {service.type === "hotel" ? "Guests" : "Passengers"}</SelectItem>
                      <SelectItem value="5">5+ {service.type === "hotel" ? "Guests" : "Passengers"}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Price Breakdown */}
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Price Breakdown
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>
                  ${service.price} × {service.type === "hotel" ? `${nights} night${nights !== 1 ? 's' : ''}` : `${form.watch("guests") || 1} passenger${parseInt(form.watch("guests") || "1") !== 1 ? 's' : ''}`}
                </span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Service fee</span>
                <span>${serviceFee.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>Total</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Information */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Free cancellation up to 24 hours before {service.type === "hotel" ? "check-in" : "departure"}</p>
          <p>• You won't be charged yet - payment will be processed after confirmation</p>
          <p>• All bookings are subject to availability</p>
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full" 
          size="lg"
          disabled={createBookingMutation.isPending || service.availability <= 0}
        >
          {createBookingMutation.isPending ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </div>
          ) : service.availability <= 0 ? (
            "Not Available"
          ) : (
            `Book Now - ${formatIndianCurrency(finalTotal)}`
          )}
        </Button>
      </form>
      {pendingBookingId && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          bookingId={pendingBookingId}
          amount={finalTotal}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </Form>
  );
}