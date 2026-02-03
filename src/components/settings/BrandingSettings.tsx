import { useState, useEffect, useRef } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Upload, Save, Loader2, X, ImageIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { toast } from 'sonner';

export default function BrandingSettings() {
  const { branding, settings, updateBranding, updateBrandingSettings, isUpdating } = useSettings();
  const { tenant } = useTenant();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [name, setName] = useState(branding.name);
  const [logoUrl, setLogoUrl] = useState(branding.logo_url || '');
  const [contactEmail, setContactEmail] = useState(branding.contact_email || '');
  const [contactPhone, setContactPhone] = useState(branding.contact_phone || '');
  const [isUploading, setIsUploading] = useState(false);
  
  // Branding settings
  const [primaryColor, setPrimaryColor] = useState(settings.branding?.primary_color || '#3B82F6');
  const [secondaryColor, setSecondaryColor] = useState(settings.branding?.secondary_color || '#10B981');
  const [logoPosition, setLogoPosition] = useState(settings.branding?.logo_position || 'left');
  const [showPoweredBy, setShowPoweredBy] = useState(settings.branding?.show_powered_by ?? true);

  useEffect(() => {
    setName(branding.name);
    setLogoUrl(branding.logo_url || '');
    setContactEmail(branding.contact_email || '');
    setContactPhone(branding.contact_phone || '');
    setPrimaryColor(settings.branding?.primary_color || '#3B82F6');
    setSecondaryColor(settings.branding?.secondary_color || '#10B981');
    setLogoPosition(settings.branding?.logo_position || 'left');
    setShowPoweredBy(settings.branding?.show_powered_by ?? true);
  }, [branding, settings]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !tenant?.id) {
      console.error('Upload failed: Missing file or tenant', { hasFile: !!file, tenantId: tenant?.id });
      toast.error('Unable to upload: Missing tenant information');
      return;
    }

    console.log('Starting file upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      tenantId: tenant.id
    });

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, GIF, WebP, or SVG)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${tenant.id}/logo-${Date.now()}.${fileExt}`;
      
      console.log('Uploading to path:', fileName);

      // Delete old logo if exists
      if (logoUrl) {
        const oldPath = logoUrl.split('/hotel-logos/')[1];
        if (oldPath) {
          console.log('Removing old logo:', oldPath);
          await supabase.storage.from('hotel-logos').remove([oldPath]);
        }
      }

      // Upload new logo
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('hotel-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }
      
      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('hotel-logos')
        .getPublicUrl(fileName);
      
      console.log('Generated public URL:', urlData.publicUrl);

      setLogoUrl(urlData.publicUrl);
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload logo';
      toast.error(`Upload failed: ${errorMessage}`);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!logoUrl || !tenant?.id) return;

    try {
      const oldPath = logoUrl.split('/hotel-logos/')[1];
      if (oldPath) {
        await supabase.storage.from('hotel-logos').remove([oldPath]);
      }
      setLogoUrl('');
      toast.success('Logo removed');
    } catch (error) {
      console.error('Error removing logo:', error);
      toast.error('Failed to remove logo');
    }
  };

  const handleSave = async () => {
    // Update tenant branding
    await updateBranding.mutateAsync({
      name,
      logo_url: logoUrl || null,
      contact_email: contactEmail || null,
      contact_phone: contactPhone || null,
    });

    // Update branding settings
    await updateBrandingSettings({
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      logo_position: logoPosition as 'left' | 'center',
      show_powered_by: showPoweredBy,
    });
  };

  return (
    <div className="space-y-6">
      {/* Organization Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Information
          </CardTitle>
          <CardDescription>
            Basic information about your organization that appears across the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Logo Upload Section */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                <Avatar className="h-28 w-28 border-2 border-dashed border-muted-foreground/30">
                  <AvatarImage src={logoUrl} alt={name} className="object-cover" />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {name ? name.substring(0, 2).toUpperCase() : <ImageIcon className="h-10 w-10 text-muted-foreground" />}
                  </AvatarFallback>
                </Avatar>
                {logoUrl && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleRemoveLogo}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="flex flex-col items-center gap-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {isUploading ? 'Uploading...' : 'Upload Logo'}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Max 5MB • JPG, PNG, GIF, WebP, SVG
                </p>
              </div>
            </div>

            {/* Name and Contact Fields */}
            <div className="flex-1 space-y-4 w-full">
              <div className="grid gap-2">
                <Label htmlFor="name">Hotel/Organization Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Hotel Name"
                  className="text-lg font-medium bg-white dark:bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  This name will appear in the sidebar and dashboard
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contact@yourhotel.com"
                className="bg-white dark:bg-background"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+880 1XXX-XXXXXX"
                className="bg-white dark:bg-background"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visual Branding */}
      <Card>
        <CardHeader>
          <CardTitle>Visual Branding</CardTitle>
          <CardDescription>
            Customize the look and feel of your application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-14 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-14 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#10B981"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="logoPosition">Logo Position</Label>
            <Select value={logoPosition} onValueChange={(v) => setLogoPosition(v as 'left' | 'center')}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="space-y-0.5">
              <Label htmlFor="poweredBy">Show "Powered by" Badge</Label>
              <p className="text-sm text-muted-foreground">
                Display branding badge in the footer
              </p>
            </div>
            <Switch
              id="poweredBy"
              checked={showPoweredBy}
              onCheckedChange={setShowPoweredBy}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isUpdating || isUploading} className="gap-2">
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
