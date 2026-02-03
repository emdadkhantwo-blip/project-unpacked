import { useEffect, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useUpdateRoomType, useDeleteRoomType, type RoomType } from "@/hooks/useRoomTypes";
import { Loader2, Trash2, Plus, X, Wifi, Tv, Coffee, Bath, Wind, Sparkles, UtensilsCrossed, Car, Waves, Dumbbell, Snowflake } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const getFacilityIcon = (facility: string) => {
  const lower = facility.toLowerCase();
  if (lower.includes("wifi") || lower.includes("internet")) return Wifi;
  if (lower.includes("tv") || lower.includes("television")) return Tv;
  if (lower.includes("coffee") || lower.includes("tea")) return Coffee;
  if (lower.includes("bath") || lower.includes("tub") || lower.includes("jacuzzi")) return Bath;
  if (lower.includes("ac") || lower.includes("air condition") || lower.includes("cooling")) return Snowflake;
  if (lower.includes("balcony") || lower.includes("terrace")) return Wind;
  if (lower.includes("room service") || lower.includes("dining")) return UtensilsCrossed;
  if (lower.includes("parking") || lower.includes("car")) return Car;
  if (lower.includes("pool") || lower.includes("swim")) return Waves;
  if (lower.includes("gym") || lower.includes("fitness")) return Dumbbell;
  return Sparkles;
};

const suggestedFacilities = [
  "WiFi", "TV", "AC", "Mini Bar", "Coffee Maker", "Bathrobe", 
  "Balcony", "Room Service", "Safe", "Hair Dryer"
];

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  code: z.string().min(1, "Code is required").max(10, "Code too long").toUpperCase(),
  description: z.string().optional(),
  base_rate: z.coerce.number().min(0, "Rate must be positive"),
  max_occupancy: z.coerce.number().min(1, "Min occupancy is 1").max(20, "Max occupancy is 20"),
  is_active: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface EditRoomTypeDialogProps {
  roomType: RoomType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditRoomTypeDialog({ roomType, open, onOpenChange }: EditRoomTypeDialogProps) {
  const updateRoomType = useUpdateRoomType();
  const deleteRoomType = useDeleteRoomType();
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
      is_active: true,
    },
  });

  useEffect(() => {
    if (roomType) {
      form.reset({
        name: roomType.name,
        code: roomType.code,
        description: roomType.description || "",
        base_rate: roomType.base_rate,
        max_occupancy: roomType.max_occupancy,
        is_active: roomType.is_active,
      });
      setFacilities((roomType.amenities as string[]) || []);
    }
  }, [roomType, form]);

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

  const onSubmit = (data: FormData) => {
    if (!roomType) return;

    updateRoomType.mutate(
      {
        roomTypeId: roomType.id,
        data: {
          name: data.name,
          code: data.code.toUpperCase(),
          description: data.description || null,
          base_rate: data.base_rate,
          max_occupancy: data.max_occupancy,
          is_active: data.is_active,
          amenities: facilities,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const handleDelete = () => {
    if (!roomType) return;

    deleteRoomType.mutate(roomType.id, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  if (!roomType) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Room Type</DialogTitle>
          <DialogDescription>
            Update the room type details below.
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
              <div className="flex gap-2">
                <Input
                  placeholder="Add a facility..."
                  value={newFacility}
                  onChange={(e) => setNewFacility(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addFacility();
                    }
                  }}
                />
                <Button type="button" size="icon" onClick={addFacility}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
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
                        <button
                          type="button"
                          onClick={() => removeFacility(facility)}
                          className="ml-1 rounded-full p-0.5 hover:bg-muted"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
              
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Quick add:</p>
                <div className="flex flex-wrap gap-1">
                  {suggestedFacilities
                    .filter((f) => !facilities.includes(f))
                    .slice(0, 6)
                    .map((facility) => (
                      <Badge
                        key={facility}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => addSuggestedFacility(facility)}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        {facility}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <div className="text-xs text-muted-foreground">
                      Inactive room types won't be available for new rooms
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Room Type?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the room type "{roomType.name}". 
                      Rooms using this type will need to be reassigned.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateRoomType.isPending}>
                  {updateRoomType.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
