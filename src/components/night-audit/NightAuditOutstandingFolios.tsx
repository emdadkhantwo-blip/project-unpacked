import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';
import { AlertCircle, Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface OutstandingFolio {
  id: string;
  folio_number: string;
  guest_name: string;
  room_number: string | null;
  total_amount: number;
  paid_amount: number;
  balance: number;
  created_at: string;
}

interface NightAuditOutstandingFoliosProps {
  folios: OutstandingFolio[];
  isLoading?: boolean;
}

export function NightAuditOutstandingFolios({ folios, isLoading }: NightAuditOutstandingFoliosProps) {
  const totalOutstanding = folios.reduce((sum, f) => sum + f.balance, 0);

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading folio data...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className={folios.length > 0 ? 'border-amber-500/20 bg-amber-500/5' : 'border-green-500/20 bg-green-500/5'}>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            {folios.length > 0 ? (
              <AlertCircle className="h-8 w-8 text-amber-500" />
            ) : (
              <Wallet className="h-8 w-8 text-green-500" />
            )}
            <div>
              <p className={`font-medium ${folios.length > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-green-700 dark:text-green-400'}`}>
                {folios.length > 0 ? `${folios.length} Outstanding Folio${folios.length > 1 ? 's' : ''}` : 'No Outstanding Balances'}
              </p>
              <p className="text-sm text-muted-foreground">
                {folios.length > 0 ? 'Requires attention before closing' : 'All folios are settled'}
              </p>
            </div>
          </div>
          {folios.length > 0 && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Outstanding</p>
              <p className="text-xl font-bold text-amber-600">{formatCurrency(totalOutstanding)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      {folios.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Folio #</TableHead>
              <TableHead>Guest</TableHead>
              <TableHead>Room</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {folios.map((folio) => (
              <TableRow key={folio.id}>
                <TableCell className="font-medium">{folio.folio_number}</TableCell>
                <TableCell>{folio.guest_name}</TableCell>
                <TableCell>{folio.room_number || '-'}</TableCell>
                <TableCell className="text-right">{formatCurrency(folio.total_amount)}</TableCell>
                <TableCell className="text-right text-green-600">{formatCurrency(folio.paid_amount)}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="destructive">{formatCurrency(folio.balance)}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
