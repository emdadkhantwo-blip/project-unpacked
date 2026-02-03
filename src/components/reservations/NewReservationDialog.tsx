import { useState, useMemo, useEffect, useCallback } from "react";
import type { DateRange } from "react-day-picker";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, differenceInDays } from "date-fns";
import { CalendarIcon, Plus, Trash2, Tags, Percent, Upload, X, FileText, AlertCircle, Building2 } from "lucide-react";
import { toast } from "sonner";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { GuestSearchSelect } from "./GuestSearchSelect";
import { CreateGuestDialog } from "./CreateGuestDialog";
import { useRoomTypes } from "@/hooks/useRoomTypes";
import { useRooms } from "@/hooks/useRooms";
import { useCreateReservation } from "@/hooks/useCreateReservation";
import { useActiveReferences, calculateDiscount, type Reference } from "@/hooks/useReferences";
import { useCorporateAccountById, useGuestCorporateAccounts, type CorporateAccount } from "@/hooks/useCorporateAccounts";
import { formatCurrency } from "@/lib/currency";
import type { Guest } from "@/hooks/useGuests";

const reservationSchema = z.object({
  guest_id: z.string().min(1, "Guest is required"),
  check_in_date: z.date({ required_error: "Check-in date is required" }),
  check_out_date: z.date({ required_error: "Check-out date is required" }),
  adults: z.number().min(1, "At least 1 adult required"),
  children: z.number().min(0),
  source: z.string().min(1, "Booking source is required"),
  special_requests: z.string().optional(),
  internal_notes: z.string().optional(),
}).refine((data) => data.check_out_date > data.check_in_date, {
  message: "Check-out must be after check-in",
  path: ["check_out_date"],
});

type ReservationFormData = z.infer<typeof reservationSchema>;

interface RoomSelection {
  id: string;
  room_type_id: string;
  rate_per_night: number;
  adults: number;
  children: number;
}

interface NewReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const bookingSources = [
  { value: "direct", label: "Direct" },
  { value: "phone", label: "Phone" },
  { value: "walk_in", label: "Walk-in" },
  { value: "website", label: "Website" },
  { value: "ota_booking", label: "Booking.com" },
  { value: "ota_expedia", label: "Expedia" },
  { value: "ota_agoda", label: "Agoda" },
  { value: "corporate", label: "Corporate" },
  { value: "travel_agent", label: "Travel Agent" },
  { value: "other", label: "Other" },
];

