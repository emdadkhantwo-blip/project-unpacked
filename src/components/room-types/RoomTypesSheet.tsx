import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRoomTypes, type RoomType } from "@/hooks/useRoomTypes";
import { CreateRoomTypeDialog } from "./CreateRoomTypeDialog";
import { EditRoomTypeDialog } from "./EditRoomTypeDialog";
import { Plus, Users, Pencil } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface RoomTypesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoomTypesSheet({ open, onOpenChange }: RoomTypesSheetProps) {
  const { data: roomTypes = [], isLoading } = useRoomTypes();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState<RoomType | null>(null);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Room Types</SheetTitle>
            <SheetDescription>
              Manage room types and their rates for your property.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <Button onClick={() => setCreateOpen(true)} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Room Type
            </Button>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : roomTypes.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                No room types configured yet
              </div>
            ) : (
              <div className="space-y-3">
                {roomTypes.map((roomType) => (
                  <div
                    key={roomType.id}
                    className="group flex items-start justify-between rounded-lg border p-3 transition-colors hover:bg-accent/50"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{roomType.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {roomType.code}
                        </Badge>
                        {!roomType.is_active && (
                          <Badge variant="secondary" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      {roomType.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {roomType.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span className="font-medium">৳</span>
                          {roomType.base_rate}/night
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Max {roomType.max_occupancy}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => setEditingRoomType(roomType)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <CreateRoomTypeDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditRoomTypeDialog
        roomType={editingRoomType}
        open={!!editingRoomType}
        onOpenChange={(open) => !open && setEditingRoomType(null)}
      />
    </>
  );
}
