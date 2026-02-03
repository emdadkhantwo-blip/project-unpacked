import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  Package, 
  Pencil, 
  Trash2, 
  CalendarDays,
  Gift,
  Moon,
  Utensils,
  Car,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { usePackages, type Package as PackageType } from '@/hooks/usePackages';
import { formatCurrency } from '@/lib/currency';
import type { RoomType } from '@/hooks/useRoomTypes';

interface PackagesListProps {
  packages: PackageType[];
  roomTypes: RoomType[];
}

const inclusionIcons: Record<string, React.ElementType> = {
  breakfast: Utensils,
  dinner: Utensils,
  spa: Sparkles,
  transfer: Car,
  gift: Gift,
  default: Gift,
};

export default function PackagesList({ packages, roomTypes }: PackagesListProps) {
  const { togglePackage, deletePackage } = usePackages();

  const getRoomTypeNames = (ids: string[] | null) => {
    if (!ids || ids.length === 0) return 'All Room Types';
    return ids
      .map(id => roomTypes.find(r => r.id === id)?.name || 'Unknown')
      .join(', ');
  };

  const formatAdjustment = (pkg: PackageType) => {
    if (pkg.adjustment_type === 'fixed') {
      return `+${formatCurrency(pkg.price_adjustment)}`;
    }
    return `+${pkg.price_adjustment}%`;
  };

  if (packages.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Packages</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Create packages to offer bundled deals like "Room + Breakfast" or "Honeymoon Special".
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {packages.map((pkg) => (
        <Card key={pkg.id} className={!pkg.is_active ? 'opacity-60' : ''}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">{pkg.name}</CardTitle>
              <CardDescription className="text-sm">
                Code: {pkg.code}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={pkg.is_active}
                onCheckedChange={(checked) => togglePackage.mutate({ id: pkg.id, is_active: checked })}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => deletePackage.mutate(pkg.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {pkg.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {pkg.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {formatAdjustment(pkg)}
              </Badge>
              {pkg.min_nights > 1 && (
                <Badge variant="outline">
                  <Moon className="h-3 w-3 mr-1" />
                  Min {pkg.min_nights} nights
                </Badge>
              )}
            </div>

            {pkg.inclusions && pkg.inclusions.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {pkg.inclusions.slice(0, 3).map((inclusion, idx) => {
                  const IconComponent = inclusionIcons[inclusion.icon || 'default'] || Gift;
                  return (
                    <Badge key={idx} variant="outline" className="text-xs">
                      <IconComponent className="h-3 w-3 mr-1" />
                      {inclusion.name}
                    </Badge>
                  );
                })}
                {pkg.inclusions.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{pkg.inclusions.length - 3} more
                  </Badge>
                )}
              </div>
            )}
            
            {(pkg.valid_from || pkg.valid_until) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <span>
                  {pkg.valid_from && pkg.valid_until
                    ? `${format(new Date(pkg.valid_from), 'MMM d')} - ${format(new Date(pkg.valid_until), 'MMM d, yyyy')}`
                    : pkg.valid_from
                    ? `From ${format(new Date(pkg.valid_from), 'MMM d, yyyy')}`
                    : `Until ${format(new Date(pkg.valid_until!), 'MMM d, yyyy')}`
                  }
                </span>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              {getRoomTypeNames(pkg.applicable_room_types)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
