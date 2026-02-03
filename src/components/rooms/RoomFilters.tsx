import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Grid3X3, List, Search, X } from "lucide-react";
import type { RoomStatus } from "@/types/database";

interface RoomFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: RoomStatus | "all";
  onStatusFilterChange: (value: RoomStatus | "all") => void;
  floorFilter: string;
  onFloorFilterChange: (value: string) => void;
  floors: string[];
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
}

const statusOptions: { value: RoomStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "vacant", label: "Vacant" },
  { value: "occupied", label: "Occupied" },
  { value: "dirty", label: "Dirty" },
  { value: "maintenance", label: "Maintenance" },
  { value: "out_of_order", label: "Out of Order" },
];

export function RoomFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  floorFilter,
  onFloorFilterChange,
  floors,
  viewMode,
  onViewModeChange,
}: RoomFiltersProps) {
  const hasFilters = searchQuery || statusFilter !== "all" || floorFilter !== "all";

  const clearFilters = () => {
    onSearchChange("");
    onStatusFilterChange("all");
    onFloorFilterChange("all");
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search rooms..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-9"
        />
      </div>

      {/* Status Filter */}
      <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as RoomStatus | "all")}>
        <SelectTrigger className="w-[150px] h-9">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Floor Filter */}
      <Select value={floorFilter} onValueChange={onFloorFilterChange}>
        <SelectTrigger className="w-[120px] h-9">
          <SelectValue placeholder="Floor" />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          <SelectItem value="all">All Floors</SelectItem>
          {floors.map((floor) => (
            <SelectItem key={floor} value={floor}>
              Floor {floor}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 h-9">
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}

      {/* View Toggle */}
      <div className="ml-auto flex items-center rounded-md border bg-card">
        <Button
          variant={viewMode === "grid" ? "secondary" : "ghost"}
          size="icon"
          className="h-9 w-9 rounded-r-none"
          onClick={() => onViewModeChange("grid")}
        >
          <Grid3X3 className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === "list" ? "secondary" : "ghost"}
          size="icon"
          className="h-9 w-9 rounded-l-none"
          onClick={() => onViewModeChange("list")}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
