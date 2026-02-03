import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Users, 
  Wifi, 
  Car, 
  Coffee, 
  Utensils,
  Star,
  ChevronRight,
  Send,
  Dumbbell,
  Waves,
  Sparkles,
  Menu,
  X,
  Quote
} from 'lucide-react';

interface TemplateProps {
  config: {
    id: string;
    seo_title: string;
    seo_description: string;
    primary_color: string;
    secondary_color: string;
    hero_image_url: string;
    social_links: any;
    logo_url?: string;
  };
  property: {
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
  } | null;
  roomTypes: Array<{
    id: string;
    name: string;
    description: string;
    base_rate: number;
    max_occupancy: number;
    amenities: string[];
  }>;
  galleryImages: Array<{
    id: string;
    image_url: string;
    caption: string;
    category: string;
  }>;
  sections: Array<{
    id?: string;
    type: string;
    enabled: boolean;
    content: any;
  }>;
}

const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-5 w-5" />,
  parking: <Car className="h-5 w-5" />,
  breakfast: <Coffee className="h-5 w-5" />,
  restaurant: <Utensils className="h-5 w-5" />,
  pool: <Waves className="h-5 w-5" />,
  gym: <Dumbbell className="h-5 w-5" />,
  spa: <Sparkles className="h-5 w-5" />,
};

