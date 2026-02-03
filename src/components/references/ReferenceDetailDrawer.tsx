import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Tags, Percent, Calendar, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { useUpdateReference, useDeleteReference, type Reference } from "@/hooks/useReferences";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

const referenceSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  code: z.string().min(1, "Code is required").max(20, "Code too long"),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_percentage: z.number().min(0).max(100),
  fixed_discount: z.number().min(0),
  is_active: z.boolean(),
  notes: z.string().optional(),
});

type ReferenceFormData = z.infer<typeof referenceSchema>;

interface ReferenceDetailDrawerProps {
  reference: Reference | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReferenceDetailDrawer({
  reference,
  open,
  onOpenChange,
}: ReferenceDetailDrawerProps) {
  const updateReference = useUpdateReference();
  const deleteReference = useDeleteReference();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<ReferenceFormData>({
    resolver: zodResolver(referenceSchema),
    values: reference
      ? {
          name: reference.name,
          code: reference.code,
          discount_type: reference.discount_type as "percentage" | "fixed",
          discount_percentage: reference.discount_percentage,
          fixed_discount: reference.fixed_discount,
          is_active: reference.is_active,
          notes: reference.notes || "",
        }
      : undefined,
  });

  const discountType = form.watch("discount_type");

  const onSubmit = async (data: ReferenceFormData) => {
    if (!reference) return;

    try {
      await updateReference.mutateAsync({
        id: reference.id,
        name: data.name,
        code: data.code,
        discount_type: data.discount_type,
        discount_percentage: data.discount_type === "percentage" ? data.discount_percentage : 0,
        fixed_discount: data.discount_type === "fixed" ? data.fixed_discount : 0,
        is_active: data.is_active,
        notes: data.notes,
      });
      setIsEditing(false);
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleDelete = async () => {
    if (!reference) return;
    try {
      await deleteReference.mutateAsync(reference.id);
      onOpenChange(false);
    } catch (error) {
      // Error handled in mutation
    }
  };

  if (!reference) return null;

  const discountDisplay =
    reference.discount_type === "percentage"
      ? `${reference.discount_percentage}%`
      : formatCurrency(reference.fixed_discount);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-[500px]">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl",
                reference.is_active
                  ? "bg-vibrant-purple/10 text-vibrant-purple"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Tags className="h-6 w-6" />
            </div>
            <div>
              <SheetTitle>{reference.name}</SheetTitle>
              <SheetDescription>{reference.code}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Quick Info */}
          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
            <div className="flex items-center gap-2">
              {reference.discount_type === "percentage" ? (
                <Percent className="h-5 w-5 text-vibrant-amber" />
              ) : (
                <span className="text-lg font-bold text-vibrant-green">৳</span>
              )}
              <span className="text-2xl font-bold">{discountDisplay}</span>
              <span className="text-muted-foreground">discount</span>
            </div>
            <Badge
              variant={reference.is_active ? "default" : "secondary"}
              className={cn(
                reference.is_active
                  ? "bg-vibrant-green/10 text-vibrant-green"
                  : ""
              )}
            >
              {reference.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>

          {/* Info */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Created {format(new Date(reference.created_at), "PPP")}</span>
            </div>
            {reference.notes && (
              <p className="text-muted-foreground">{reference.notes}</p>
            )}
          </div>

          <Separator />

          {/* Edit Form */}
          {isEditing ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>Code</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.value.toUpperCase())
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="discount_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed">Fixed Amount (৳)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {discountType === "percentage" ? (
                  <FormField
                    control={form.control}
                    name="discount_percentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Percentage</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              %
                            </span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="fixed_discount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fixed Discount</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              ৳
                            </span>
                            <Input
                              type="number"
                              min={0}
                              className="pl-8"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea className="resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <FormLabel className="cursor-pointer">Active</FormLabel>
                        <FormDescription className="text-xs">
                          Inactive references won't appear in booking forms
                        </FormDescription>
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

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={updateReference.isPending}
                  >
                    {updateReference.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsEditing(true)}
              >
                Edit Reference
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Reference?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the reference "{reference.name}".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
