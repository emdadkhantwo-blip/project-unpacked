import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Mail, Phone, Clock, Check, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type ContactSubmissionStatus = Database['public']['Enums']['contact_submission_status'];

interface WebsiteInquiriesProps {
  websiteId: string;
}

export default function WebsiteInquiries({ websiteId }: WebsiteInquiriesProps) {
  const queryClient = useQueryClient();

  // Fetch inquiries
  const { data: inquiries, isLoading } = useQuery({
    queryKey: ['contact-submissions', websiteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .eq('website_id', websiteId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!websiteId,
  });

  // Update status mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ContactSubmissionStatus }) => {
      const { error } = await supabase
        .from('contact_submissions')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-submissions'] });
      toast.success('Status updated');
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contact_submissions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-submissions'] });
      toast.success('Inquiry deleted');
    },
    onError: () => {
      toast.error('Failed to delete inquiry');
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-500">New</Badge>;
      case 'read':
        return <Badge variant="secondary">Read</Badge>;
      case 'replied':
        return <Badge className="bg-green-500">Replied</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!inquiries || inquiries.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Inquiries Yet</h3>
          <p className="text-sm text-muted-foreground text-center">
            Contact form submissions from your website will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  const newCount = inquiries.filter(i => i.status === 'new').length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Contact Inquiries</h3>
          <p className="text-sm text-muted-foreground">
            {newCount > 0 ? `${newCount} new inquiries` : 'All inquiries have been addressed'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {inquiries.map((inquiry) => (
          <Card key={inquiry.id} className={inquiry.status === 'new' ? 'border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20' : ''}>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{inquiry.name}</h4>
                    {getStatusBadge(inquiry.status)}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {inquiry.email}
                    </span>
                    {inquiry.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {inquiry.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {format(new Date(inquiry.created_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">
                    {inquiry.message}
                  </p>
                </div>
                <div className="flex md:flex-col gap-2">
                  {inquiry.status === 'new' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateMutation.mutate({ id: inquiry.id, status: 'read' })}
                    >
                      Mark as Read
                    </Button>
                  )}
                  {inquiry.status !== 'replied' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateMutation.mutate({ id: inquiry.id, status: 'replied' })}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Mark Replied
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate(inquiry.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
