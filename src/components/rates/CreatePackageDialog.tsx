import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { usePackages, type PackageAdjustmentType } from '@/hooks/usePackages';
import type { RoomType } from '@/hooks/useRoomTypes';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required').max(20),
  description: z.string().optional(),
  price_adjustment: z.coerce.number().min(0),
  adjustment_type: z.enum(['fixed', 'percentage']),
  valid_from: z.date().optional().nullable(),
  valid_until: z.date().optional().nullable(),
  min_nights: z.coerce.number().min(1).default(1),
  inclusions: z.array(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    icon: z.string().optional(),
  })).optional(),
  applicable_room_types: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreatePackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomTypes: RoomType[];
}

const iconOptions = [
  { value: 'breakfast', label: '🍳 Breakfast' },
  { value: 'dinner', label: '🍽️ Dinner' },
  { value: 'spa', label: '💆 Spa' },
  { value: 'transfer', label: '🚗 Transfer' },
  { value: 'gift', label: '🎁 Gift' },
  { value: 'wifi', label: '📶 WiFi' },
  { value: 'parking', label: '🅿️ Parking' },
  { value: 'drink', label: '🍹 Drinks' },
];

export default function CreatePackageDialog({ open, onOpenChange, roomTypes }: CreatePackageDialogProps) {
  const { createPackage } = usePackages();
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<string[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      price_adjustment: 0,
      adjustment_type: 'fixed',
      min_nights: 1,
      inclusions: [],
      applicable_room_types: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'inclusions',
  });

  const onSubmit = async (values: FormValues) => {
    // Filter out inclusions with empty names
    const validInclusions = (values.inclusions || [])
      .filter(inc => inc.name && inc.name.trim() !== '')
      .map(inc => ({
        name: inc.name,
        description: inc.description,
        icon: inc.icon,
      }));

    await createPackage.mutateAsync();
    
    form.reset();
    setSelectedRoomTypes([]);
    onOpenChange(false);
  };

  const toggleRoomType = (id: string) => {
    setSelectedRoomTypes(prev => 
      prev.includes(id) 
        ? prev.filter(r => r !== id)
        : [...prev, id]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Package</DialogTitle>
          <DialogDescription>
            Create a bundled package offering with inclusions.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Package Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Honeymoon Special" {...field} />
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
                        placeholder="e.g., HONEYMOON" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe what's included in this package..." 
                      rows={2}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="adjustment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed Amount Add-on</SelectItem>
                        <SelectItem value="percentage">Percentage Add-on</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price_adjustment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {form.watch('adjustment_type') === 'fixed' ? 'Add-on Amount' : 'Add-on %'}
                    </FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="min_nights"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Nights</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
                  </FormControl>
                  <FormDescription>
                    Minimum stay required for this package
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valid_from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid From</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? format(field.value, 'PPP') : 'Always'}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valid_until"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid Until</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? format(field.value, 'PPP') : 'Always'}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Inclusions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Inclusions</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ name: '', description: '', icon: '' })}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name={`inclusions.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="e.g., Breakfast" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`inclusions.${index}.icon`}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Icon" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {iconOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Room Types */}
            <div className="space-y-2">
              <FormLabel>Applicable Room Types</FormLabel>
              <div className="flex flex-wrap gap-2">
                {roomTypes.map((rt) => (
                  <div key={rt.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`rt-${rt.id}`}
                      checked={selectedRoomTypes.includes(rt.id)}
                      onCheckedChange={() => toggleRoomType(rt.id)}
                    />
                    <label htmlFor={`rt-${rt.id}`} className="text-sm cursor-pointer">
                      {rt.name}
                    </label>
                  </div>
                ))}
              </div>
              <FormDescription>
                Leave empty to apply to all room types
              </FormDescription>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createPackage.isPending}>
                {createPackage.isPending ? 'Creating...' : 'Create Package'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
