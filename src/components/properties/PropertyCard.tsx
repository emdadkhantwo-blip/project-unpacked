import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { useDeleteProperty } from "@/hooks/useProperties";
import { useTenant } from "@/hooks/useTenant";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Property {
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
}

interface PropertyCardProps {
  property: Property;
  onViewDetails: () => void;
}

const STATUS_STYLES: Record<string, { border: string; badge: string; text: string }> = {
  active: { 
    border: "border-l-emerald-500", 
    badge: "bg-gradient-to-r from-emerald-500 to-teal-500",
    text: "text-white"
  },
  inactive: { 
    border: "border-l-slate-400", 
    badge: "bg-slate-200",
    text: "text-slate-600"
  },
  maintenance: { 
    border: "border-l-amber-500", 
    badge: "bg-gradient-to-r from-amber-500 to-orange-500",
    text: "text-white"
  },
};

export function PropertyCard({ property, onViewDetails }: PropertyCardProps) {
  const { properties, currentProperty } = useTenant();
  const deleteProperty = useDeleteProperty();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isCurrentProperty = currentProperty?.id === property.id;
  const canDelete = properties.length > 1;
  const statusStyle = STATUS_STYLES[property.status];

  const handleDelete = () => {
    deleteProperty.mutate(property.id);
    setShowDeleteDialog(false);
  };

  const location = [property.city, property.country].filter(Boolean).join(", ");

  return (
    <>
      <Card className={cn(
        "transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border-l-4",
        statusStyle.border,
        isCurrentProperty && "ring-2 ring-primary ring-offset-2"
      )}>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 shadow-md">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">{property.name}</h3>
              <p className="text-sm text-muted-foreground font-mono">{property.code}</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuItem onClick={onViewDetails}>
                View & Edit
              </DropdownMenuItem>
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status & Current Badge */}
          <div className="flex items-center gap-2">
            <Badge className={cn("border-none shadow-sm capitalize", statusStyle.badge, statusStyle.text)}>
              {property.status}
            </Badge>
            {isCurrentProperty && (
              <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-none shadow-sm">
                Current
              </Badge>
            )}
          </div>

          {/* Location */}
          {location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="rounded-full bg-purple-500/10 p-1">
                <MapPin className="h-3.5 w-3.5 text-purple-500" />
              </div>
              <span>{location}</span>
            </div>
          )}

          {/* Contact Info */}
          <div className="space-y-1.5">
            {property.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="rounded-full bg-emerald-500/10 p-1">
                  <Phone className="h-3 w-3 text-emerald-500" />
                </div>
                <span>{property.phone}</span>
              </div>
            )}
            {property.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="rounded-full bg-blue-500/10 p-1">
                  <Mail className="h-3 w-3 text-blue-500" />
                </div>
                <span className="truncate">{property.email}</span>
              </div>
            )}
          </div>

          {/* Timezone & Currency */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-full">
              <Globe className="h-3 w-3" />
              <span>{property.timezone || "UTC"}</span>
            </div>
            <span className="bg-muted/50 px-2 py-1 rounded-full">
              {property.currency || "BDT"}
            </span>
            {property.tax_rate !== null && property.tax_rate > 0 && (
              <span className="bg-amber-500/10 text-amber-600 px-2 py-1 rounded-full">
                Tax: {property.tax_rate}%
              </span>
            )}
          </div>

          {/* Actions */}
          <Button
            variant="outline"
            size="sm"
            className="w-full hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={onViewDetails}
          >
            Manage Property
          </Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{property.name}" and all associated
              data including rooms, reservations, and folios. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Property
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
