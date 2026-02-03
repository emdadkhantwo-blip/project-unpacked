import { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bell, Mail, Save, Loader2, Clock } from 'lucide-react';

export default function NotificationSettings() {
  const { settings, updateNotificationSettings, isUpdating } = useSettings();
  
  // Notification settings
  const [emailNewReservation, setEmailNewReservation] = useState(
    settings.notifications?.email_new_reservation ?? true
  );
  const [emailCheckIn, setEmailCheckIn] = useState(
    settings.notifications?.email_check_in ?? true
  );
  const [emailCheckOut, setEmailCheckOut] = useState(
    settings.notifications?.email_check_out ?? true
  );
  const [emailPaymentReceived, setEmailPaymentReceived] = useState(
    settings.notifications?.email_payment_received ?? true
  );
  const [emailDailyReport, setEmailDailyReport] = useState(
    settings.notifications?.email_daily_report ?? false
  );
  const [dailyReportTime, setDailyReportTime] = useState(
    settings.notifications?.daily_report_time || '08:00'
  );

  useEffect(() => {
    setEmailNewReservation(settings.notifications?.email_new_reservation ?? true);
    setEmailCheckIn(settings.notifications?.email_check_in ?? true);
    setEmailCheckOut(settings.notifications?.email_check_out ?? true);
    setEmailPaymentReceived(settings.notifications?.email_payment_received ?? true);
    setEmailDailyReport(settings.notifications?.email_daily_report ?? false);
    setDailyReportTime(settings.notifications?.daily_report_time || '08:00');
  }, [settings]);

  const handleSave = async () => {
    await updateNotificationSettings({
      email_new_reservation: emailNewReservation,
      email_check_in: emailCheckIn,
      email_check_out: emailCheckOut,
      email_payment_received: emailPaymentReceived,
      email_daily_report: emailDailyReport,
      daily_report_time: dailyReportTime,
    });
  };

  const NotificationItem = ({
    id,
    title,
    description,
    checked,
    onCheckedChange,
  }: {
    id: string;
    title: string;
    description: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
  }) => (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="font-medium cursor-pointer">
          {title}
        </Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Configure which events trigger email notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <NotificationItem
            id="newReservation"
            title="New Reservation"
            description="Receive an email when a new reservation is created"
            checked={emailNewReservation}
            onCheckedChange={setEmailNewReservation}
          />
          <NotificationItem
            id="checkIn"
            title="Guest Check-in"
            description="Receive an email when a guest checks in"
            checked={emailCheckIn}
            onCheckedChange={setEmailCheckIn}
          />
          <NotificationItem
            id="checkOut"
            title="Guest Check-out"
            description="Receive an email when a guest checks out"
            checked={emailCheckOut}
            onCheckedChange={setEmailCheckOut}
          />
          <NotificationItem
            id="paymentReceived"
            title="Payment Received"
            description="Receive an email when a payment is recorded"
            checked={emailPaymentReceived}
            onCheckedChange={setEmailPaymentReceived}
          />
        </CardContent>
      </Card>

      {/* Daily Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Scheduled Reports
          </CardTitle>
          <CardDescription>
            Configure automated report delivery
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="space-y-0.5">
              <Label htmlFor="dailyReport" className="font-medium cursor-pointer">
                Daily Summary Report
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive a daily summary of reservations, revenue, and occupancy
              </p>
            </div>
            <Switch
              id="dailyReport"
              checked={emailDailyReport}
              onCheckedChange={setEmailDailyReport}
            />
          </div>

          {emailDailyReport && (
            <div className="ml-4 p-4 rounded-lg border border-dashed bg-muted/30">
              <div className="grid gap-2 max-w-xs">
                <Label htmlFor="reportTime">Report Delivery Time</Label>
                <Input
                  id="reportTime"
                  type="time"
                  value={dailyReportTime}
                  onChange={(e) => setDailyReportTime(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Reports will be sent at this time daily (in your local timezone)
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Future: In-App Notifications */}
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            In-App Notifications
            <span className="ml-2 text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">
              Coming Soon
            </span>
          </CardTitle>
          <CardDescription>
            Real-time notifications within the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            In-app notifications will be available in a future update.
          </p>
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
