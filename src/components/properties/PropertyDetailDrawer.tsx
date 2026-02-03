import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { useUpdateProperty } from "@/hooks/useProperties";

interface Property {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  tax_rate: number | null;
  service_charge_rate: number | null;
  created_at: string;
}

interface PropertyDetailDrawerProps {
  property: Property | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Asia/Dubai",
  "Australia/Sydney",
];

const CURRENCIES = ["BDT", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "INR", "SGD"];

export function PropertyDetailDrawer({
  property,
  open,
  onOpenChange,
}: PropertyDetailDrawerProps) {
  const updateProperty = useUpdateProperty();

  // Form state
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [currency, setCurrency] = useState("BDT");
  const [taxRate, setTaxRate] = useState("");
  const [serviceChargeRate, setServiceChargeRate] = useState("");

  // Reset form when property changes
  useEffect(() => {
    if (property) {
      setName(property.name);
      setCode(property.code);
      setAddress(property.address || "");
      setCity(property.city || "");
      setCountry(property.country || "");
      setPhone(property.phone || "");
      setEmail(property.email || "");
      setTimezone("UTC");
      setCurrency("BDT");
      setTaxRate(property.tax_rate?.toString() || "0");
      setServiceChargeRate(property.service_charge_rate?.toString() || "0");
    }
  }, [property]);

  if (!property) return null;

  const handleSaveGeneral = () => {
    updateProperty.mutate({
      id: property.id,
      updates: {
        name,
        code,
        address: address || undefined,
        city: city || undefined,
        country: country || undefined,
        phone: phone || undefined,
        email: email || undefined,
      },
    });
  };

  const handleSaveSettings = () => {
    updateProperty.mutate({
      id: property.id,
      updates: {
        tax_rate: parseFloat(taxRate) || 0,
        service_charge_rate: parseFloat(serviceChargeRate) || 0,
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-left">{property.name}</SheetTitle>
              <p className="text-sm text-muted-foreground">{property.code}</p>
              <Badge
                variant="outline"
                className="mt-1 bg-green-500/10 text-green-500"
              >
                Active
              </Badge>
            </div>
          </div>
        </SheetHeader>

        <Separator className="my-6" />

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6 mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Property Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Grand Hotel"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Property Code *</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="GH"
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="New York"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="USA"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555-0100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hotel@example.com"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleSaveGeneral}
              disabled={updateProperty.isPending || !name || !code}
              className="w-full"
            >
              {updateProperty.isPending ? "Saving..." : "Save General Info"}
            </Button>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6 mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((curr) => (
                        <SelectItem key={curr} value={curr}>
                          {curr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    placeholder="10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceChargeRate">Service Charge (%)</Label>
                  <Input
                    id="serviceChargeRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={serviceChargeRate}
                    onChange={(e) => setServiceChargeRate(e.target.value)}
                    placeholder="5"
                  />
                </div>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <h4 className="text-sm font-medium mb-2">Rate Configuration</h4>
                <p className="text-xs text-muted-foreground">
                  Tax Rate and Service Charge will be automatically applied to
                  guest folios. These rates can be overridden at the reservation
                  level if needed.
                </p>
              </div>
            </div>

            <Button
              onClick={handleSaveSettings}
              disabled={updateProperty.isPending}
              className="w-full"
            >
              {updateProperty.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
