import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  FolderOpen, 
  Search,
  FileText,
  AlertCircle,
  Upload,
  Download,
  Eye,
  Trash2,
  CreditCard,
  FileSignature,
  Award,
  File,
  ExternalLink
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useHRDocuments } from '@/hooks/useHRDocuments';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const DOCUMENT_TYPES = [
  { id: 'nid', name: 'NID/Passport', icon: CreditCard, color: 'text-vibrant-blue' },
  { id: 'contract', name: 'Employment Contract', icon: FileSignature, color: 'text-vibrant-purple' },
  { id: 'certificate', name: 'Certificates', icon: Award, color: 'text-vibrant-green' },
  { id: 'offer', name: 'Offer Letter', icon: FileText, color: 'text-vibrant-amber' },
  { id: 'other', name: 'Other', icon: File, color: 'text-muted-foreground' },
];

const getDocumentTypeInfo = (type: string) => {
  return DOCUMENT_TYPES.find((t) => t.id === type) || DOCUMENT_TYPES[4];
};

const getExpiryStatus = (expiryDate: string | null) => {
  if (!expiryDate) return { status: 'valid', label: 'No Expiry', variant: 'secondary' as const };
  
  const now = new Date();
  const expiry = new Date(expiryDate);
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (expiry <= now) {
    return { status: 'expired', label: 'Expired', variant: 'destructive' as const };
  }
  if (expiry <= thirtyDaysFromNow) {
    return { status: 'expiring', label: 'Expiring Soon', variant: 'warning' as const };
  }
  return { status: 'valid', label: 'Valid', variant: 'success' as const };
};

const HRDocuments = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const { documents, stats, isLoading } = useHRDocuments();

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.staff_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.nid_number && doc.nid_number.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = !selectedType || doc.document_type === selectedType;

    return matchesSearch && matchesType;
  });

  const handleViewDocument = (fileUrl: string) => {
    window.open(fileUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-vibrant-cyan/10 to-vibrant-blue/10 border-l-4 border-l-vibrant-cyan">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold">{isLoading ? '-' : stats.total}</p>
              </div>
              <FolderOpen className="h-8 w-8 text-vibrant-cyan" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-green/10 to-vibrant-emerald/10 border-l-4 border-l-vibrant-green">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valid Documents</p>
                <p className="text-2xl font-bold">{isLoading ? '-' : stats.valid}</p>
              </div>
              <FileText className="h-8 w-8 text-vibrant-green" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-amber/10 to-vibrant-orange/10 border-l-4 border-l-vibrant-amber">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold">{isLoading ? '-' : stats.expiringSoon}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-vibrant-amber" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-rose/10 to-vibrant-pink/10 border-l-4 border-l-vibrant-rose">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold">{isLoading ? '-' : stats.expired}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-vibrant-rose" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, staff, or NID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Document Type Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={selectedType === null ? "default" : "outline"} 
              size="sm"
              onClick={() => setSelectedType(null)}
            >
              All Types
            </Button>
            {DOCUMENT_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <Button 
                  key={type.id}
                  variant={selectedType === type.id ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setSelectedType(type.id)}
                >
                  <Icon className={`h-4 w-4 mr-2 ${type.color}`} />
                  {type.name}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-vibrant-cyan" />
            Employee Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">No documents found</h3>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {documents.length === 0 
                  ? "Documents uploaded during staff creation will appear here."
                  : "No documents match your search criteria."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>NID Number</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => {
                    const typeInfo = getDocumentTypeInfo(doc.document_type);
                    const TypeIcon = typeInfo.icon;
                    const expiryStatus = getExpiryStatus(doc.expiry_date);

                    return (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={doc.staff_avatar || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {doc.staff_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{doc.staff_name}</p>
                              {doc.staff_id && (
                                <p className="text-xs text-muted-foreground">
                                  ID: {doc.staff_id}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium truncate max-w-[200px]">
                              {doc.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <TypeIcon className={`h-3 w-3 ${typeInfo.color}`} />
                            {typeInfo.name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {doc.nid_number ? (
                            <span className="font-mono text-sm">{doc.nid_number}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {format(new Date(doc.created_at), "MMM d, yyyy")}
                          </span>
                        </TableCell>
                        <TableCell>
                          {doc.expiry_date ? (
                            <span className="text-sm">
                              {format(new Date(doc.expiry_date), "MMM d, yyyy")}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={expiryStatus.variant === 'warning' || expiryStatus.variant === 'success' ? 'outline' : expiryStatus.variant}
                            className={expiryStatus.variant === 'warning' ? 'border-vibrant-amber text-vibrant-amber' : expiryStatus.variant === 'success' ? 'bg-vibrant-green/10 text-vibrant-green border-vibrant-green' : ''}
                          >
                            {expiryStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDocument(doc.file_url)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HRDocuments;
