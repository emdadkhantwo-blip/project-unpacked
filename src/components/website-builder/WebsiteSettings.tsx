import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Globe, Palette, Search, Share2, Image, Upload } from 'lucide-react';

interface WebsiteConfig {
  id: string;
  subdomain: string;
  custom_domain: string | null;
  is_published: boolean;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  seo_title: string | null;
  seo_description: string | null;
  social_links: any;
  hero_image_url: string | null;
  logo_url: string | null;
}

interface WebsiteSettingsProps {
  config: WebsiteConfig;
  onUpdate: (data: Partial<WebsiteConfig>) => void;
}

const FONT_OPTIONS = [
  { value: 'inter', label: 'Inter (Modern)' },
  { value: 'playfair', label: 'Playfair Display (Elegant)' },
  { value: 'poppins', label: 'Poppins (Friendly)' },
  { value: 'roboto', label: 'Roboto (Clean)' },
  { value: 'lora', label: 'Lora (Classic)' },
];

export default function WebsiteSettings({ config, onUpdate }: WebsiteSettingsProps) {
  const [formData, setFormData] = useState({
    subdomain: config.subdomain || '',
    custom_domain: config.custom_domain || '',
    primary_color: config.primary_color || '#0ea5e9',
    secondary_color: config.secondary_color || '#64748b',
    font_family: config.font_family || 'inter',
    seo_title: config.seo_title || '',
    seo_description: config.seo_description || '',
    social_links: config.social_links || {},
    hero_image_url: config.hero_image_url || '',
    logo_url: config.logo_url || '',
  });

  const handleSave = () => {
    onUpdate(formData);
    toast.success('Settings saved');
  };

  return (
    <div className="space-y-6">
      {/* Domain Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Domain Settings
          </CardTitle>
          <CardDescription>Configure your website address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Subdomain</Label>
            <div className="flex">
              <Input
                value={formData.subdomain}
                onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                className="rounded-r-none"
              />
              <div className="flex items-center px-3 bg-muted border border-l-0 rounded-r-md text-sm text-muted-foreground">
                .beehotel.app
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Your website will be accessible at https://{formData.subdomain || 'yourhotel'}.beehotel.app
            </p>
          </div>

          <div className="space-y-2">
            <Label>Custom Domain (Optional)</Label>
            <Input
              value={formData.custom_domain}
              onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value })}
              placeholder="www.yourhotel.com"
            />
            <p className="text-xs text-muted-foreground">
              Contact support to set up a custom domain
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Images Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Images
          </CardTitle>
          <CardDescription>Hero background and logo images</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Hero Background Image URL</Label>
            <Input
              value={formData.hero_image_url}
              onChange={(e) => setFormData({ ...formData, hero_image_url: e.target.value })}
              placeholder="https://example.com/hero-image.jpg"
            />
            <p className="text-xs text-muted-foreground">
              Enter a URL to an image for your hero section background
            </p>
            {formData.hero_image_url && (
              <div className="mt-2 rounded-lg overflow-hidden border h-32">
                <img 
                  src={formData.hero_image_url} 
                  alt="Hero preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Logo URL</Label>
            <Input
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
            <p className="text-xs text-muted-foreground">
              Enter a URL to your hotel logo (appears in navbar)
            </p>
            {formData.logo_url && (
              <div className="mt-2 p-2 border rounded-lg bg-muted/50 inline-block">
                <img 
                  src={formData.logo_url} 
                  alt="Logo preview" 
                  className="h-8 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Branding Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Branding
          </CardTitle>
          <CardDescription>Customize your website's appearance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="w-14 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.secondary_color}
                  onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                  className="w-14 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formData.secondary_color}
                  onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Font Family</Label>
            <select
              value={formData.font_family}
              onChange={(e) => setFormData({ ...formData, font_family: e.target.value })}
              className="w-full h-10 px-3 rounded-md border border-input bg-background"
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* SEO Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            SEO Settings
          </CardTitle>
          <CardDescription>Optimize for search engines</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Page Title</Label>
            <Input
              value={formData.seo_title}
              onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
              placeholder="Your Hotel Name - Luxury Accommodation"
              maxLength={60}
            />
            <p className="text-xs text-muted-foreground">
              {formData.seo_title.length}/60 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label>Meta Description</Label>
            <Textarea
              value={formData.seo_description}
              onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
              placeholder="Describe your hotel in 160 characters..."
              maxLength={160}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {formData.seo_description.length}/160 characters
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Social Links
          </CardTitle>
          <CardDescription>Connect your social media profiles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Facebook</Label>
              <Input
                value={formData.social_links.facebook || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  social_links: { ...formData.social_links, facebook: e.target.value }
                })}
                placeholder="https://facebook.com/yourhotel"
              />
            </div>
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input
                value={formData.social_links.instagram || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  social_links: { ...formData.social_links, instagram: e.target.value }
                })}
                placeholder="https://instagram.com/yourhotel"
              />
            </div>
            <div className="space-y-2">
              <Label>Twitter/X</Label>
              <Input
                value={formData.social_links.twitter || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  social_links: { ...formData.social_links, twitter: e.target.value }
                })}
                placeholder="https://twitter.com/yourhotel"
              />
            </div>
            <div className="space-y-2">
              <Label>TripAdvisor</Label>
              <Input
                value={formData.social_links.tripadvisor || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  social_links: { ...formData.social_links, tripadvisor: e.target.value }
                })}
                placeholder="https://tripadvisor.com/yourhotel"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          Save Settings
        </Button>
      </div>
    </div>
  );
}
