import { useState, useEffect, useRef } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Globe, Save, Loader2, AlertTriangle } from 'lucide-react';

const CURRENCIES = [
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
];

const TIMEZONES = [
  { value: 'Asia/Dhaka', label: 'Dhaka (BST)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Chicago', label: 'Central Time (US)' },
  { value: 'America/Denver', label: 'Mountain Time (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'Kolkata (IST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];

const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (UK/EU)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
  { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY (DE)' },
];

export default function SystemDefaultsSettings() {
  const { settings, updateDefaultSettings, isUpdating } = useSettings();
  const hasInitialized = useRef(false);
  
  // System defaults
  const [checkInTime, setCheckInTime] = useState('14:00');
  const [checkOutTime, setCheckOutTime] = useState('11:00');
  const [defaultCurrency, setDefaultCurrency] = useState('BDT');
  const [defaultTimezone, setDefaultTimezone] = useState('Asia/Dhaka');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h');
  const [cancellationHours, setCancellationHours] = useState('24');
  const [noShowCharge, setNoShowCharge] = useState('100');

  // Only sync from settings on initial load
  useEffect(() => {
    if (!hasInitialized.current && settings.defaults) {
      setCheckInTime(settings.defaults.check_in_time || '14:00');
      setCheckOutTime(settings.defaults.check_out_time || '11:00');
      setDefaultCurrency(settings.defaults.default_currency || 'BDT');
      setDefaultTimezone(settings.defaults.default_timezone || 'Asia/Dhaka');
      setDateFormat(settings.defaults.date_format || 'DD/MM/YYYY');
      setTimeFormat(settings.defaults.time_format || '12h');
      setCancellationHours(settings.defaults.cancellation_policy_hours?.toString() || '24');
      setNoShowCharge(settings.defaults.no_show_charge_percent?.toString() || '100');
      hasInitialized.current = true;
    }
  }, [settings.defaults]);

  const handleSave = async () => {
    await updateDefaultSettings({
      check_in_time: checkInTime,
      check_out_time: checkOutTime,
      default_currency: defaultCurrency,
      default_timezone: defaultTimezone,
      date_format: dateFormat,
      time_format: timeFormat,
      cancellation_policy_hours: parseInt(cancellationHours) || 24,
      no_show_charge_percent: parseInt(noShowCharge) || 100,
    });
  };

  return (
    <div className="space-y-6">
      {/* Check-in/Check-out Times */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Check-in & Check-out Times
          </CardTitle>
          <CardDescription>
            Default times for guest arrivals and departures
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <Label htmlFor="checkIn">Check-in Time</Label>
              <Input
                id="checkIn"
                type="time"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Standard arrival time for guests
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="checkOut">Check-out Time</Label>
              <Input
                id="checkOut"
                type="time"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Standard departure time for guests
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regional Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Regional Settings
          </CardTitle>
          <CardDescription>
            Currency, timezone, and date/time format preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <Label htmlFor="currency">Default Currency</Label>
              <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="timezone">Default Timezone</Label>
              <Select value={defaultTimezone} onValueChange={setDefaultTimezone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select value={dateFormat} onValueChange={setDateFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FORMATS.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="timeFormat">Time Format</Label>
              <Select value={timeFormat} onValueChange={(v) => setTimeFormat(v as '12h' | '24h')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                  <SelectItem value="24h">24-hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Cancellation & No-Show Policies
          </CardTitle>
          <CardDescription>
            Default policies for reservations (can be overridden per booking)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <Label htmlFor="cancellation">Free Cancellation Window</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="cancellation"
                  type="number"
                  min="0"
                  max="168"
                  value={cancellationHours}
                  onChange={(e) => setCancellationHours(e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">hours before check-in</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Guests can cancel without charge within this window
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="noShow">No-Show Charge</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="noShow"
                  type="number"
                  min="0"
                  max="100"
                  value={noShowCharge}
                  onChange={(e) => setNoShowCharge(e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">% of first night</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Percentage charged when guest doesn't show up
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isUpdating} className="gap-2">
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
