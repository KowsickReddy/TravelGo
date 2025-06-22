import { Service } from "@shared/schema";
import ServiceCard from "@/components/services/service-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SearchResultsProps {
  services: Service[];
  isLoading: boolean;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

export default function SearchResults({ 
  services, 
  isLoading, 
  sortBy, 
  onSortChange 
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-48 animate-pulse"></div>
        </div>
        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-card rounded-xl p-6 animate-pulse">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="md:w-1/3 h-48 bg-muted rounded-lg"></div>
                <div className="md:w-2/3 space-y-4">
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">No services found</h3>
        <p className="text-muted-foreground">
          Try adjusting your search criteria or filters to find more results.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Search Results</h2>
          <p className="text-muted-foreground">
            Showing {services.length} result{services.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">Sort by Rating</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results List */}
      <div className="space-y-6">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} layout="horizontal" />
        ))}
      </div>

      {/* Pagination */}
      {services.length > 0 && (
        <div className="flex justify-center mt-12">
          <nav className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button variant="default" size="sm">
              1
            </Button>
            <Button variant="outline" size="sm" disabled>
              2
            </Button>
            <Button variant="outline" size="sm" disabled>
              3
            </Button>
            <Button variant="outline" size="sm" disabled>
              4
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </nav>
        </div>
      )}
    </div>
  );
}
