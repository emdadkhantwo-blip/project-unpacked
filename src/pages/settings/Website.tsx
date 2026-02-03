import { useState, useEffect } from 'react';
import { useTenant } from '@/hooks/useTenant';
import { useWebsiteBuilder } from '@/hooks/useWebsiteBuilder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Globe, Layout, Image, MessageSquare, Settings, ExternalLink, Eye, Rocket } from 'lucide-react';
import WebsiteTemplateSelector from '@/components/website-builder/WebsiteTemplateSelector';
import WebsiteSectionEditor from '@/components/website-builder/WebsiteSectionEditor';
import WebsiteGalleryManager from '@/components/website-builder/WebsiteGalleryManager';
import WebsiteInquiries from '@/components/website-builder/WebsiteInquiries';
import WebsiteSettings from '@/components/website-builder/WebsiteSettings';

export default function WebsitePage() {
  const { tenant, properties, currentProperty, isLoading: tenantLoading } = useTenant();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('template');

  const { 
    websiteConfig, 
    isLoading: websiteLoading, 
    createWebsite, 
    updateWebsite,
    publishWebsite 
  } = useWebsiteBuilder();

  // Auto-select first property
  useEffect(() => {
    if (properties && properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

  const isLoading = tenantLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!properties || properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Globe className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Properties Found</h2>
        <p className="text-muted-foreground">Create a property first to build a website.</p>
      </div>
    );
  }

  const selectedProperty = properties.find(p => p.id === selectedPropertyId) || properties[0];

  const handleCreateWebsite = () => {
    createWebsite.mutate({});
  };

  const handleUpdateWebsite = (data: any) => {
    updateWebsite.mutate(data);
  };

  const handlePublishWebsite = () => {
    publishWebsite.mutate(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Website Builder</h1>
          <p className="text-muted-foreground">
            Create and manage your hotel's website
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPropertyId || selectedProperty.id} onValueChange={setSelectedPropertyId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select property" />
            </SelectTrigger>
            <SelectContent>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Website Status Card */}
      {websiteConfig ? (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/20">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{selectedProperty.name} Website</h3>
                    <Badge variant={websiteConfig.is_published ? 'default' : 'secondary'}>
                      {websiteConfig.is_published ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {websiteConfig.subdomain}.beehotel.app
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={`/site/${websiteConfig.subdomain}`} target="_blank" rel="noopener noreferrer">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </a>
                </Button>
                {websiteConfig.is_published ? (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => publishWebsite.mutate(false)}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Unpublish
                  </Button>
                ) : (
                  <Button size="sm" onClick={handlePublishWebsite}>
                    <Rocket className="h-4 w-4 mr-2" />
                    Publish
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Create Your Hotel Website</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Get a professional website for your hotel in minutes. Choose from our templates and customize to match your brand.
            </p>
            <Button onClick={handleCreateWebsite} disabled={createWebsite.isPending}>
              <Globe className="h-4 w-4 mr-2" />
              {createWebsite.isPending ? 'Creating...' : 'Create Website'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      {websiteConfig && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="template" className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              <span className="hidden sm:inline">Template</span>
            </TabsTrigger>
            <TabsTrigger value="sections" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Sections</span>
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">Gallery</span>
            </TabsTrigger>
            <TabsTrigger value="inquiries" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Inquiries</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="template" className="space-y-4">
            <WebsiteTemplateSelector
              currentTemplate={websiteConfig.template_id}
              onSelect={(templateId) => handleUpdateWebsite({ template_id: templateId })}
            />
          </TabsContent>

          <TabsContent value="sections" className="space-y-4">
            <WebsiteSectionEditor
              sections={websiteConfig.sections as any[]}
              onUpdate={(sections) => handleUpdateWebsite({ sections })}
            />
          </TabsContent>

          <TabsContent value="gallery" className="space-y-4">
            <WebsiteGalleryManager websiteId={websiteConfig.id} />
          </TabsContent>

          <TabsContent value="inquiries" className="space-y-4">
            <WebsiteInquiries websiteId={websiteConfig.id} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <WebsiteSettings
              config={websiteConfig}
              onUpdate={handleUpdateWebsite}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
