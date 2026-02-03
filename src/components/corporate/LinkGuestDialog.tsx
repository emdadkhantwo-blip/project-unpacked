import { useState, useMemo } from "react";
import { Search, UserPlus, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { useGuests } from "@/hooks/useGuests";
import { useLinkGuestToCorporateAccount } from "@/hooks/useCorporateAccounts";

interface LinkGuestDialogProps {
  accountId: string;
  accountName: string;
  linkedGuestIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LinkGuestDialog({
  accountId,
  accountName,
  linkedGuestIds,
  open,
  onOpenChange,
}: LinkGuestDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);

  const { data: allGuests = [], isLoading } = useGuests();
  const linkMutation = useLinkGuestToCorporateAccount();

  // Filter out already linked guests and apply search
  const availableGuests = useMemo(() => {
    return allGuests.filter((guest) => {
      // Exclude already linked guests
      if (linkedGuestIds.includes(guest.id)) return false;
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const fullName = `${guest.first_name} ${guest.last_name}`.toLowerCase();
        const email = (guest.email || "").toLowerCase();
        const phone = (guest.phone || "").toLowerCase();
        
        return fullName.includes(query) || email.includes(query) || phone.includes(query);
      }
      
      return true;
    });
  }, [allGuests, linkedGuestIds, searchQuery]);

  const toggleGuest = (guestId: string) => {
    setSelectedGuestIds((prev) =>
      prev.includes(guestId)
        ? prev.filter((id) => id !== guestId)
        : [...prev, guestId]
    );
  };

  const handleLink = async () => {
    // Link all selected guests
    for (const guestId of selectedGuestIds) {
      await linkMutation.mutateAsync({ guestId, accountId });
    }
    
    // Reset and close
    setSelectedGuestIds([]);
    setSearchQuery("");
    onOpenChange(false);
  };

  const handleClose = () => {
    setSelectedGuestIds([]);
    setSearchQuery("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Link Guests
          </DialogTitle>
          <DialogDescription>
            Select guests to link to {accountName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search guests by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Guest List */}
          <ScrollArea className="h-[300px] rounded-md border">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading guests...
              </div>
            ) : availableGuests.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchQuery
                  ? "No matching guests found"
                  : "All guests are already linked"}
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {availableGuests.map((guest) => {
                  const initials = `${guest.first_name?.[0] || ""}${
                    guest.last_name?.[0] || ""
                  }`.toUpperCase();
                  const isSelected = selectedGuestIds.includes(guest.id);

                  return (
                    <div
                      key={guest.id}
                      className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary/10"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => toggleGuest(guest.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleGuest(guest.id)}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-muted text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {guest.first_name} {guest.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {guest.email || guest.phone || "No contact info"}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Selection Count */}
          {selectedGuestIds.length > 0 && (
            <p className="text-sm text-muted-foreground text-center">
              {selectedGuestIds.length} guest{selectedGuestIds.length > 1 ? "s" : ""} selected
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleLink}
            disabled={selectedGuestIds.length === 0 || linkMutation.isPending}
          >
            {linkMutation.isPending
              ? "Linking..."
              : `Link ${selectedGuestIds.length || ""} Guest${
                  selectedGuestIds.length !== 1 ? "s" : ""
                }`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
