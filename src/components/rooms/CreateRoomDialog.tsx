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
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRoomTypes } from "@/hooks/useRoomTypes";
import { useCreateRoom } from "@/hooks/useRooms";
import { Loader2, Wifi, Tv, Coffee, Wine, Sparkles, Wind, Bath, Car, Utensils, Phone, ListChecks } from "lucide-react";

const formSchema = z.object({
  room_number: z.string().min(1, "Room number is required").max(20, "Room number too long"),
  floor: z.string().optional(),
  room_type_id: z.string().min(1, "Room type is required"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper to get icon for amenity
const getAmenityIcon = (amenity: string) => {
  const lower = amenity.toLowerCase();
  if (lower.includes("wifi") || lower.includes("internet")) return Wifi;
  if (lower.includes("tv") || lower.includes("television")) return Tv;
  if (lower.includes("coffee") || lower.includes("tea")) return Coffee;
  if (lower.includes("bar") || lower.includes("wine") || lower.includes("minibar")) return Wine;
  if (lower.includes("air") || lower.includes("ac") || lower.includes("conditioning")) return Wind;
  if (lower.includes("bath") || lower.includes("tub") || lower.includes("shower")) return Bath;
  if (lower.includes("parking") || lower.includes("car")) return Car;
  if (lower.includes("breakfast") || lower.includes("food") || lower.includes("dining")) return Utensils;
  if (lower.includes("phone") || lower.includes("call")) return Phone;
  return Sparkles;
};

export function CreateRoomDialog({ open, onOpenChange }: CreateRoomDialogProps) {
  const { data: roomTypes = [] } = useRoomTypes();
  const createRoom = useCreateRoom();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      room_number: "",
      floor: "",
      room_type_id: "",
      notes: "",
    },
  });

  // Watch selected room type to show facilities
  const selectedRoomTypeId = form.watch("room_type_id");
  const selectedRoomType = roomTypes.find((rt) => rt.id === selectedRoomTypeId);
  const amenities = (selectedRoomType?.amenities as string[]) || [];

  const onSubmit = (data: FormData) => {
    createRoom.mutate(
      {
        room_number: data.room_number,
        floor: data.floor || null,
        room_type_id: data.room_type_id,
        notes: data.notes || null,
      },
      {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Room</DialogTitle>
          <DialogDescription>
            Create a new room in your property. Fill in the room details below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="room_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 101, A-201" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="floor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Floor</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 1, 2, Ground" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="room_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select room type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roomTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name} (${type.base_rate}/night)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Facilities Button - shows when room type is selected */}
            {selectedRoomTypeId && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="w-full">
                    <ListChecks className="mr-2 h-4 w-4" />
                    View Facilities
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">
                      Facilities for {selectedRoomType?.name}
                    </h4>
                    {amenities.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {amenities.map((amenity, index) => {
                          const Icon = getAmenityIcon(amenity);
                          return (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              <Icon className="h-3 w-3" />
                              {amenity}
                            </Badge>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No facilities listed for this room type.
                      </p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special notes about this room..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createRoom.isPending}>
                {createRoom.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Room
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
