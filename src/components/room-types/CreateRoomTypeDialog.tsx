import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useCreateRoomType } from "@/hooks/useRoomTypes";
import { Loader2, Plus, X, Wifi, Tv, Coffee, Wind, Bath, Car, Sparkles } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  code: z.string().min(1, "Code is required").max(10, "Code too long").toUpperCase(),
  description: z.string().optional(),
  base_rate: z.coerce.number().min(0, "Rate must be positive"),
  max_occupancy: z.coerce.number().min(1, "Min occupancy is 1").max(20, "Max occupancy is 20"),
});

type FormData = z.infer<typeof formSchema>;

interface CreateRoomTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Common facilities suggestions
const SUGGESTED_FACILITIES = [
  "WiFi",
  "TV",
  "Air Conditioning",
  "Mini Bar",
  "Coffee Maker",
  "Bathtub",
  "Shower",
  "Safe",
  "Parking",
  "Room Service",
  "Balcony",
  "Sea View",
];

// Helper to get icon for facility
const getFacilityIcon = (facility: string) => {
  const lower = facility.toLowerCase();
  if (lower.includes("wifi") || lower.includes("internet")) return Wifi;
  if (lower.includes("tv") || lower.includes("television")) return Tv;
  if (lower.includes("coffee") || lower.includes("tea")) return Coffee;
  if (lower.includes("air") || lower.includes("ac") || lower.includes("conditioning")) return Wind;
  if (lower.includes("bath") || lower.includes("tub") || lower.includes("shower")) return Bath;
  if (lower.includes("parking") || lower.includes("car")) return Car;
  return Sparkles;
};

export function CreateRoomTypeDialog({ open, onOpenChange }: CreateRoomTypeDialogProps) {
  const createRoomType = useCreateRoomType();
  const [facilities, setFacilities] = useState<string[]>([]);
  const [newFacility, setNewFacility] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      base_rate: 100,
      max_occupancy: 2,
    },
  });

  const addFacility = () => {
    const trimmed = newFacility.trim();
    if (trimmed && !facilities.includes(trimmed)) {
      setFacilities([...facilities, trimmed]);
      setNewFacility("");
    }
  };

  const removeFacility = (facility: string) => {
    setFacilities(facilities.filter((f) => f !== facility));
  };

  const addSuggestedFacility = (facility: string) => {
    if (!facilities.includes(facility)) {
      setFacilities([...facilities, facility]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addFacility();
    }
  };

  const onSubmit = (data: FormData) => {
    createRoomType.mutate(
      {
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description || null,
        base_rate: data.base_rate,
        max_occupancy: data.max_occupancy,
        amenities: facilities,
      },
      {
        onSuccess: () => {
          form.reset();
          setFacilities([]);
          setNewFacility("");
          onOpenChange(false);
        },
      }
    );
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset();
      setFacilities([]);
      setNewFacility("");
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Room Type</DialogTitle>
          <DialogDescription>
            Create a new room type for your property.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Deluxe Suite" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., DLX"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormDescription>
                    Short code for internal use (e.g., STD, DLX, STE)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description of this room type..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="base_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Rate ($) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="100.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_occupancy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Occupancy *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        placeholder="2"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Facilities Section */}
            <div className="space-y-3">
              <FormLabel>Facilities</FormLabel>
              
              {/* Add facility input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a facility (e.g., WiFi, Pool)"
                  value={newFacility}
                  onChange={(e) => setNewFacility(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addFacility}
                  disabled={!newFacility.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Added facilities */}
              {facilities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {facilities.map((facility) => {
                    const Icon = getFacilityIcon(facility);
                    return (
                      <Badge
                        key={facility}
                        variant="secondary"
                        className="flex items-center gap-1 pr-1"
                      >
                        <Icon className="h-3 w-3" />
                        {facility}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1 hover:bg-destructive/20"
                          onClick={() => removeFacility(facility)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    );
                  })}
                </div>
              )}

              {/* Suggested facilities */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Quick add:</p>
                <div className="flex flex-wrap gap-1">
                  {SUGGESTED_FACILITIES.filter((f) => !facilities.includes(f)).slice(0, 6).map((facility) => (
                    <Badge
                      key={facility}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent text-xs"
                      onClick={() => addSuggestedFacility(facility)}
                    >
                      + {facility}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createRoomType.isPending}>
                {createRoomType.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Room Type
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
