import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Sparkles } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  preview: string;
  features: string[];
  popular?: boolean;
}

const TEMPLATES: Template[] = [
  {
    id: 'modern',
    name: 'Modern Elegance',
    description: 'Clean, contemporary design with bold typography and smooth animations',
    preview: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop',
    features: ['Full-width hero', 'Room cards', 'Booking widget', 'Gallery grid'],
    popular: true,
  },
  {
    id: 'classic',
    name: 'Classic Luxury',
    description: 'Timeless design with elegant serif fonts and warm color palette',
    preview: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&h=500&fit=crop',
    features: ['Centered layout', 'Image carousel', 'Testimonials', 'Contact form'],
  },
  {
    id: 'minimal',
    name: 'Minimal & Clean',
    description: 'Minimalist approach focusing on beautiful imagery and whitespace',
    preview: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=500&fit=crop',
    features: ['Image-first', 'Simple navigation', 'Quick booking', 'Amenities icons'],
  },
  {
    id: 'boutique',
    name: 'Boutique Style',
    description: 'Artistic layout perfect for boutique and design hotels',
    preview: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=500&fit=crop',
    features: ['Asymmetric grid', 'Story section', 'Instagram feed', 'Virtual tour'],
  },
  {
    id: 'resort',
    name: 'Resort Paradise',
    description: 'Vibrant design showcasing resort amenities and experiences',
    preview: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=500&fit=crop',
    features: ['Video hero', 'Activities showcase', 'Dining section', 'Spa booking'],
  },
];

interface WebsiteTemplateSelectorProps {
  currentTemplate: string;
  onSelect: (templateId: string) => void;
}

export default function WebsiteTemplateSelector({
  currentTemplate,
  onSelect,
}: WebsiteTemplateSelectorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Choose Your Template</h3>
        <p className="text-sm text-muted-foreground">
          Select a template that matches your hotel's style. You can customize colors and content later.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TEMPLATES.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              currentTemplate === template.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onSelect(template.id)}
          >
            <div className="relative">
              <img
                src={template.preview}
                alt={template.name}
                className="w-full h-40 object-cover rounded-t-lg"
              />
              {template.popular && (
                <Badge className="absolute top-2 right-2 bg-amber-500">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Popular
                </Badge>
              )}
              {currentTemplate === template.id && (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center rounded-t-lg">
                  <div className="bg-primary text-primary-foreground rounded-full p-2">
                    <Check className="h-6 w-6" />
                  </div>
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-1">{template.name}</h4>
              <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
              <div className="flex flex-wrap gap-1">
                {template.features.map((feature) => (
                  <Badge key={feature} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
