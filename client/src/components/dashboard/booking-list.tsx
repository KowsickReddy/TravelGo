import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Booking, Service } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Hotel, Bus, Calendar, MapPin, Clock, Users, X } from "lucide-react";
import { format } from "date-fns";

type BookingWithService = Booking & { service: Service };

export default function BookingList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cancellingBookingId, setCancellingBookingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("upcoming");

  const { data: bookings, isLoading, error } = useQuery<BookingWithService[]>({
    queryKey: ["/api/bookings"],
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) return false;
      return failureCount < 3;
    },
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      await apiRequest("PUT", `/api/bookings/${bookingId}/cancel`);
    },
    onSuccess: () => {
      toast({
        title: "Booking Cancelled",
        description: "Your booking has been successfully cancelled.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      setCancellingBookingId(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-muted rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-48"></div>
                    <div className="h-3 bg-muted rounded w-32"></div>
                    <div className="h-3 bg-muted rounded w-40"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-20"></div>
                  <div className="h-3 bg-muted rounded w-16"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Bookings</h3>
          <p className="text-muted-foreground">
            We're having trouble loading your bookings. Please try refreshing the page.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">No Bookings Found</h3>
          <p className="text-muted-foreground mb-4">
            You haven't made any bookings yet. Start exploring our services!
          </p>
          <Button onClick={() => window.location.href = "/"}>
            Browse Services
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default";
      case "pending":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmed";
      case "pending":
        return "Pending";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const isUpcoming = (booking: BookingWithService) => {
    const bookingDate = new Date(booking.checkInDate || booking.createdAt || new Date());
    const today = new Date();
    return bookingDate >= today && booking.status !== "cancelled";
  };

  const upcomingBookings = bookings.filter(isUpcoming);
  const pastBookings = bookings.filter(booking => !isUpcoming(booking));

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return dateString;
    }
  };

  const renderBookingCard = (booking: BookingWithService) => (
    <Card key={booking.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-4">
            <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
              booking.service.type === "hotel" 
                ? "bg-primary/10" 
                : "bg-green-500/10"
            }`}>
              {booking.service.type === "hotel" ? (
                <Hotel className={`w-6 h-6 ${
                  booking.service.type === "hotel" ? "text-primary" : "text-green-500"
                }`} />
              ) : (
                <Bus className="w-6 h-6 text-green-500" />
              )}
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-1">{booking.service.name}</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{booking.service.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {formatDate(booking.checkInDate || "")}
                    {booking.checkOutDate && booking.checkInDate !== booking.checkOutDate && (
                      <> - {formatDate(booking.checkOutDate)}</>
                    )}
                  </span>
                </div>
                {booking.service.type === "bus" && booking.service.departureTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{booking.service.departureTime}</span>
                    {booking.service.route && <span> • {booking.service.route}</span>}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right space-y-2">
            <Badge variant={getStatusVariant(booking.status)}>
              {getStatusLabel(booking.status)}
            </Badge>
            <p className="font-semibold text-lg">${booking.totalPrice}</p>
            <div className="flex space-x-2">
              {booking.status === "confirmed" && isUpcoming(booking) && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCancellingBookingId(booking.id)}
                  disabled={cancelBookingMutation.isPending}
                >
                  Cancel
                </Button>
              )}
              <Button variant="ghost" size="sm">
                Details
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>My Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upcoming">
                Upcoming ({upcomingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past ({pastBookings.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming" className="mt-6">
              <div className="space-y-4">
                {upcomingBookings.length > 0 ? (
                  upcomingBookings.map(renderBookingCard)
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Upcoming Bookings</h3>
                    <p className="text-muted-foreground">
                      You don't have any upcoming trips planned.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="past" className="mt-6">
              <div className="space-y-4">
                {pastBookings.length > 0 ? (
                  pastBookings.map(renderBookingCard)
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Past Bookings</h3>
                    <p className="text-muted-foreground">
                      Your booking history will appear here.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog 
        open={cancellingBookingId !== null} 
        onOpenChange={() => setCancellingBookingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
              You may be eligible for a refund based on the cancellation policy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (cancellingBookingId) {
                  cancelBookingMutation.mutate(cancellingBookingId);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={cancelBookingMutation.isPending}
            >
              {cancelBookingMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Cancelling...
                </div>
              ) : (
                "Cancel Booking"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
