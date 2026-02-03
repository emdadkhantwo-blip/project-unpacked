import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ModernTemplate from '@/components/website-templates/ModernTemplate';
import LuxuryTemplate from '@/components/website-templates/LuxuryTemplate';
import ClassicTemplate from '@/components/website-templates/ClassicTemplate';
import { Globe, Clock } from 'lucide-react';

interface WebsiteConfig {
  id: string;
  tenant_id: string;
  property_id: string;
  template_id: string;
  subdomain: string;
  is_published: boolean;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  sections: any[];
  seo_title: string;
  seo_description: string;
  social_links: any;
  hero_image_url: string;
}

interface RoomType {
  id: string;
  name: string;
  description: string;
  base_rate: number;
  max_occupancy: number;
  amenities: string[];
}

interface GalleryImage {
  id: string;
  image_url: string;
  caption: string;
  category: string;
  sort_order: number;
}

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
}

export default function PublicHotelWebsite() {
  const { subdomain } = useParams<{ subdomain: string }>();

  // Mock website configuration since the table doesn't exist
  const { data: websiteConfig, isLoading: configLoading } = useQuery({
    queryKey: ['public-website', subdomain],
    queryFn: async (): Promise<WebsiteConfig | null> => {
      // Return null - website_configurations table doesn't exist
      return null;
    },
    enabled: !!subdomain,
  });

  // Fetch property details (if we had the config)
  const { data: property } = useQuery({
    queryKey: ['public-property', websiteConfig?.property_id],
    queryFn: async () => {
      if (!websiteConfig?.property_id) return null;
      const { data, error } = await supabase
        .from('properties')
        .select('id, name, address, city, phone, email')
        .eq('id', websiteConfig.property_id)
        .single();
      
      if (error) throw error;
      return data as Property;
    },
    enabled: !!websiteConfig?.property_id,
  });

  // Fetch room types
  const { data: roomTypes } = useQuery({
    queryKey: ['public-room-types', websiteConfig?.property_id],
    queryFn: async () => {
      if (!websiteConfig?.property_id) return [];
      const { data, error } = await supabase
        .from('room_types')
        .select('id, name, description, base_rate, max_occupancy, amenities')
        .eq('property_id', websiteConfig.property_id)
        .eq('is_active', true)
        .order('base_rate', { ascending: true });
      
      if (error) throw error;
      return data as RoomType[];
    },
    enabled: !!websiteConfig?.property_id,
  });

  // Loading state
  if (configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Website not found (since tables don't exist, this will always show)
  if (!websiteConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Website Not Found</h1>
          <p className="text-muted-foreground">
            The website you're looking for doesn't exist or has been removed.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            (Website builder tables are not configured in the database)
          </p>
        </div>
      </div>
    );
  }

  // Website not published - show coming soon
  if (!websiteConfig.is_published) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="text-center max-w-md px-4">
          <Clock className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Coming Soon</h1>
          <p className="text-muted-foreground mb-6">
            We're working on something amazing. Check back soon!
          </p>
          {property && (
            <p className="text-sm text-muted-foreground">
              {property.name}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Prepare data for templates
  const templateData = {
    config: websiteConfig,
    property: property || null,
    roomTypes: roomTypes || [],
    galleryImages: [] as GalleryImage[],
    sections: (websiteConfig.sections || []) as any[],
  };

  // Render based on template
  switch (websiteConfig.template_id) {
    case 'luxury':
      return <LuxuryTemplate {...templateData} />;
    case 'classic':
      return <ClassicTemplate {...templateData} />;
    case 'modern':
    default:
      return <ModernTemplate {...templateData} />;
  }
}
