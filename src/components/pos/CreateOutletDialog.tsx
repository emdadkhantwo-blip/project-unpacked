import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreatePOSOutlet } from "@/hooks/usePOS";

interface CreateOutletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const outletTypes = [
  { value: "restaurant", label: "Restaurant" },
  { value: "bar", label: "Bar" },
  { value: "cafe", label: "Café" },
  { value: "room_service", label: "Room Service" },
];

export function CreateOutletDialog({ open, onOpenChange }: CreateOutletDialogProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState("restaurant");

  const createOutlet = useCreatePOSOutlet();

  const handleSubmit = () => {
    if (!name || !code) return;

    createOutlet.mutate(
      { name, code: code.toUpperCase(), type },
      {
        onSuccess: () => {
          onOpenChange(false);
          setName("");
          setCode("");
          setType("restaurant");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create POS Outlet</DialogTitle>
          <DialogDescription>
            Add a new restaurant, bar, or other F&B outlet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Outlet Name</Label>
            <Input
              placeholder="e.g., Main Restaurant"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Code</Label>
            <Input
              placeholder="e.g., REST"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={8}
            />
            <p className="text-xs text-muted-foreground">
              Short code for order numbers (max 8 characters)
            </p>
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {outletTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name || !code || createOutlet.isPending}
          >
            {createOutlet.isPending ? "Creating..." : "Create Outlet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
