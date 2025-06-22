import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import SearchForm from "@/components/search/search-form";
import ServiceCard from "@/components/services/service-card";
import { Service } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Hotel, Bus, Plane, Briefcase } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services", selectedCategory ? { type: selectedCategory } : {}],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) {
        params.append("type", selectedCategory);
      }
      const response = await fetch(`/api/services?${params}`);
      if (!response.ok) throw new Error("Failed to fetch services");
      return response.json();
    },
  });

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const handleViewAllResults = () => {
    setLocation("/search");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div 
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
          className="absolute inset-0"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">Your Journey Starts Here</h1>
            <p className="text-xl lg:text-2xl mb-12 max-w-3xl mx-auto">
              Book buses, hotels, and more with confidence. Compare prices, read reviews, and travel smart.
            </p>
            
            <SearchForm />
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What are you looking for?</h2>
            <p className="text-muted-foreground text-lg">Choose from our wide range of travel services</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card 
              className={`hover:shadow-lg transition-shadow cursor-pointer ${
                selectedCategory === "hotel" ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => handleCategoryClick("hotel")}
            >
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Hotel className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Hotels</h3>
                <p className="text-muted-foreground">Comfortable stays worldwide</p>
              </CardContent>
            </Card>
            
            <Card 
              className={`hover:shadow-lg transition-shadow cursor-pointer ${
                selectedCategory === "bus" ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => handleCategoryClick("bus")}
            >
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bus className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Buses</h3>
                <p className="text-muted-foreground">Affordable transportation</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow cursor-pointer opacity-60">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plane className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Flights</h3>
                <p className="text-muted-foreground">Coming soon</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow cursor-pointer opacity-60">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Packages</h3>
                <p className="text-muted-foreground">Complete travel deals</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                {selectedCategory 
                  ? `Featured ${selectedCategory === "hotel" ? "Hotels" : "Buses"}` 
                  : "Featured Services"
                }
              </h2>
              <p className="text-muted-foreground">
                {selectedCategory 
                  ? `Best ${selectedCategory === "hotel" ? "hotels" : "bus routes"} for your next trip`
                  : "Popular travel services in your area"
                }
              </p>
            </div>
            <Button variant="outline" onClick={handleViewAllResults}>
              View All Results
            </Button>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-lg p-6 animate-pulse">
                  <div className="h-48 bg-muted rounded-lg mb-4"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services?.slice(0, 6).map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
