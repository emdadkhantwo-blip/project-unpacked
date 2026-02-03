import { useTenant } from '@/hooks/useTenant';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, 
  Building2, 
  Users, 
  DoorOpen, 
  Calendar, 
  CheckCircle2,
  XCircle,
  ArrowUpRight 
} from 'lucide-react';
import { format } from 'date-fns';

export default function SubscriptionInfo() {
  const { subscription, properties, tenant } = useTenant();

  const plan = subscription?.plan;
  const planName = plan?.name || 'Free';
  const planType = plan?.plan_type || 'starter';

  // Calculate usage
  const propertiesCount = properties.length;
  const maxProperties = plan?.max_properties || 1;
  const propertiesPercent = (propertiesCount / maxProperties) * 100;

  // Mock data for staff and rooms (would come from actual queries)
  const staffCount = 1; // Would be fetched
  const maxStaff = plan?.max_staff || 10;
  const staffPercent = (staffCount / maxStaff) * 100;

  const roomsCount = 0; // Would be fetched
  const maxRooms = plan?.max_rooms || 50;
  const roomsPercent = maxRooms > 0 ? (roomsCount / maxRooms) * 100 : 0;

  // Features
  const features = plan?.features || {};

  const getPlanColor = () => {
    switch (planType) {
      case 'pro':
        return 'bg-gradient-to-r from-purple-500 to-indigo-500';
      case 'growth':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  const UsageCard = ({
    icon: Icon,
    label,
    current,
    max,
    percent,
  }: {
    icon: typeof Building2;
    label: string;
    current: number;
    max: number;
    percent: number;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span>{label}</span>
        </div>
        <span className="text-sm font-medium">
          {current} / {max}
        </span>
      </div>
      <Progress value={percent} className="h-2" />
    </div>
  );

  const FeatureItem = ({ name, enabled }: { name: string; enabled: boolean }) => (
    <div className="flex items-center gap-2 text-sm">
      {enabled ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-muted-foreground" />
      )}
      <span className={enabled ? 'text-foreground' : 'text-muted-foreground'}>
        {name}
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Current Plan
              </CardTitle>
              <CardDescription>
                Your subscription details and usage
              </CardDescription>
            </div>
            <Badge className={`${getPlanColor()} text-white border-0`}>
              {planName}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/50">
            <div>
              <p className="text-2xl font-bold">
                ৳{(plan as { price_monthly?: number })?.price_monthly || 0}
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </p>
              {(subscription as unknown as { expires_at?: string })?.expires_at && (
                <p className="text-sm text-muted-foreground">
                  Renews on {format(new Date((subscription as unknown as { expires_at: string }).expires_at), 'MMMM d, yyyy')}
                </p>
              )}
            </div>
            <Button variant="outline" className="gap-2">
              Upgrade Plan
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Usage */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Resource Usage</h4>
            <div className="grid gap-4">
              <UsageCard
                icon={Building2}
                label="Properties"
                current={propertiesCount}
                max={maxProperties}
                percent={propertiesPercent}
              />
              <UsageCard
                icon={Users}
                label="Staff Members"
                current={staffCount}
                max={maxStaff}
                percent={staffPercent}
              />
              <UsageCard
                icon={DoorOpen}
                label="Total Rooms"
                current={roomsCount}
                max={maxRooms}
                percent={roomsPercent}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Features</CardTitle>
          <CardDescription>
            Features included in your current plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FeatureItem name="Property Management (PMS)" enabled={features.pms ?? true} />
            <FeatureItem name="Guest CRM" enabled={features.crm ?? true} />
            <FeatureItem name="Point of Sale (POS)" enabled={features.pos ?? false} />
            <FeatureItem name="Advanced Reports" enabled={features.advanced_reports ?? false} />
            <FeatureItem name="Channel Manager Integration" enabled={features.channel_manager ?? false} />
            <FeatureItem name="Revenue Management" enabled={features.revenue_management ?? false} />
            <FeatureItem name="API Access" enabled={features.api_access ?? false} />
            <FeatureItem name="Priority Support" enabled={features.priority_support ?? false} />
          </div>
        </CardContent>
      </Card>

      {/* Billing History - Placeholder */}
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Billing History
            <span className="ml-2 text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">
              Coming Soon
            </span>
          </CardTitle>
          <CardDescription>
            View and download past invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Billing history and invoice downloads will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
