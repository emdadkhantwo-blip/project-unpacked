import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Image, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface WebsiteGalleryManagerProps {
  websiteId: string;
}

const CATEGORIES = [
  { value: 'rooms', label: 'Rooms' },
  { value: 'dining', label: 'Dining' },
  { value: 'amenities', label: 'Amenities' },
  { value: 'exterior', label: 'Exterior' },
  { value: 'events', label: 'Events' },
  { value: 'other', label: 'Other' },
];

export default function WebsiteGalleryManager({ websiteId }: WebsiteGalleryManagerProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [formData, setFormData] = useState({
    image_url: '',
    caption: '',
    category: 'rooms',
  });

  // Fetch gallery images
  const { data: images, isLoading } = useQuery({
    queryKey: ['website-gallery', websiteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('website_gallery')
        .select('*')
        .eq('website_id', websiteId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!websiteId,
  });

  // Add image mutation
  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const maxOrder = images?.reduce((max, img) => Math.max(max, img.sort_order || 0), 0) || 0;
      
      const { error } = await supabase
        .from('website_gallery')
        .insert({
          website_id: websiteId,
          image_url: data.image_url,
          caption: data.caption,
          category: data.category,
          sort_order: maxOrder + 1,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-gallery'] });
      toast.success('Image added to gallery');
      setIsDialogOpen(false);
      setFormData({ image_url: '', caption: '', category: 'rooms' });
    },
    onError: () => {
      toast.error('Failed to add image');
    },
  });

  // Delete image mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('website_gallery')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-gallery'] });
      toast.success('Image removed');
    },
    onError: () => {
      toast.error('Failed to remove image');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_url) {
      toast.error('Please enter an image URL');
      return;
    }
    addMutation.mutate(formData);
  };

  const filteredImages = selectedCategory === 'all'
    ? images
    : images?.filter(img => img.category === selectedCategory);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Image Gallery</h3>
          <p className="text-sm text-muted-foreground">
            Manage images displayed on your website
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Image
          </Button>
        </div>
      </div>

      {(!filteredImages || filteredImages.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Image className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Images</h3>
            <p className="text-sm text-muted-foreground text-center">
              Add images to showcase your hotel on the website
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredImages.map((image) => (
            <Card key={image.id} className="group relative overflow-hidden">
              <img
                src={image.image_url}
                alt={image.caption || 'Gallery image'}
                className="w-full h-40 object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => deleteMutation.mutate(image.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <CardContent className="p-2">
                <p className="text-sm font-medium truncate">{image.caption || 'Untitled'}</p>
                <p className="text-xs text-muted-foreground capitalize">{image.category}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Image Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Image</DialogTitle>
            <DialogDescription>
              Add an image to your website gallery
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Image URL *</Label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Caption</Label>
              <Input
                placeholder="Describe the image..."
                value={formData.caption}
                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.image_url && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-lg border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=Invalid+URL';
                  }}
                />
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? 'Adding...' : 'Add Image'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
