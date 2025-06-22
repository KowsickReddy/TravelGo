import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { MapPin, Calendar, Users, Search } from "lucide-react";
import { SearchServicesParams } from "@shared/schema";

const searchSchema = z.object({
  destination: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  guests: z.string().optional(),
});

type SearchFormData = z.infer<typeof searchSchema>;

interface SearchFormProps {
  onSearch?: (params: SearchServicesParams) => void;
}

export default function SearchForm({ onSearch }: SearchFormProps) {
  const [, setLocation] = useLocation();
  
  const form = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      destination: "",
      checkIn: "",
      checkOut: "",
      guests: "1",
    },
  });

  const handleSubmit = (data: SearchFormData) => {
    const searchParams: SearchServicesParams = {
      destination: data.destination || undefined,
      checkIn: data.checkIn || undefined,
      checkOut: data.checkOut || undefined,
      guests: data.guests ? parseInt(data.guests) : undefined,
    };

    if (onSearch) {
      onSearch(searchParams);
    } else {
      // Navigate to search page with params
      const params = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });
      setLocation(`/search?${params.toString()}`);
    }
  };

  return (
    <div className="bg-background rounded-2xl shadow-2xl p-6 lg:p-8 max-w-5xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="flex flex-wrap lg:flex-nowrap gap-4 items-end">
            {/* Destination */}
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem className="flex-1 min-w-0">
                  <FormLabel className="text-sm font-medium text-foreground">
                    Where are you going?
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        {...field}
                        placeholder="Enter destination"
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Check-in Date */}
            <FormField
              control={form.control}
              name="checkIn"
              render={({ field }) => (
                <FormItem className="flex-1 min-w-0">
                  <FormLabel className="text-sm font-medium text-foreground">
                    Check-in / Departure
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type="date"
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Check-out Date */}
            <FormField
              control={form.control}
              name="checkOut"
              render={({ field }) => (
                <FormItem className="flex-1 min-w-0">
                  <FormLabel className="text-sm font-medium text-foreground">
                    Check-out / Return
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type="date"
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Guests */}
            <FormField
              control={form.control}
              name="guests"
              render={({ field }) => (
                <FormItem className="flex-1 min-w-0">
                  <FormLabel className="text-sm font-medium text-foreground">
                    Guests
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Select guests" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Guest</SelectItem>
                          <SelectItem value="2">2 Guests</SelectItem>
                          <SelectItem value="3">3 Guests</SelectItem>
                          <SelectItem value="4">4+ Guests</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Search Button */}
            <div className="lg:ml-4">
              <Button 
                type="submit" 
                size="lg"
                className="w-full lg:w-auto px-8 py-3 flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                Search
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
