import { useState } from "react";
import { SearchServicesParams } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface SearchFiltersProps {
  onFilterChange: (filters: Partial<SearchServicesParams>) => void;
}

export default function SearchFilters({ onFilterChange }: SearchFiltersProps) {
  const [selectedFilters, setSelectedFilters] = useState<Partial<SearchServicesParams>>({});

  const handlePriceChange = (priceRange: string, checked: boolean) => {
    const filters = { ...selectedFilters };
    
    if (checked) {
      switch (priceRange) {
        case "0-50":
          filters.minPrice = 0;
          filters.maxPrice = 50;
          break;
        case "50-100":
          filters.minPrice = 50;
          filters.maxPrice = 100;
          break;
        case "100-200":
          filters.minPrice = 100;
          filters.maxPrice = 200;
          break;
        case "200+":
          filters.minPrice = 200;
          delete filters.maxPrice;
          break;
      }
    } else {
      delete filters.minPrice;
      delete filters.maxPrice;
    }
    
    setSelectedFilters(filters);
    onFilterChange(filters);
  };

  const handleRatingChange = (rating: number, checked: boolean) => {
    const filters = { ...selectedFilters };
    
    if (checked) {
      filters.rating = rating;
    } else {
      delete filters.rating;
    }
    
    setSelectedFilters(filters);
    onFilterChange(filters);
  };

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    const filters = { ...selectedFilters };
    
    if (!filters.amenities) {
      filters.amenities = [];
    }
    
    if (checked) {
      filters.amenities = [...filters.amenities, amenity];
    } else {
      filters.amenities = filters.amenities.filter(a => a !== amenity);
    }
    
    if (filters.amenities.length === 0) {
      delete filters.amenities;
    }
    
    setSelectedFilters(filters);
    onFilterChange(filters);
  };

  const handleTypeChange = (type: "hotel" | "bus", checked: boolean) => {
    const filters = { ...selectedFilters };
    
    if (checked) {
      filters.type = type;
    } else {
      delete filters.type;
    }
    
    setSelectedFilters(filters);
    onFilterChange(filters);
  };

  const clearFilters = () => {
    setSelectedFilters({});
    onFilterChange({});
  };

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Filters</CardTitle>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Service Type */}
        <div>
          <h4 className="font-medium mb-3">Service Type</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hotel"
                checked={selectedFilters.type === "hotel"}
                onCheckedChange={(checked) => handleTypeChange("hotel", checked as boolean)}
              />
              <Label htmlFor="hotel" className="text-sm">Hotels</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="bus"
                checked={selectedFilters.type === "bus"}
                onCheckedChange={(checked) => handleTypeChange("bus", checked as boolean)}
              />
              <Label htmlFor="bus" className="text-sm">buses</Label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Price Range */}
        <div>
          <h4 className="font-medium mb-3">Price Range</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="price1"
                onCheckedChange={(checked) => handlePriceChange("0-50", checked as boolean)}
              />
              <Label htmlFor="price1" className="text-sm">$0 - $50</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="price2"
                onCheckedChange={(checked) => handlePriceChange("50-100", checked as boolean)}
              />
              <Label htmlFor="price2" className="text-sm">$50 - $100</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="price3"
                onCheckedChange={(checked) => handlePriceChange("100-200", checked as boolean)}
              />
              <Label htmlFor="price3" className="text-sm">$100 - $200</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="price4"
                onCheckedChange={(checked) => handlePriceChange("200+", checked as boolean)}
              />
              <Label htmlFor="price4" className="text-sm">$200+</Label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Rating */}
        <div>
          <h4 className="font-medium mb-3">Rating</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rating5"
                checked={selectedFilters.rating === 5}
                onCheckedChange={(checked) => handleRatingChange(5, checked as boolean)}
              />
              <Label htmlFor="rating5" className="text-sm flex items-center">
                <span className="text-yellow-400">★★★★★</span>
                <span className="ml-1">5 stars</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rating4"
                checked={selectedFilters.rating === 4}
                onCheckedChange={(checked) => handleRatingChange(4, checked as boolean)}
              />
              <Label htmlFor="rating4" className="text-sm flex items-center">
                <span className="text-yellow-400">★★★★</span>
                <span className="text-muted-foreground">★</span>
                <span className="ml-1">4+ stars</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rating3"
                checked={selectedFilters.rating === 3}
                onCheckedChange={(checked) => handleRatingChange(3, checked as boolean)}
              />
              <Label htmlFor="rating3" className="text-sm flex items-center">
                <span className="text-yellow-400">★★★</span>
                <span className="text-muted-foreground">★★</span>
                <span className="ml-1">3+ stars</span>
              </Label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Amenities */}
        <div>
          <h4 className="font-medium mb-3">Amenities</h4>
          <div className="space-y-2">
            {["Free WiFi", "Free Parking", "Breakfast", "Swimming Pool", "Gym", "Restaurant"].map((amenity) => (
              <div key={amenity} className="flex items-center space-x-2">
                <Checkbox
                  id={amenity.toLowerCase().replace(/\s+/g, '-')}
                  checked={selectedFilters.amenities?.includes(amenity) || false}
                  onCheckedChange={(checked) => handleAmenityChange(amenity, checked as boolean)}
                />
                <Label htmlFor={amenity.toLowerCase().replace(/\s+/g, '-')} className="text-sm">
                  {amenity}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <Button 
          className="w-full" 
          onClick={() => onFilterChange(selectedFilters)}
        >
          Apply Filters
        </Button>
      </CardContent>
    </Card>
  );
}
