import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import SearchForm from "@/components/search/search-form";
import SearchFilters from "@/components/search/search-filters";
import SearchResults from "@/components/search/search-results";
import { Service, SearchServicesParams } from "@shared/schema";

export default function Search() {
  const [searchParams, setSearchParams] = useState<SearchServicesParams>({});
  const [sortBy, setSortBy] = useState<string>("rating");

  const { data: services, isLoading, error } = useQuery<Service[]>({
    queryKey: ["/api/services", searchParams],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, value.toString());
          }
        }
      });
      
      const response = await fetch(`/api/services?${params}`);
      if (!response.ok) throw new Error("Failed to fetch services");
      return response.json();
    },
  });

  const handleSearchChange = (params: SearchServicesParams) => {
    setSearchParams(params);
  };

  const handleFilterChange = (filters: Partial<SearchServicesParams>) => {
    setSearchParams(prev => ({ ...prev, ...filters }));
  };

  const sortedServices = services ? [...services].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return parseFloat(a.price) - parseFloat(b.price);
      case "price-high":
        return parseFloat(b.price) - parseFloat(a.price);
      case "rating":
        return parseFloat(b.rating || "0") - parseFloat(a.rating || "0");
      default:
        return 0;
    }
  }) : [];

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Error Loading Services</h1>
            <p className="text-muted-foreground">
              We're having trouble loading the search results. Please try again.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Search Header */}
      <section className="bg-muted/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SearchForm onSearch={handleSearchChange} />
        </div>
      </section>

      {/* Search Results */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className="lg:w-1/4">
              <SearchFilters onFilterChange={handleFilterChange} />
            </div>
            
            {/* Results */}
            <div className="lg:w-3/4">
              <SearchResults 
                services={sortedServices}
                isLoading={isLoading}
                sortBy={sortBy}
                onSortChange={setSortBy}
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