export function NewReservationDialog({ open, onOpenChange }: NewReservationDialogProps) {
  const navigate = useNavigate();
  const { data: roomTypes, isLoading: isLoadingRoomTypes } = useRoomTypes();
  const { data: allRooms } = useRooms();
  const { data: references } = useActiveReferences();
  const createReservation = useCreateReservation();

  const hasRoomTypes = (roomTypes?.length || 0) > 0;
  const hasRooms = (allRooms?.length || 0) > 0;

  const [createGuestOpen, setCreateGuestOpen] = useState(false);
  const [selectedReference, setSelectedReference] = useState<Reference | null>(null);
  const [selectedRooms, setSelectedRooms] = useState<RoomSelection[]>([
    { id: crypto.randomUUID(), room_type_id: "", rate_per_night: 0, adults: 1, children: 0 },
  ]);
  const [guestIdFiles, setGuestIdFiles] = useState<Map<number, { file: File; preview: string; type: string; fileName: string }>>(new Map());
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [selectedCorporateAccountId, setSelectedCorporateAccountId] = useState<string | null>(null);

  // Fetch all corporate accounts linked to the guest
  const { data: guestCorporateAccounts = [] } = useGuestCorporateAccounts(selectedGuest?.id);
  
  // Fetch the selected corporate account details
  const { data: corporateAccount } = useCorporateAccountById(selectedCorporateAccountId);

  const form = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      guest_id: "",
      adults: 1,
      children: 0,
      source: "direct",
      special_requests: "",
      internal_notes: "",
    },
  });

  const checkInDate = form.watch("check_in_date");
  const checkOutDate = form.watch("check_out_date");
  const watchedAdults = form.watch("adults");
  const watchedSource = form.watch("source");

  // Cleanup object URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      guestIdFiles.forEach((fileData) => {
        if (fileData.preview.startsWith("blob:")) {
          URL.revokeObjectURL(fileData.preview);
        }
      });
    };
  }, []);

  // Remove file entries for guests that no longer exist when adults count decreases
  useEffect(() => {
    const adultsCount = watchedAdults || 1;
    const updatedFiles = new Map(guestIdFiles);
    let changed = false;
    
    updatedFiles.forEach((_, guestNumber) => {
      if (guestNumber > adultsCount) {
        const fileData = updatedFiles.get(guestNumber);
        if (fileData?.preview.startsWith("blob:")) {
          URL.revokeObjectURL(fileData.preview);
        }
        updatedFiles.delete(guestNumber);
        changed = true;
      }
    });
    
    if (changed) {
      setGuestIdFiles(updatedFiles);
    }
  }, [watchedAdults]);

  // Auto-calculate totals from room selections
  useEffect(() => {
    const totalAdults = selectedRooms.reduce((sum, room) => sum + (room.adults || 0), 0);
    const totalChildren = selectedRooms.reduce((sum, room) => sum + (room.children || 0), 0);
    
    form.setValue("adults", Math.max(1, totalAdults));
    form.setValue("children", totalChildren);
  }, [selectedRooms, form]);

  const nights = useMemo(() => {
    if (!checkInDate || !checkOutDate) return 0;
    return Math.max(0, differenceInDays(checkOutDate, checkInDate));
  }, [checkInDate, checkOutDate]);

  const subtotal = useMemo(() => {
    return selectedRooms.reduce((sum, room) => sum + room.rate_per_night * nights, 0);
  }, [selectedRooms, nights]);

  const discountAmount = useMemo(() => {
    return calculateDiscount(selectedReference, subtotal);
  }, [selectedReference, subtotal]);

  // Calculate corporate discount when source is corporate and guest has corporate account
  const corporateDiscountAmount = useMemo(() => {
    if (watchedSource === "corporate" && corporateAccount && corporateAccount.discount_percentage > 0) {
      return subtotal * (corporateAccount.discount_percentage / 100);
    }
    return 0;
  }, [watchedSource, corporateAccount, subtotal]);

  // Use corporate discount if applicable, otherwise use reference discount
  const effectiveDiscountAmount = useMemo(() => {
    if (watchedSource === "corporate" && corporateDiscountAmount > 0) {
      return corporateDiscountAmount;
    }
    return discountAmount;
  }, [watchedSource, corporateDiscountAmount, discountAmount]);

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - effectiveDiscountAmount);
  }, [subtotal, effectiveDiscountAmount]);

  const handleGuestSelect = (guest: Guest | null) => {
    form.setValue("guest_id", guest?.id || "");
    setSelectedGuest(guest);
    // Reset corporate account selection when guest changes
    setSelectedCorporateAccountId(null);
  };

  // Auto-select corporate account when guest's corporate accounts are loaded
  // If only one account, auto-select it. If multiple, user must choose.
  useMemo(() => {
    if (watchedSource === "corporate" && guestCorporateAccounts.length > 0 && !selectedCorporateAccountId) {
      // Auto-select if there's only one account, or select the primary one
      const primaryAccount = guestCorporateAccounts.find(a => a.is_primary);
      if (guestCorporateAccounts.length === 1) {
        setSelectedCorporateAccountId(guestCorporateAccounts[0].id);
      } else if (primaryAccount) {
        setSelectedCorporateAccountId(primaryAccount.id);
      }
    }
  }, [watchedSource, guestCorporateAccounts, selectedCorporateAccountId]);

  const handleGuestCreated = (guest: Guest) => {
    form.setValue("guest_id", guest.id);
    setSelectedGuest(guest);
    setSelectedCorporateAccountId(null);
  };

  const addRoom = () => {
    setSelectedRooms([
      ...selectedRooms,
      { id: crypto.randomUUID(), room_type_id: "", rate_per_night: 0, adults: 1, children: 0 },
    ]);
  };

  const removeRoom = (id: string) => {
    if (selectedRooms.length > 1) {
      setSelectedRooms(selectedRooms.filter((r) => r.id !== id));
    }
  };

  const updateRoom = (id: string, updates: Partial<RoomSelection>) => {
    setSelectedRooms(
      selectedRooms.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, ...updates };
        
        // Auto-set rate when room type changes
        if (updates.room_type_id) {
          const roomType = roomTypes?.find((rt) => rt.id === updates.room_type_id);
          if (roomType) {
            updated.rate_per_night = roomType.base_rate;
          }
        }
        return updated;
      })
    );
  };

  const handleReferenceChange = (referenceId: string) => {
    if (referenceId === "none") {
      setSelectedReference(null);
    } else {
      const ref = references?.find((r) => r.id === referenceId) || null;
      setSelectedReference(ref);
    }
  };

  const handleIdUpload = (guestNumber: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload an image (JPEG, PNG, WebP) or PDF.");
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("File too large. Maximum size is 5MB.");
      return;
    }

    const fileType = file.type === "application/pdf" ? "pdf" : "image";
    const preview = fileType === "image" ? URL.createObjectURL(file) : "";

    const updatedFiles = new Map(guestIdFiles);
    
    // Revoke old preview URL if exists
    const oldFile = updatedFiles.get(guestNumber);
    if (oldFile?.preview.startsWith("blob:")) {
      URL.revokeObjectURL(oldFile.preview);
    }

    updatedFiles.set(guestNumber, {
      file,
      preview,
      type: fileType,
      fileName: file.name,
    });
    setGuestIdFiles(updatedFiles);
  };

  const removeIdFile = (guestNumber: number) => {
    const updatedFiles = new Map(guestIdFiles);
    const fileData = updatedFiles.get(guestNumber);
    
    if (fileData?.preview.startsWith("blob:")) {
      URL.revokeObjectURL(fileData.preview);
    }
    
    updatedFiles.delete(guestNumber);
    setGuestIdFiles(updatedFiles);
  };

  const [idValidationError, setIdValidationError] = useState<string | null>(null);

  const onSubmit = async (data: ReservationFormData) => {
    // Validate rooms
    const validRooms = selectedRooms.filter((r) => r.room_type_id);
    if (validRooms.length === 0) {
      return;
    }

    // Validate that all adult guests have ID documents uploaded
    const adultsCount = data.adults || 1;
    const missingIds: number[] = [];
    for (let i = 1; i <= adultsCount; i++) {
      if (!guestIdFiles.has(i)) {
        missingIds.push(i);
      }
    }
    
    if (missingIds.length > 0) {
      setIdValidationError(
        `Please upload ID documents for all guests. Missing: Guest ${missingIds.join(", Guest ")}`
      );
      toast.error("Guest ID documents are required for all adult guests");
      return;
    }
    
    setIdValidationError(null);

    // Convert Map to format expected by hook
    const idFilesForUpload = new Map<number, { file: File; type: string; fileName: string }>();
    guestIdFiles.forEach((fileData, guestNumber) => {
      idFilesForUpload.set(guestNumber, {
        file: fileData.file,
        type: fileData.type,
        fileName: fileData.fileName,
      });
    });

    try {
      await createReservation.mutateAsync({
        guest_id: data.guest_id,
        check_in_date: format(data.check_in_date, "yyyy-MM-dd"),
        check_out_date: format(data.check_out_date, "yyyy-MM-dd"),
        adults: data.adults,
        children: data.children,
        source: data.source,
        special_requests: data.special_requests,
        internal_notes: data.internal_notes,
        reference_id: watchedSource === "corporate" && corporateDiscountAmount > 0 ? undefined : selectedReference?.id,
        discount_amount: effectiveDiscountAmount,
        rooms: validRooms.map((r) => ({
          room_type_id: r.room_type_id,
          rate_per_night: r.rate_per_night,
          adults: r.adults,
          children: r.children,
        })),
        idFiles: idFilesForUpload.size > 0 ? idFilesForUpload : undefined,
      });
      
      // Reset form and close
      form.reset();
      setSelectedReference(null);
      setSelectedRooms([{ id: crypto.randomUUID(), room_type_id: "", rate_per_night: 0, adults: 1, children: 0 }]);
      setSelectedGuest(null);
      setSelectedCorporateAccountId(null);
      
      // Cleanup file previews
      guestIdFiles.forEach((fileData) => {
        if (fileData.preview.startsWith("blob:")) {
          URL.revokeObjectURL(fileData.preview);
        }
      });
      setGuestIdFiles(new Map());
      
      onOpenChange(false);
    } catch (error) {
      // Error handled in mutation
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>New Reservation</DialogTitle>
            <DialogDescription>
              Create a new reservation for a guest. Select dates, room type, and enter guest details.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Room Setup Required Alert */}
              {!isLoadingRoomTypes && !hasRoomTypes && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Room Types Required</AlertTitle>
                  <AlertDescription className="flex flex-col gap-2">
                    <span>You need to create room types before making reservations.</span>
                    <Button 
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-fit"
                      onClick={() => {
                        onOpenChange(false);
                        navigate('/rooms');
                      }}
                    >
                      Go to Rooms Setup →
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* No Physical Rooms Warning */}
              {hasRoomTypes && !hasRooms && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Rooms Created</AlertTitle>
                  <AlertDescription>
                    Room types exist, but no physical rooms have been added yet. 
                    Reservations can be made, but check-in will require rooms to be created first.
                  </AlertDescription>
                </Alert>
              )}

              {/* Guest Selection */}
              <FormField
                control={form.control}
                name="guest_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guest *</FormLabel>
                    <FormControl>
                      <GuestSearchSelect
                        value={field.value}
                        onSelect={handleGuestSelect}
                        onCreateNew={() => setCreateGuestOpen(true)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Stay Dates - Single Calendar Range Picker */}
              <FormItem className="flex flex-col">
                <FormLabel>Stay Dates *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !checkInDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {checkInDate && checkOutDate ? (
                        <>
                          {format(checkInDate, "MMM d, yyyy")} – {format(checkOutDate, "MMM d, yyyy")}
                        </>
                      ) : checkInDate ? (
                        <>
                          {format(checkInDate, "MMM d, yyyy")} – Select end date
                        </>
                      ) : (
                        <span>Select stay dates</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={
                        checkInDate
                          ? { from: checkInDate, to: checkOutDate }
                          : undefined
                      }
                      onSelect={(range: DateRange | undefined) => {
                        form.setValue("check_in_date", range?.from as Date);
                        form.setValue("check_out_date", range?.to as Date);
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      numberOfMonths={2}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {nights > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {nights} night{nights !== 1 ? "s" : ""}
                  </p>
                )}
                <FormMessage />
              </FormItem>

              {/* Room Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel>Rooms *</FormLabel>
                  <Button type="button" variant="outline" size="sm" onClick={addRoom}>
                    <Plus className="mr-1 h-3 w-3" />
                    Add Room
                  </Button>
                </div>

                {selectedRooms.map((room, index) => (
                  <Card key={room.id}>
                    <CardContent className="grid grid-cols-12 gap-3 p-3">
                      <div className="col-span-4">
                        <FormLabel className="text-xs">Room Type</FormLabel>
                        <Select
                          value={room.room_type_id}
                          onValueChange={(v) => updateRoom(room.id, { room_type_id: v })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {roomTypes?.map((rt) => (
                              <SelectItem key={rt.id} value={rt.id}>
                                {rt.name} - ৳{rt.base_rate}/night
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <FormLabel className="text-xs">Rate/Night</FormLabel>
                        <Input
                          type="number"
                          className="mt-1"
                          value={room.rate_per_night}
                          onChange={(e) =>
                            updateRoom(room.id, { rate_per_night: parseFloat(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <FormLabel className="text-xs">Adults</FormLabel>
                        <Input
                          type="number"
                          min={1}
                          className="mt-1"
                          value={room.adults}
                          onChange={(e) =>
                            updateRoom(room.id, { adults: parseInt(e.target.value) || 1 })
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <FormLabel className="text-xs">Children</FormLabel>
                        <Input
                          type="number"
                          min={0}
                          className="mt-1"
                          value={room.children}
                          onChange={(e) =>
                            updateRoom(room.id, { children: parseInt(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div className="col-span-2 flex items-end justify-end">
                        {selectedRooms.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRoom(room.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Guest Count & Source */}
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="adults"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Adults</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...field}
                          readOnly
                          className="bg-muted"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="children"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Children</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          readOnly
                          className="bg-muted"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Booking Source</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {bookingSources.map((source) => (
                            <SelectItem key={source.value} value={source.value}>
                              {source.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Corporate Account Info Card */}
              {watchedSource === "corporate" && selectedGuest && (
                <div className="space-y-3">
                  {guestCorporateAccounts.length > 0 ? (
                    <>
                      {/* Corporate Account Selector - show when multiple accounts */}
                      {guestCorporateAccounts.length > 1 && (
                        <div className="space-y-2">
                          <FormLabel>Select Corporate Account</FormLabel>
                          <Select
                            value={selectedCorporateAccountId || ""}
                            onValueChange={setSelectedCorporateAccountId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a corporate account..." />
                            </SelectTrigger>
                            <SelectContent>
                              {guestCorporateAccounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-blue-500" />
                                    <span>{account.company_name}</span>
                                    <Badge variant="outline" className="ml-1 text-xs">
                                      {account.account_code}
                                    </Badge>
                                    {account.discount_percentage > 0 && (
                                      <Badge variant="secondary" className="text-xs">
                                        {account.discount_percentage}% off
                                      </Badge>
                                    )}
                                    {account.is_primary && (
                                      <Badge className="text-xs bg-primary/10 text-primary">
                                        Primary
                                      </Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Corporate Account Details Card */}
                      {corporateAccount && (
                        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Building2 className="h-5 w-5 text-blue-500" />
                              <span className="font-semibold">Corporate Account</span>
                              {guestCorporateAccounts.length > 1 && (
                                <Badge variant="outline" className="ml-auto text-xs">
                                  {guestCorporateAccounts.length} accounts linked
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-muted-foreground">Company:</span>
                                <span className="ml-2 font-medium">{corporateAccount.company_name}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Account Code:</span>
                                <span className="ml-2 font-medium">{corporateAccount.account_code}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Discount:</span>
                                <span className="ml-2 font-medium">
                                  {corporateAccount.discount_percentage > 0 
                                    ? `${corporateAccount.discount_percentage}%` 
                                    : "None"}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Credit Limit:</span>
                                <span className="ml-2 font-medium">
                                  {corporateAccount.credit_limit > 0 
                                    ? formatCurrency(corporateAccount.credit_limit) 
                                    : "Unlimited"}
                                </span>
                              </div>
                            </div>
                            {corporateAccount.discount_percentage > 0 && (
                              <Badge variant="secondary" className="mt-3 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                                <Percent className="h-3 w-3 mr-1" />
                                {corporateAccount.discount_percentage}% discount will be auto-applied
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {/* Prompt to select when multiple accounts exist but none selected */}
                      {guestCorporateAccounts.length > 1 && !selectedCorporateAccountId && (
                        <Alert>
                          <Building2 className="h-4 w-4" />
                          <AlertTitle>Multiple Corporate Accounts</AlertTitle>
                          <AlertDescription>
                            This guest is linked to {guestCorporateAccounts.length} corporate accounts. Please select one to apply the corporate rate.
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No Corporate Account</AlertTitle>
                      <AlertDescription>
                        This guest is not linked to any corporate account. You can link them from the Guests page.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Reference Selection - hide if corporate discount is applied */}
              {references && references.length > 0 && !(watchedSource === "corporate" && corporateDiscountAmount > 0) && (
                <div className="space-y-2">
                  <FormLabel>Reference (Optional)</FormLabel>
                  <Select
                    value={selectedReference?.id || "none"}
                    onValueChange={handleReferenceChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select reference for discount..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No reference</SelectItem>
                      {references.map((ref) => (
                        <SelectItem key={ref.id} value={ref.id}>
                          <div className="flex items-center gap-2">
                            <Tags className="h-3 w-3" />
                            <span>{ref.name}</span>
                            <Badge variant="secondary" className="ml-1 text-xs">
                              {ref.discount_type === "percentage"
                                ? `${ref.discount_percentage}%`
                                : formatCurrency(ref.fixed_discount)}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedReference && discountAmount > 0 && (
                    <p className="flex items-center gap-1 text-sm text-vibrant-green">
                      {selectedReference.discount_type === "percentage" ? (
                        <Percent className="h-3 w-3" />
                      ) : (
                        <span className="text-xs font-bold">৳</span>
                      )}
                      Discount applied: -{formatCurrency(discountAmount)}
                    </p>
                  )}
                </div>
              )}

              {/* Guest ID Documents Upload */}
              <div className="space-y-3">
                <div>
                  <FormLabel className={idValidationError ? "text-destructive" : ""}>
                    Guest ID Documents *
                  </FormLabel>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload identification for each adult guest (JPEG, PNG, WebP, or PDF, max 5MB)
                  </p>
                  {idValidationError && (
                    <p className="text-sm font-medium text-destructive mt-1">
                      {idValidationError}
                    </p>
                  )}
                </div>

                <div className="grid gap-3">
                  {Array.from({ length: watchedAdults || 1 }, (_, i) => i + 1).map((guestNumber) => {
                    const fileData = guestIdFiles.get(guestNumber);
                    
                    return (
                      <Card key={guestNumber} className="overflow-hidden">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium min-w-[80px]">
                              Guest {guestNumber} ID
                            </span>
                            
                            {fileData ? (
                              <div className="flex items-center gap-3 flex-1">
                                {fileData.type === "image" ? (
                                  <div className="relative h-12 w-16 rounded overflow-hidden border">
                                    <img
                                      src={fileData.preview}
                                      alt={`Guest ${guestNumber} ID`}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                                <span className="text-sm text-muted-foreground truncate flex-1">
                                  {fileData.fileName}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => removeIdFile(guestNumber)}
                                >
                                  <X className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            ) : (
                              <label className="flex-1">
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp,application/pdf"
                                  className="hidden"
                                  onChange={(e) => handleIdUpload(guestNumber, e)}
                                />
                                <div className="flex items-center justify-center gap-2 py-2 px-4 border-2 border-dashed rounded-md cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors">
                                  <Upload className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">
                                    Click to upload ID
                                  </span>
                                </div>
                              </label>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="special_requests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Requests</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Guest preferences, requests..."
                          className="h-20 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="internal_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Internal Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Staff notes (not visible to guest)..."
                          className="h-20 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Total */}
              <div className="rounded-lg bg-muted p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Subtotal ({selectedRooms.filter((r) => r.room_type_id).length} room
                      {selectedRooms.length !== 1 ? "s" : ""} × {nights} night
                      {nights !== 1 ? "s" : ""})
                    </span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {/* Corporate Discount */}
                  {watchedSource === "corporate" && corporateAccount && corporateDiscountAmount > 0 && (
                    <div className="flex items-center justify-between text-sm text-vibrant-green">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {corporateAccount.company_name} ({corporateAccount.discount_percentage}%)
                      </span>
                      <span>-{formatCurrency(corporateDiscountAmount)}</span>
                    </div>
                  )}
                  {/* Reference Discount (when not using corporate) */}
                  {!(watchedSource === "corporate" && corporateDiscountAmount > 0) && selectedReference && discountAmount > 0 && (
                    <div className="flex items-center justify-between text-sm text-vibrant-green">
                      <span className="flex items-center gap-1">
                        <Tags className="h-3 w-3" />
                        {selectedReference.name} (
                        {selectedReference.discount_type === "percentage"
                          ? `${selectedReference.discount_percentage}%`
                          : "Fixed"}
                        )
                      </span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total</span>
                    <span className="text-2xl font-bold">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createReservation.isPending}>
                  {createReservation.isPending ? "Creating..." : "Create Reservation"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <CreateGuestDialog
        open={createGuestOpen}
        onOpenChange={setCreateGuestOpen}
        onGuestCreated={handleGuestCreated}
      />
    </>
  );
}
