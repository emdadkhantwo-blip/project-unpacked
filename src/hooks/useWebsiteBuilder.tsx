import { toast } from '@/hooks/use-toast';

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
  { id: 'modern', name: 'Modern Minimalist', description: 'Clean, contemporary design', preview: '' },
  { id: 'luxury', name: 'Luxury Elegance', description: 'Sophisticated design', preview: '' },
  { id: 'classic', name: 'Classic Heritage', description: 'Traditional design', preview: '' },
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

// Note: website tables don't exist yet - returning mock data

export function useWebsiteBuilder() {
  const mockMutation = {
    mutate: () => { toast({ title: "Info", description: "Website builder not yet configured" }); },
    mutateAsync: async () => null,
    isPending: false,
  };

  return {
    website: null as WebsiteConfiguration | null,
    pages: [] as WebsitePage[],
    gallery: [] as WebsiteGalleryImage[],
    submissions: [] as ContactSubmission[],
    isLoading: false,
    createWebsite: mockMutation,
    updateWebsite: mockMutation,
    publishWebsite: mockMutation,
    unpublishWebsite: mockMutation,
    createPage: mockMutation,
    updatePage: mockMutation,
    deletePage: mockMutation,
    addGalleryImage: mockMutation,
    deleteGalleryImage: mockMutation,
    updateSubmissionStatus: mockMutation,
  };
}
