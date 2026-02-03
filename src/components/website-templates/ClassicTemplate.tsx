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
  ChevronRight,
  Send,
  Home,
  Menu,
  X,
  Star,
  Wifi,
  Car,
  Waves,
  Dumbbell,
  Utensils,
  Sparkles,
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
  pool: <Waves className="h-5 w-5" />,
  gym: <Dumbbell className="h-5 w-5" />,
  restaurant: <Utensils className="h-5 w-5" />,
  spa: <Sparkles className="h-5 w-5" />,
};

export default function ClassicTemplate({ 
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
      const { error } = await supabase
        .from('contact_submissions')
        .insert({
          website_id: config.id,
          name: contactForm.name,
          email: contactForm.email,
          phone: contactForm.phone,
          message: contactForm.message,
        });

      if (error) throw error;

      toast.success('Message sent successfully!');
      setContactForm({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Navigation */}
      {getSectionEnabled('navbar') && (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-amber-900 text-amber-50">
          <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex justify-between items-center">
            <div className="flex items-center gap-2">
              {config.logo_url ? (
                <img src={config.logo_url} alt={property?.name} className="h-8" />
              ) : (
                <>
                  <Home className="h-6 w-6" />
                  <span className="text-xl font-serif">{property?.name || 'Hotel'}</span>
                </>
              )}
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex gap-8 text-sm">
              {(navbarContent.links || []).map((link: any, index: number) => (
                <a 
                  key={index} 
                  href={link.href} 
                  className="hover:text-amber-200 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
            
            <Button size="sm" className="hidden md:flex bg-amber-100 text-amber-900 hover:bg-white" asChild>
              <a href={navbarContent.ctaLink || '#contact'}>
                {navbarContent.ctaText || 'Book Now'}
              </a>
            </Button>

            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden text-amber-50"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden absolute top-16 left-0 right-0 bg-amber-900 border-t border-amber-800 p-4 space-y-4">
              {(navbarContent.links || []).map((link: any, index: number) => (
                <a 
                  key={index} 
                  href={link.href} 
                  className="block text-sm text-amber-100/80 hover:text-amber-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <Button className="w-full bg-amber-100 text-amber-900 hover:bg-white" asChild>
                <a href={navbarContent.ctaLink || '#contact'}>
                  {navbarContent.ctaText || 'Book Now'}
                </a>
              </Button>
            </div>
          )}
        </nav>
      )}

      {/* Hero Section - Classic Banner */}
      {getSectionEnabled('hero') && (
        <section 
          id="hero"
          className="relative h-[60vh] min-h-[400px] flex items-center pt-16"
          style={{
            backgroundImage: config.hero_image_url 
              ? `url(${config.hero_image_url})` 
              : 'linear-gradient(135deg, #78350f 0%, #92400e 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div 
            className="absolute inset-0" 
            style={{ backgroundColor: `rgba(0,0,0,${(heroContent.overlayOpacity || 50) / 100})` }} 
          />
          <div className="relative z-10 max-w-6xl mx-auto px-6 w-full">
            <div className="max-w-2xl">
              <p className="text-amber-200 font-serif italic text-lg mb-2">Welcome to</p>
              <h1 className="text-4xl md:text-5xl font-serif text-white mb-4">
                {heroContent.title || config.seo_title || property?.name || 'Our Hotel'}
              </h1>
              <div className="w-20 h-1 bg-amber-500 mb-6" />
              <p className="text-lg text-amber-100 mb-8">
                {heroContent.subtitle || config.seo_description || 'A tradition of excellence and warm hospitality'}
              </p>
              <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white" asChild>
                <a href={heroContent.ctaLink || '#rooms'}>
                  {heroContent.ctaText || 'Explore Our Rooms'}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      {getSectionEnabled('about') && (
        <section id="about" className="py-20 px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-amber-600 font-serif italic mb-2">About Us</p>
              <h2 className="text-3xl font-serif text-amber-900 mb-4">{aboutContent.title || 'Our Heritage'}</h2>
              <div className="w-16 h-1 bg-amber-500 mx-auto" />
            </div>
            <p className="text-lg text-amber-800 leading-relaxed text-center mb-12">
              {aboutContent.description || 
                `For generations, ${property?.name || 'our hotel'} has been a beacon of 
                hospitality and warmth.`}
            </p>
            
            {/* Features Grid */}
            {aboutContent.features && aboutContent.features.length > 0 && (
              <div className="grid md:grid-cols-3 gap-8">
                {aboutContent.features.map((feature: any, index: number) => (
                  <div key={index} className="text-center p-6 border border-amber-200 rounded-lg">
                    <h3 className="font-serif text-lg text-amber-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-amber-700">{feature.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Rooms Section */}
      {getSectionEnabled('rooms') && roomTypes.length > 0 && (
        <section id="rooms" className="py-20 px-6 bg-amber-100/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-amber-600 font-serif italic mb-2">Accommodations</p>
              <h2 className="text-3xl font-serif text-amber-900 mb-4">{roomsContent.title || 'Our Rooms'}</h2>
              {roomsContent.subtitle && (
                <p className="text-amber-700">{roomsContent.subtitle}</p>
              )}
              <div className="w-16 h-1 bg-amber-500 mx-auto mt-4" />
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {roomTypes.map((room) => (
                <Card 
                  key={room.id} 
                  className="bg-white border-amber-200 overflow-hidden shadow-md"
                >
                  <div className="h-48 bg-gradient-to-br from-amber-200 to-amber-100 flex items-center justify-center border-b border-amber-200">
                    <span className="text-5xl">🛏️</span>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-serif text-xl text-amber-900">{room.name}</h3>
                      <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                        <Users className="h-3 w-3 mr-1" />
                        {room.max_occupancy}
                      </Badge>
                    </div>
                    <p className="text-sm text-amber-700 mb-4 line-clamp-2">
                      {room.description || 'Comfortable and traditionally appointed'}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(room.amenities || []).slice(0, 3).map((amenity, idx) => (
                        <Badge 
                          key={idx} 
                          variant="outline" 
                          className="text-xs border-amber-300 text-amber-700"
                        >
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-amber-100">
                      {roomsContent.showPrices !== false && (
                        <div>
                          <span className="text-2xl font-serif text-amber-900">৳{room.base_rate}</span>
                          <span className="text-sm text-amber-600">/night</span>
                        </div>
                      )}
                      {roomsContent.showBooking !== false && (
                        <Button 
                          size="sm" 
                          className="bg-amber-700 hover:bg-amber-800 text-white"
                        >
                          Book Now
                        </Button>
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
        <section id="amenities" className="py-20 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-amber-600 font-serif italic mb-2">Services</p>
              <h2 className="text-3xl font-serif text-amber-900 mb-4">{amenitiesContent.title || 'Amenities'}</h2>
              {amenitiesContent.subtitle && (
                <p className="text-amber-700">{amenitiesContent.subtitle}</p>
              )}
              <div className="w-16 h-1 bg-amber-500 mx-auto mt-4" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {(amenitiesContent.items || []).map((item: any, index: number) => (
                <div key={index} className="text-center p-4 border border-amber-200 rounded-lg">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                    {amenityIcons[item.icon] || <Sparkles className="h-5 w-5" />}
                  </div>
                  <h3 className="font-serif text-sm text-amber-900 mb-1">{item.name}</h3>
                  <p className="text-xs text-amber-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery Section */}
      {getSectionEnabled('gallery') && galleryImages.length > 0 && (
        <section id="gallery" className="py-20 px-6 bg-amber-100/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-amber-600 font-serif italic mb-2">Explore</p>
              <h2 className="text-3xl font-serif text-amber-900 mb-4">Photo Gallery</h2>
              <div className="w-16 h-1 bg-amber-500 mx-auto" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {galleryImages.map((image) => (
                <div 
                  key={image.id} 
                  className="aspect-[4/3] rounded overflow-hidden border-4 border-amber-100 shadow-md"
                >
                  <img 
                    src={image.image_url} 
                    alt={image.caption || 'Gallery image'}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {getSectionEnabled('testimonials') && (testimonialsContent.reviews || []).length > 0 && (
        <section id="testimonials" className="py-20 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-amber-600 font-serif italic mb-2">Reviews</p>
              <h2 className="text-3xl font-serif text-amber-900 mb-4">{testimonialsContent.title || 'Guest Reviews'}</h2>
              {testimonialsContent.subtitle && (
                <p className="text-amber-700">{testimonialsContent.subtitle}</p>
              )}
              <div className="w-16 h-1 bg-amber-500 mx-auto mt-4" />
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {(testimonialsContent.reviews || []).map((review: any, index: number) => (
                <Card key={index} className="p-6 bg-amber-50 border-amber-200">
                  <Quote className="h-8 w-8 text-amber-300 mb-4" />
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${i < review.rating ? 'fill-amber-500 text-amber-500' : 'text-amber-200'}`} 
                      />
                    ))}
                  </div>
                  <p className="text-amber-800 mb-4 italic">"{review.text}"</p>
                  <div>
                    <p className="font-serif text-amber-900">{review.name}</p>
                    <p className="text-sm text-amber-600">{review.location}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      {getSectionEnabled('contact') && (
        <section id="contact" className="py-20 px-6 bg-amber-900 text-amber-50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-amber-300 font-serif italic mb-2">Get in Touch</p>
              <h2 className="text-3xl font-serif mb-4">{contactContent.title || 'Contact Us'}</h2>
              {contactContent.subtitle && (
                <p className="text-amber-200">{contactContent.subtitle}</p>
              )}
              <div className="w-16 h-1 bg-amber-500 mx-auto mt-4" />
            </div>
            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact Info */}
              <div className="space-y-6">
                {property && (
                  <>
                    <div className="flex items-start gap-4">
                      <MapPin className="h-5 w-5 text-amber-400 mt-1" />
                      <div>
                        <p className="font-medium">Address</p>
                        <p className="text-amber-200">
                          {property.address}, {property.city}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Phone className="h-5 w-5 text-amber-400 mt-1" />
                      <div>
                        <p className="font-medium">Phone</p>
                        <p className="text-amber-200">{property.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Mail className="h-5 w-5 text-amber-400 mt-1" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-amber-200">{property.email}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Contact Form */}
              {contactContent.showForm !== false && (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <Input
                    placeholder="Your Name"
                    className="bg-amber-800 border-amber-700 text-white placeholder:text-amber-400"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Your Email"
                    className="bg-amber-800 border-amber-700 text-white placeholder:text-amber-400"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Phone Number"
                    className="bg-amber-800 border-amber-700 text-white placeholder:text-amber-400"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  />
                  <Textarea
                    placeholder="Your Message"
                    rows={4}
                    className="bg-amber-800 border-amber-700 text-white placeholder:text-amber-400"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    required
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-amber-100 text-amber-900 hover:bg-white" 
                    disabled={isSubmitting}
                  >
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
        <section id="location" className="py-20 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-amber-600 font-serif italic mb-2">Find Us</p>
              <h2 className="text-3xl font-serif text-amber-900 mb-4">{locationContent.title || 'Location'}</h2>
              {locationContent.subtitle && (
                <p className="text-amber-700">{locationContent.subtitle}</p>
              )}
              <div className="w-16 h-1 bg-amber-500 mx-auto mt-4" />
            </div>
            <div className="aspect-video rounded-lg overflow-hidden border-4 border-amber-100 shadow-md">
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
              <p className="mt-6 text-center text-amber-700">{locationContent.directions}</p>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-amber-950 text-amber-300 py-10 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <Home className="h-8 w-8 mx-auto mb-4 text-amber-500" />
          <p className="font-serif text-xl text-amber-100 mb-2">
            {property?.name || 'Hotel'}
          </p>
          <p className="text-sm text-amber-400">
            © {new Date().getFullYear()} All rights reserved.
          </p>
          <p className="text-xs mt-2 text-amber-600">
            Powered by BeeHotel
          </p>
        </div>
      </footer>
    </div>
  );
}
