import { useState } from 'react';
import { useTenant } from '@/hooks/useTenant';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Bell, Settings2, Palette, Shield } from 'lucide-react';
import BrandingSettings from '@/components/settings/BrandingSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import SystemDefaultsSettings from '@/components/settings/SystemDefaultsSettings';
import SubscriptionInfo from '@/components/settings/SubscriptionInfo';

export default function SettingsPage() {
  const { tenant, isLoading } = useTenant();
  const [activeTab, setActiveTab] = useState('branding');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Configure your organization settings, branding, and preferences
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Branding</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="defaults" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Defaults</span>
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Plan</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-6">
          <BrandingSettings />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="defaults" className="space-y-6">
          <SystemDefaultsSettings />
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <SubscriptionInfo />
        </TabsContent>
      </Tabs>
    </div>
  );
}