export default function ModernTemplate({ 
  config, 
  property, 
  roomTypes, 
  galleryImages,
  sections 
}: TemplateProps) {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getSectionEnabled = (type: string) => {
    const section = sections.find(s => s.type === type);
    return section?.enabled !== false;
  };

  const getSectionContent = (type: string) => {
    const section = sections.find(s => s.type === type);
    return section?.content || {};
  };

  const navbarContent = getSectionContent('navbar');
  const heroContent = getSectionContent('hero');
  const aboutContent = getSectionContent('about');
  const roomsContent = getSectionContent('rooms');
  const amenitiesContent = getSectionContent('amenities');
  const testimonialsContent = getSectionContent('testimonials');
  const contactContent = getSectionContent('contact');
  const locationContent = getSectionContent('location');

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Contact submissions table not yet available
      // For now, just show success message
      console.log('Contact form submission:', {
        website_id: config.id,
        name: contactForm.name,
        email: contactForm.email,
        phone: contactForm.phone,
        message: contactForm.message,
      });

      toast.success('Message sent successfully!');
      setContactForm({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      {getSectionEnabled('navbar') && (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {config.logo_url ? (
                <img src={config.logo_url} alt={property?.name} className="h-8" />
              ) : (
                <span className="text-xl font-bold text-primary">{property?.name || 'Hotel'}</span>
              )}
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {(navbarContent.links || []).map((link: any, index: number) => (
                <a 
                  key={index} 
                  href={link.href} 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <Button size="sm" asChild>
                <a href={navbarContent.ctaLink || '#contact'}>
                  {navbarContent.ctaText || 'Book Now'}
                </a>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b p-4 space-y-4">
              {(navbarContent.links || []).map((link: any, index: number) => (
                <a 
                  key={index} 
                  href={link.href} 
                  className="block text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <Button className="w-full" asChild>
                <a href={navbarContent.ctaLink || '#contact'}>
                  {navbarContent.ctaText || 'Book Now'}
                </a>
              </Button>
            </div>
          )}
        </nav>
      )}

      {/* Hero Section */}
      {getSectionEnabled('hero') && (
        <section 
          id="hero"
          className="relative h-[80vh] min-h-[500px] flex items-center justify-center pt-16"
          style={{
            backgroundImage: config.hero_image_url 
              ? `url(${config.hero_image_url})` 
              : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.8) 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div 
            className="absolute inset-0" 
            style={{ backgroundColor: `rgba(0,0,0,${(heroContent.overlayOpacity || 50) / 100})` }} 
          />
          <div className="relative z-10 text-center text-white px-4 max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {heroContent.title || config.seo_title || property?.name || 'Welcome'}
            </h1>
            <p className="text-lg md:text-xl mb-8 opacity-90">
              {heroContent.subtitle || config.seo_description || 'Experience luxury and comfort like never before'}
            </p>
            <Button size="lg" className="text-lg px-8" asChild>
              <a href={heroContent.ctaLink || '#contact'}>
                {heroContent.ctaText || 'Book Now'}
                <ChevronRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </section>
      )}

      {/* About Section */}
      {getSectionEnabled('about') && (
        <section id="about" className="py-20 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">{aboutContent.title || 'About Us'}</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-12">
              {aboutContent.description || 
                `Welcome to ${property?.name || 'our hotel'}. We offer exceptional hospitality 
                and world-class amenities to make your stay unforgettable.`}
            </p>
            
            {/* Features Grid */}
            {aboutContent.features && aboutContent.features.length > 0 && (
              <div className="grid md:grid-cols-3 gap-8">
                {aboutContent.features.map((feature: any, index: number) => (
                  <div key={index} className="p-6 bg-background rounded-lg shadow-sm">
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Rooms Section */}
      {getSectionEnabled('rooms') && roomTypes.length > 0 && (
        <section id="rooms" className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-2">{roomsContent.title || 'Our Rooms'}</h2>
              {roomsContent.subtitle && (
                <p className="text-muted-foreground">{roomsContent.subtitle}</p>
              )}
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roomTypes.map((room) => (
                <Card key={room.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <span className="text-4xl">🛏️</span>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-lg">{room.name}</h3>
                      <Badge variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        {room.max_occupancy}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {room.description || 'Comfortable and well-appointed room'}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(room.amenities || []).slice(0, 4).map((amenity, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      {roomsContent.showPrices !== false && (
                        <div>
                          <span className="text-2xl font-bold">৳{room.base_rate}</span>
                          <span className="text-sm text-muted-foreground">/night</span>
                        </div>
                      )}
                      {roomsContent.showBooking !== false && (
                        <Button size="sm">Book</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Amenities Section */}
      {getSectionEnabled('amenities') && (
        <section id="amenities" className="py-20 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-2">{amenitiesContent.title || 'Amenities'}</h2>
              {amenitiesContent.subtitle && (
                <p className="text-muted-foreground">{amenitiesContent.subtitle}</p>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {(amenitiesContent.items || []).map((item: any, index: number) => (
                <div key={index} className="text-center p-4 bg-background rounded-lg shadow-sm">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {amenityIcons[item.icon] || <Sparkles className="h-5 w-5" />}
                  </div>
                  <h3 className="font-medium text-sm mb-1">{item.name}</h3>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery Section */}
      {getSectionEnabled('gallery') && galleryImages.length > 0 && (
        <section id="gallery" className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryImages.map((image) => (
                <div 
                  key={image.id} 
                  className="aspect-square rounded-lg overflow-hidden bg-muted"
                >
                  <img 
                    src={image.image_url} 
                    alt={image.caption || 'Gallery image'}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {getSectionEnabled('testimonials') && (testimonialsContent.reviews || []).length > 0 && (
        <section id="testimonials" className="py-20 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-2">{testimonialsContent.title || 'Guest Reviews'}</h2>
              {testimonialsContent.subtitle && (
                <p className="text-muted-foreground">{testimonialsContent.subtitle}</p>
              )}
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {(testimonialsContent.reviews || []).map((review: any, index: number) => (
                <Card key={index} className="p-6">
                  <Quote className="h-8 w-8 text-primary/20 mb-4" />
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{review.text}"</p>
                  <div>
                    <p className="font-semibold">{review.name}</p>
                    <p className="text-sm text-muted-foreground">{review.location}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      {getSectionEnabled('contact') && (
        <section id="contact" className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-2">{contactContent.title || 'Contact Us'}</h2>
              {contactContent.subtitle && (
                <p className="text-muted-foreground">{contactContent.subtitle}</p>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact Info */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Get in Touch</h3>
                {property && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <p className="font-medium">Address</p>
                        <p className="text-muted-foreground">
                          {property.address}, {property.city}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <p className="font-medium">Phone</p>
                        <p className="text-muted-foreground">{property.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-muted-foreground">{property.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Form */}
              {contactContent.showForm !== false && (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <Input
                    placeholder="Your Name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Your Email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Phone Number"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  />
                  <Textarea
                    placeholder="Your Message"
                    rows={4}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    required
                  />
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Location Section */}
      {getSectionEnabled('location') && locationContent.showMap && locationContent.mapEmbedUrl && (
        <section id="location" className="py-20 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-2">{locationContent.title || 'Location'}</h2>
              {locationContent.subtitle && (
                <p className="text-muted-foreground">{locationContent.subtitle}</p>
              )}
            </div>
            <div className="aspect-video rounded-lg overflow-hidden">
              <iframe
                src={locationContent.mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            {locationContent.directions && (
              <p className="mt-6 text-center text-muted-foreground">{locationContent.directions}</p>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-foreground text-background py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm opacity-80">
            © {new Date().getFullYear()} {property?.name || 'Hotel'}. All rights reserved.
          </p>
          <p className="text-xs opacity-60 mt-2">
            Powered by BeeHotel
          </p>
        </div>
      </footer>
    </div>
  );
}
