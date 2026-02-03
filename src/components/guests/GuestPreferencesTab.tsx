import { useState, useEffect } from "react";
import {
  Bed,
  Utensils,
  Phone,
  Cigarette,
  Wind,
  Volume2,
  Accessibility,
  Heart,
  Save,
  Edit2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { useQueryClient } from "@tanstack/react-query";
import type { Guest } from "@/hooks/useGuests";

interface GuestPreferences {
  roomPreferences: {
    floorLevel: string;
    bedType: string;
    smokingRoom: boolean;
    quietRoom: boolean;
    accessibleRoom: boolean;
    specificRoom: string;
  };
  dietary: {
    restrictions: string[];
    allergies: string;
    specialRequests: string;
  };
  communication: {
    preferredContact: string;
    language: string;
    marketingOptIn: boolean;
  };
  amenities: string[];
  otherNotes: string;
}

const defaultPreferences: GuestPreferences = {
  roomPreferences: {
    floorLevel: "",
    bedType: "",
    smokingRoom: false,
    quietRoom: false,
    accessibleRoom: false,
    specificRoom: "",
  },
  dietary: {
    restrictions: [],
    allergies: "",
    specialRequests: "",
  },
  communication: {
    preferredContact: "email",
    language: "en",
    marketingOptIn: false,
  },
  amenities: [],
  otherNotes: "",
};

const FLOOR_LEVELS = [
  { value: "low", label: "Lower Floor (1-3)" },
  { value: "mid", label: "Middle Floor (4-7)" },
  { value: "high", label: "Higher Floor (8+)" },
  { value: "any", label: "No Preference" },
];

const BED_TYPES = [
  { value: "king", label: "King Bed" },
  { value: "queen", label: "Queen Bed" },
  { value: "twin", label: "Twin Beds" },
  { value: "any", label: "No Preference" },
];

const DIETARY_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Halal",
  "Kosher",
  "Gluten-Free",
  "Lactose-Free",
];

const AMENITY_OPTIONS = [
  "Extra Pillows",
  "Hypoallergenic Bedding",
  "Mini Bar Stocked",
  "Coffee Machine",
  "Late Checkout",
  "Early Check-in",
  "Newspaper",
  "Gym Access",
  "Pool Access",
  "Spa Access",
];

const CONTACT_METHODS = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "sms", label: "SMS" },
  { value: "whatsapp", label: "WhatsApp" },
];

interface GuestPreferencesTabProps {
  guest: Guest;
}

