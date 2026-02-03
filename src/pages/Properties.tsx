import { useState } from "react";
import { useTenant } from "@/hooks/useTenant";
import { usePropertyStats } from "@/hooks/useProperties";
import { PropertyStatsBar } from "@/components/properties/PropertyStatsBar";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { PropertyDetailDrawer } from "@/components/properties/PropertyDetailDrawer";
import { CreatePropertyDialog } from "@/components/properties/CreatePropertyDialog";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PropertyType {
  id: string;
  name: string;
  code: string;
  status: "active" | "inactive" | "maintenance";
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  timezone: string | null;
  currency: string | null;
  tax_rate: number | null;
  service_charge_rate: number | null;
  created_at: string;
}

export default function Properties() {
  const { properties, isLoading, isWithinLimit, subscription } = useTenant();
  const stats = usePropertyStats();
  const [selectedProperty, setSelectedProperty] = useState<PropertyType | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const canAddProperty = isWithinLimit("properties", properties.length);
  const maxProperties = subscription?.plan?.max_properties || 1;

  const handleViewDetails = (property: PropertyType) => {
    setSelectedProperty(property);
    setIsDetailOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Properties</h2>
          <p className="text-muted-foreground">
            Manage your hotel properties and their settings
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} disabled={!canAddProperty}>
          <Plus className="mr-2 h-4 w-4" />
          Add Property
        </Button>
      </div>

      {/* Limit Warning */}
      {!canAddProperty && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You've reached the maximum of {maxProperties} properties for your plan.
            Upgrade to add more properties.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <PropertyStatsBar stats={stats} />

      {/* Properties Grid */}
      {properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">No properties found</p>
          <Button variant="link" onClick={() => setIsCreateOpen(true)}>
            Add your first property
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property as unknown as PropertyType}
              onViewDetails={() => handleViewDetails(property as unknown as PropertyType)}
            />
          ))}
        </div>
      )}

      {/* Detail Drawer */}
      <PropertyDetailDrawer
        property={selectedProperty}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />

      {/* Create Dialog */}
      <CreatePropertyDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}
