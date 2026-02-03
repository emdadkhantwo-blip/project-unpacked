import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRatePeriods, type RatePeriodType, type RateAdjustmentType } from '@/hooks/useRatePeriods';
import type { RoomType } from '@/hooks/useRoomTypes';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  room_type_id: z.string().optional(),
  rate_type: z.enum(['weekend', 'seasonal', 'event', 'last_minute', 'holiday']),
  amount: z.coerce.number(),
  adjustment_type: z.enum(['fixed', 'percentage', 'override']),
  start_date: z.date().optional().nullable(),
  end_date: z.date().optional().nullable(),
  days_of_week: z.array(z.number()).optional(),
  priority: z.coerce.number().min(1).max(100).default(1),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateRatePeriodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomTypes: RoomType[];
}

const daysOfWeek = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function CreateRatePeriodDialog({ open, onOpenChange, roomTypes }: CreateRatePeriodDialogProps) {
  const { createRatePeriod } = useRatePeriods();
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      rate_type: 'seasonal',
      amount: 0,
      adjustment_type: 'override',
      priority: 1,
      days_of_week: [],
    },
  });

  const rateType = form.watch('rate_type');
  const adjustmentType = form.watch('adjustment_type');

  const onSubmit = async (values: FormValues) => {
    await createRatePeriod.mutateAsync();
    
    form.reset();
    setSelectedDays([]);
    onOpenChange(false);
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Rate Period</DialogTitle>
          <DialogDescription>
            Define a dynamic pricing rule for your room rates.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Weekend Premium" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="room_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="All Room Types" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">All Room Types</SelectItem>
                      {roomTypes.map((rt) => (
                        <SelectItem key={rt.id} value={rt.id}>
                          {rt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rate_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="seasonal">Seasonal</SelectItem>
                      <SelectItem value="weekend">Weekend</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="holiday">Holiday</SelectItem>
                      <SelectItem value="last_minute">Last Minute</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {rateType === 'weekend' && 'Select specific days of the week'}
                    {rateType === 'seasonal' && 'Define a date range for this rate'}
                    {rateType === 'event' && 'For special events or conferences'}
                    {rateType === 'holiday' && 'For public holidays'}
                    {rateType === 'last_minute' && 'For bookings close to check-in date'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {rateType === 'weekend' && (
              <div className="space-y-2">
                <FormLabel>Days of Week</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day.value}`}
                        checked={selectedDays.includes(day.value)}
                        onCheckedChange={() => toggleDay(day.value)}
                      />
                      <label htmlFor={`day-${day.value}`} className="text-sm cursor-pointer">
                        {day.label.slice(0, 3)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rateType !== 'weekend' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
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
                              {field.value ? format(field.value, 'PPP') : 'Pick a date'}
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
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
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
                              {field.value ? format(field.value, 'PPP') : 'Pick a date'}
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
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="adjustment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adjustment Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="override">Override (set exact rate)</SelectItem>
                        <SelectItem value="fixed">Fixed (add/subtract amount)</SelectItem>
                        <SelectItem value="percentage">Percentage (increase/decrease %)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {adjustmentType === 'override' && 'Rate Amount'}
                      {adjustmentType === 'fixed' && 'Adjustment Amount'}
                      {adjustmentType === 'percentage' && 'Percentage (%)'}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step={adjustmentType === 'percentage' ? '0.1' : '1'}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      {adjustmentType === 'fixed' && 'Use negative for discount'}
                      {adjustmentType === 'percentage' && 'Use negative for discount (e.g., -10 for 10% off)'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max="100" {...field} />
                  </FormControl>
                  <FormDescription>
                    Higher priority rates override lower priority rates (1-100)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createRatePeriod.isPending}>
                {createRatePeriod.isPending ? 'Creating...' : 'Create Rate Period'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
