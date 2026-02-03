import { useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { useRoomTypes } from "@/hooks/useRoomTypes";
import { useUpdateRoom, useDeleteRoom } from "@/hooks/useRooms";
import { 
  Loader2, 
  Trash2, 
  ListChecks,
  Wifi,
  Tv,
  Coffee,
  Wind,
  Bath,
  UtensilsCrossed,
  Car,
  Dumbbell,
  Waves,
  Phone,
  Lock,
  Refrigerator,
  Shirt,
  Sparkles,
} from "lucide-react";
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
import type { RoomStatus } from "@/types/database";

// Helper to get icon for amenity
const getAmenityIcon = (amenity: string) => {
  const lower = amenity.toLowerCase();
  if (lower.includes("wifi") || lower.includes("internet")) return Wifi;
  if (lower.includes("tv") || lower.includes("television")) return Tv;
  if (lower.includes("coffee") || lower.includes("tea")) return Coffee;
  if (lower.includes("ac") || lower.includes("air")) return Wind;
  if (lower.includes("bath") || lower.includes("tub") || lower.includes("jacuzzi")) return Bath;
  if (lower.includes("breakfast") || lower.includes("dining") || lower.includes("restaurant")) return UtensilsCrossed;
  if (lower.includes("parking") || lower.includes("car")) return Car;
  if (lower.includes("gym") || lower.includes("fitness")) return Dumbbell;
  if (lower.includes("pool") || lower.includes("swim")) return Waves;
  if (lower.includes("phone") || lower.includes("call")) return Phone;
  if (lower.includes("safe") || lower.includes("locker")) return Lock;
  if (lower.includes("fridge") || lower.includes("mini") || lower.includes("bar")) return Refrigerator;
  if (lower.includes("laundry") || lower.includes("iron")) return Shirt;
  return Sparkles;
};

const formSchema = z.object({
  room_number: z.string().min(1, "Room number is required").max(20, "Room number too long"),
  floor: z.string().optional(),
  room_type_id: z.string().min(1, "Room type is required"),
  notes: z.string().optional(),
  is_active: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface Room {
  id: string;
  room_number: string;
  floor: string | null;
  status: RoomStatus;
  is_active: boolean;
  notes: string | null;
  room_type_id: string;
  room_type: {
    id: string;
    name: string;
    code: string;
    base_rate: number;
  } | null;
}

interface EditRoomDialogProps {
  room: Room | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditRoomDialog({ room, open, onOpenChange }: EditRoomDialogProps) {
  const { data: roomTypes = [] } = useRoomTypes();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      room_number: "",
      floor: "",
      room_type_id: "",
      notes: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (room) {
      form.reset({
        room_number: room.room_number,
        floor: room.floor || "",
        room_type_id: room.room_type_id,
        notes: room.notes || "",
        is_active: room.is_active,
      });
    }
  }, [room, form]);

  const onSubmit = (data: FormData) => {
    if (!room) return;

    updateRoom.mutate(
      {
        roomId: room.id,
        data: {
          room_number: data.room_number,
          floor: data.floor || null,
          room_type_id: data.room_type_id,
          notes: data.notes || null,
          is_active: data.is_active,
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
    if (!room) return;

    deleteRoom.mutate(room.id, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  if (!room) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Room {room.room_number}</DialogTitle>
          <DialogDescription>
            Update the room details below.
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
              render={({ field }) => {
                const selectedRoomType = roomTypes.find((rt) => rt.id === field.value);
                const amenities = (selectedRoomType?.amenities as string[]) || [];
                
                return (
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
                    
                    {/* View Facilities Button */}
                    {field.value && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                          >
                            <ListChecks className="mr-2 h-4 w-4" />
                            View Facilities
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72" align="start">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">
                              Facilities for {selectedRoomType?.name}
                            </h4>
                            {amenities.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {amenities.map((amenity) => {
                                  const Icon = getAmenityIcon(amenity);
                                  return (
                                    <Badge
                                      key={amenity}
                                      variant="secondary"
                                      className="gap-1"
                                    >
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
                  </FormItem>
                );
              }}
            />

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

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active</FormLabel>
                    <div className="text-xs text-muted-foreground">
                      Inactive rooms won't appear in room lists
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
                    disabled={room.status === "occupied"}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Room?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete room {room.room_number}. This action cannot be undone.
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
                <Button type="submit" disabled={updateRoom.isPending}>
                  {updateRoom.isPending && (
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
