import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Mail, Phone, Clock, Check, Trash2, Construction } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

type ContactSubmissionStatus = 'new' | 'read' | 'replied';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: ContactSubmissionStatus;
  created_at: string;
}

interface WebsiteInquiriesProps {
  websiteId: string;
}

export default function WebsiteInquiries({ websiteId }: WebsiteInquiriesProps) {
  const [inquiries, setInquiries] = useState<ContactSubmission[]>([]);

  const updateStatus = (id: string, status: ContactSubmissionStatus) => {
    setInquiries(inquiries.map(i => i.id === id ? { ...i, status } : i));
    toast.success('Status updated');
  };

  const deleteInquiry = (id: string) => {
    setInquiries(inquiries.filter(i => i.id !== id));
    toast.success('Inquiry deleted');
  };

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

      {/* Coming Soon Notice */}
      <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
        <CardContent className="flex items-center gap-3 py-4">
          <Construction className="h-5 w-5 text-amber-600" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Contact submissions database table coming soon. Inquiries will appear here once the website form is connected.
          </p>
        </CardContent>
      </Card>

      {inquiries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Inquiries Yet</h3>
            <p className="text-sm text-muted-foreground text-center">
              Contact form submissions from your website will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
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
                        onClick={() => updateStatus(inquiry.id, 'read')}
                      >
                        Mark as Read
                      </Button>
                    )}
                    {inquiry.status !== 'replied' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatus(inquiry.id, 'replied')}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Mark Replied
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteInquiry(inquiry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}