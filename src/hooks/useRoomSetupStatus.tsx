import { useRoomTypes } from "@/hooks/useRoomTypes";
import { useRooms } from "@/hooks/useRooms";

export function useRoomSetupStatus() {
  const { data: roomTypes, isLoading: isLoadingRoomTypes } = useRoomTypes();
  const { data: rooms, isLoading: isLoadingRooms } = useRooms();

  const hasRoomTypes = (roomTypes?.length || 0) > 0;
  const hasRooms = (rooms?.length || 0) > 0;
  const isReady = hasRoomTypes && hasRooms;
  const isLoading = isLoadingRoomTypes || isLoadingRooms;

  return {
    hasRoomTypes,
    hasRooms,
    isReady,
    isLoading,
    roomTypesCount: roomTypes?.length || 0,
    roomsCount: rooms?.length || 0,
  };
}
