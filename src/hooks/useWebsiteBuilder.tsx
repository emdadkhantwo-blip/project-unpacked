import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from './useTenant';
import { toast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export type ContactSubmissionStatus = 'new' | 'read' | 'replied';

export interface WebsiteSection {
  type: 'hero' | 'rooms' | 'amenities' | 'gallery' | 'contact' | 'about' | 'packages' | 'testimonials';
  enabled: boolean;
  order: number;
  content?: Record<string, unknown>;
}

export interface WebsiteConfiguration {
  id: string;
  tenant_id: string;
  property_id: string;
  template_id: string;
  subdomain: string | null;
  custom_domain: string | null;
  is_published: boolean;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  sections: WebsiteSection[];
  seo_title: string | null;
  seo_description: string | null;
  social_links: Record<string, string>;
  hero_image_url: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebsitePage {
  id: string;
  website_id: string;
  slug: string;
  title: string;
  content: unknown[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebsiteGalleryImage {
  id: string;
  website_id: string;
  image_url: string;
  caption: string | null;
  category: string;
  sort_order: number;
  created_at: string;
}

export interface ContactSubmission {
  id: string;
  website_id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: ContactSubmissionStatus;
  created_at: string;
}

export const WEBSITE_TEMPLATES = [
  {
    id: 'modern',
    name: 'Modern Minimalist',
    description: 'Clean, contemporary design with focus on imagery',
    preview: '/templates/modern-preview.jpg',
  },
  {
    id: 'luxury',
    name: 'Luxury Elegance',
    description: 'Sophisticated design for premium properties',
    preview: '/templates/luxury-preview.jpg',
  },
  {
    id: 'classic',
    name: 'Classic Heritage',
    description: 'Traditional design with timeless appeal',
    preview: '/templates/classic-preview.jpg',
  },
];

export const DEFAULT_SECTIONS: WebsiteSection[] = [
  { type: 'hero', enabled: true, order: 1 },
  { type: 'about', enabled: true, order: 2 },
  { type: 'rooms', enabled: true, order: 3 },
  { type: 'amenities', enabled: true, order: 4 },
  { type: 'gallery', enabled: true, order: 5 },
  { type: 'packages', enabled: false, order: 6 },
  { type: 'testimonials', enabled: false, order: 7 },
  { type: 'contact', enabled: true, order: 8 },
];

// Helper to convert DB data to our WebsiteConfiguration type
const toWebsiteConfig = (data: any): WebsiteConfiguration => ({
  ...data,
  sections: Array.isArray(data.sections) ? data.sections : [],
  social_links: data.social_links && typeof data.social_links === 'object' ? data.social_links : {},
});

export function useWebsiteBuilder() {
  const { tenant, currentProperty } = useTenant();
  const queryClient = useQueryClient();

  const websiteConfig = useQuery({
    queryKey: ['website-config', currentProperty?.id],
    queryFn: async () => {
      if (!currentProperty?.id) return null;
      
      const { data, error } = await supabase
        .from('website_configurations')
        .select('*')
        .eq('property_id', currentProperty.id)
        .maybeSingle();

      if (error) throw error;
      return data ? toWebsiteConfig(data) : null;
    },
    enabled: !!currentProperty?.id,
  });

  const websitePages = useQuery({
    queryKey: ['website-pages', websiteConfig.data?.id],
    queryFn: async () => {
      if (!websiteConfig.data?.id) return [];
      
      const { data, error } = await supabase
        .from('website_pages')
        .select('*')
        .eq('website_id', websiteConfig.data.id)
        .order('created_at');

      if (error) throw error;
      return data as WebsitePage[];
    },
    enabled: !!websiteConfig.data?.id,
  });

  const galleryImages = useQuery({
    queryKey: ['website-gallery', websiteConfig.data?.id],
    queryFn: async () => {
      if (!websiteConfig.data?.id) return [];
      
      const { data, error } = await supabase
        .from('website_gallery')
        .select('*')
        .eq('website_id', websiteConfig.data.id)
        .order('sort_order');

      if (error) throw error;
      return data as WebsiteGalleryImage[];
    },
    enabled: !!websiteConfig.data?.id,
  });

  const contactSubmissions = useQuery({
    queryKey: ['contact-submissions', websiteConfig.data?.id],
    queryFn: async () => {
      if (!websiteConfig.data?.id) return [];
      
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .eq('website_id', websiteConfig.data.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ContactSubmission[];
    },
    enabled: !!websiteConfig.data?.id,
  });

  const createWebsite = useMutation({
    mutationFn: async (input: Partial<WebsiteConfiguration>) => {
      if (!tenant?.id || !currentProperty?.id) throw new Error('No tenant or property selected');

      const subdomain = input.subdomain || currentProperty.code?.toLowerCase().replace(/[^a-z0-9]/g, '') || 
        `hotel-${Date.now()}`;

      const { data, error } = await supabase
        .from('website_configurations')
        .insert({
          tenant_id: tenant.id,
          property_id: currentProperty.id,
          template_id: input.template_id || 'modern',
          subdomain,
          primary_color: input.primary_color || '#1E3A5F',
          secondary_color: input.secondary_color || '#D4AF37',
          font_family: input.font_family || 'Inter',
          sections: (input.sections || DEFAULT_SECTIONS) as unknown as Json,
          seo_title: input.seo_title || currentProperty.name,
          seo_description: input.seo_description || `Welcome to ${currentProperty.name}`,
          social_links: (input.social_links || {}) as unknown as Json,
        })
        .select()
        .single();

      if (error) throw error;
      return toWebsiteConfig(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-config'] });
      toast({ title: 'Website created successfully' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to create website', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const updateWebsite = useMutation({
    mutationFn: async (updates: Partial<WebsiteConfiguration>) => {
      if (!websiteConfig.data?.id) throw new Error('No website to update');

      // Convert sections and social_links to JSON if present
      const updateData: Record<string, unknown> = { ...updates };
      if (updates.sections !== undefined) {
        updateData.sections = updates.sections as unknown as Json;
      }
      if (updates.social_links !== undefined) {
        updateData.social_links = updates.social_links as unknown as Json;
      }

      const { data, error } = await supabase
        .from('website_configurations')
        .update(updateData)
        .eq('id', websiteConfig.data.id)
        .select()
        .single();

      if (error) throw error;
      return toWebsiteConfig(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-config'] });
      toast({ title: 'Website updated successfully' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to update website', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const publishWebsite = useMutation({
    mutationFn: async (publish: boolean) => {
      if (!websiteConfig.data?.id) throw new Error('No website to publish');

      const { data, error } = await supabase
        .from('website_configurations')
        .update({ is_published: publish })
        .eq('id', websiteConfig.data.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['website-config'] });
      toast({ 
        title: data.is_published ? 'Website published!' : 'Website unpublished',
        description: data.is_published 
          ? `Your website is now live at ${data.subdomain}.beehotel.app` 
          : 'Your website is no longer publicly accessible'
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to update website status', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const addGalleryImage = useMutation({
    mutationFn: async (input: { image_url: string; caption?: string; category?: string }) => {
      if (!websiteConfig.data?.id) throw new Error('No website configured');

      const maxOrder = Math.max(0, ...galleryImages.data?.map(i => i.sort_order) || [0]);

      const { data, error } = await supabase
        .from('website_gallery')
        .insert({
          website_id: websiteConfig.data.id,
          image_url: input.image_url,
          caption: input.caption || null,
          category: input.category || 'general',
          sort_order: maxOrder + 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-gallery'] });
      toast({ title: 'Image added to gallery' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to add image', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const deleteGalleryImage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('website_gallery')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-gallery'] });
      toast({ title: 'Image removed from gallery' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Failed to remove image', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const updateSubmissionStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ContactSubmissionStatus }) => {
      const { data, error } = await supabase
        .from('contact_submissions')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-submissions'] });
    },
  });

  return {
    websiteConfig: websiteConfig.data,
    websitePages: websitePages.data || [],
    galleryImages: galleryImages.data || [],
    contactSubmissions: contactSubmissions.data || [],
    isLoading: websiteConfig.isLoading,
    error: websiteConfig.error,
    hasWebsite: !!websiteConfig.data,
    createWebsite,
    updateWebsite,
    publishWebsite,
    addGalleryImage,
    deleteGalleryImage,
    updateSubmissionStatus,
  };
}