export function GuestPreferencesTab({ guest }: GuestPreferencesTabProps) {
  const { tenant } = useTenant();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState<GuestPreferences>(defaultPreferences);

  // Parse existing preferences from guest.preferences JSONB field
  useEffect(() => {
    if (guest.preferences && typeof guest.preferences === "object") {
      const parsed = guest.preferences as Partial<GuestPreferences>;
      setPreferences({
        ...defaultPreferences,
        ...parsed,
        roomPreferences: { ...defaultPreferences.roomPreferences, ...parsed.roomPreferences },
        dietary: { ...defaultPreferences.dietary, ...parsed.dietary },
        communication: { ...defaultPreferences.communication, ...parsed.communication },
      });
    }
  }, [guest.preferences]);

  const handleSave = async () => {
    if (!tenant?.id) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("guests")
        .update({ preferences: JSON.parse(JSON.stringify(preferences)) })
        .eq("id", guest.id)
        .eq("tenant_id", tenant.id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["guests"] });
      toast.success("Preferences saved successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDietary = (option: string) => {
    setPreferences((prev) => ({
      ...prev,
      dietary: {
        ...prev.dietary,
        restrictions: prev.dietary.restrictions.includes(option)
          ? prev.dietary.restrictions.filter((r) => r !== option)
          : [...prev.dietary.restrictions, option],
      },
    }));
  };

  const toggleAmenity = (amenity: string) => {
    setPreferences((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const hasPreferences =
    preferences.roomPreferences.floorLevel ||
    preferences.roomPreferences.bedType ||
    preferences.roomPreferences.smokingRoom ||
    preferences.roomPreferences.quietRoom ||
    preferences.roomPreferences.accessibleRoom ||
    preferences.dietary.restrictions.length > 0 ||
    preferences.dietary.allergies ||
    preferences.amenities.length > 0;

  return (
    <div className="space-y-4">
      {/* Header with Edit/Save Button */}
      <div className="flex justify-end">
        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 className="h-4 w-4 mr-1" />
            Edit Preferences
          </Button>
        )}
      </div>

      {!hasPreferences && !isEditing && (
        <div className="text-center py-8 text-muted-foreground">
          <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No preferences recorded yet</p>
          <Button variant="link" size="sm" onClick={() => setIsEditing(true)}>
            Add guest preferences
          </Button>
        </div>
      )}

      {(hasPreferences || isEditing) && (
        <>
          {/* Room Preferences */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bed className="h-4 w-4" />
                Room Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isEditing ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Floor Level</Label>
                      <Select
                        value={preferences.roomPreferences.floorLevel}
                        onValueChange={(val) =>
                          setPreferences((prev) => ({
                            ...prev,
                            roomPreferences: { ...prev.roomPreferences, floorLevel: val },
                          }))
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select floor" />
                        </SelectTrigger>
                        <SelectContent>
                          {FLOOR_LEVELS.map((fl) => (
                            <SelectItem key={fl.value} value={fl.value}>
                              {fl.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Bed Type</Label>
                      <Select
                        value={preferences.roomPreferences.bedType}
                        onValueChange={(val) =>
                          setPreferences((prev) => ({
                            ...prev,
                            roomPreferences: { ...prev.roomPreferences, bedType: val },
                          }))
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select bed" />
                        </SelectTrigger>
                        <SelectContent>
                          {BED_TYPES.map((bt) => (
                            <SelectItem key={bt.value} value={bt.value}>
                              {bt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="smoking"
                        checked={preferences.roomPreferences.smokingRoom}
                        onCheckedChange={(checked) =>
                          setPreferences((prev) => ({
                            ...prev,
                            roomPreferences: { ...prev.roomPreferences, smokingRoom: !!checked },
                          }))
                        }
                      />
                      <Label htmlFor="smoking" className="text-sm flex items-center gap-1">
                        <Cigarette className="h-3 w-3" /> Smoking
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="quiet"
                        checked={preferences.roomPreferences.quietRoom}
                        onCheckedChange={(checked) =>
                          setPreferences((prev) => ({
                            ...prev,
                            roomPreferences: { ...prev.roomPreferences, quietRoom: !!checked },
                          }))
                        }
                      />
                      <Label htmlFor="quiet" className="text-sm flex items-center gap-1">
                        <Volume2 className="h-3 w-3" /> Quiet Room
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="accessible"
                        checked={preferences.roomPreferences.accessibleRoom}
                        onCheckedChange={(checked) =>
                          setPreferences((prev) => ({
                            ...prev,
                            roomPreferences: { ...prev.roomPreferences, accessibleRoom: !!checked },
                          }))
                        }
                      />
                      <Label htmlFor="accessible" className="text-sm flex items-center gap-1">
                        <Accessibility className="h-3 w-3" /> Accessible
                      </Label>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {preferences.roomPreferences.floorLevel && (
                    <Badge variant="secondary">
                      {FLOOR_LEVELS.find((f) => f.value === preferences.roomPreferences.floorLevel)?.label}
                    </Badge>
                  )}
                  {preferences.roomPreferences.bedType && (
                    <Badge variant="secondary">
                      {BED_TYPES.find((b) => b.value === preferences.roomPreferences.bedType)?.label}
                    </Badge>
                  )}
                  {preferences.roomPreferences.smokingRoom && (
                    <Badge variant="outline">Smoking</Badge>
                  )}
                  {preferences.roomPreferences.quietRoom && (
                    <Badge variant="outline">Quiet Room</Badge>
                  )}
                  {preferences.roomPreferences.accessibleRoom && (
                    <Badge variant="outline">Accessible</Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dietary Requirements */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Utensils className="h-4 w-4" />
                Dietary Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isEditing ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {DIETARY_OPTIONS.map((option) => (
                      <Badge
                        key={option}
                        variant={preferences.dietary.restrictions.includes(option) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleDietary(option)}
                      >
                        {option}
                      </Badge>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Allergies</Label>
                    <Textarea
                      value={preferences.dietary.allergies}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          dietary: { ...prev.dietary, allergies: e.target.value },
                        }))
                      }
                      placeholder="List any food allergies..."
                      className="min-h-[60px]"
                    />
                  </div>
                </>
              ) : (
                <>
                  {preferences.dietary.restrictions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {preferences.dietary.restrictions.map((r) => (
                        <Badge key={r} variant="secondary">{r}</Badge>
                      ))}
                    </div>
                  )}
                  {preferences.dietary.allergies && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Allergies:</strong> {preferences.dietary.allergies}
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Preferred Amenities */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Wind className="h-4 w-4" />
                Preferred Amenities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {AMENITY_OPTIONS.map((amenity) => (
                    <Badge
                      key={amenity}
                      variant={preferences.amenities.includes(amenity) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleAmenity(amenity)}
                    >
                      {amenity}
                    </Badge>
                  ))}
                </div>
              ) : preferences.amenities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {preferences.amenities.map((a) => (
                    <Badge key={a} variant="secondary">{a}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No specific amenities</p>
              )}
            </CardContent>
          </Card>

          {/* Communication Preferences */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Communication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isEditing ? (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">Preferred Contact Method</Label>
                    <Select
                      value={preferences.communication.preferredContact}
                      onValueChange={(val) =>
                        setPreferences((prev) => ({
                          ...prev,
                          communication: { ...prev.communication, preferredContact: val },
                        }))
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTACT_METHODS.map((cm) => (
                          <SelectItem key={cm.value} value={cm.value}>
                            {cm.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="marketing"
                      checked={preferences.communication.marketingOptIn}
                      onCheckedChange={(checked) =>
                        setPreferences((prev) => ({
                          ...prev,
                          communication: { ...prev.communication, marketingOptIn: !!checked },
                        }))
                      }
                    />
                    <Label htmlFor="marketing" className="text-sm">
                      Opted in for marketing communications
                    </Label>
                  </div>
                </>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contact via</span>
                    <span className="capitalize">{preferences.communication.preferredContact}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Marketing</span>
                    <span>{preferences.communication.marketingOptIn ? "Opted In" : "Opted Out"}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
