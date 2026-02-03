import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Trash2, Edit, ArrowUpDown, Percent } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface TaxConfiguration {
  id: string;
  name: string;
  code: string;
  rate: number;
  is_compound: boolean;
  applies_to: string[];
  is_inclusive: boolean;
  is_active: boolean;
  calculation_order: number;
}

interface TaxConfigurationListProps {
  taxConfigurations: TaxConfiguration[];
  isLoading: boolean;
  onUpdate: (id: string, data: Partial<TaxConfiguration>) => void;
  onDelete: (id: string) => void;
}

export default function TaxConfigurationList({
  taxConfigurations,
  isLoading,
  onUpdate,
  onDelete,
}: TaxConfigurationListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (taxConfigurations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Percent className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Tax Configurations</h3>
          <p className="text-sm text-muted-foreground text-center">
            Add your first tax type (VAT, Service Charge, etc.)
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort by calculation order
  const sortedTaxes = [...taxConfigurations].sort((a, b) => a.calculation_order - b.calculation_order);

  return (
    <div className="space-y-4">
      {sortedTaxes.map((tax) => (
        <Card key={tax.id} className={!tax.is_active ? 'opacity-60' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                  <Percent className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{tax.name}</h3>
                    <Badge variant="outline">{tax.code}</Badge>
                    {tax.is_compound && (
                      <Badge variant="secondary">Compound</Badge>
                    )}
                    {tax.is_inclusive && (
                      <Badge variant="secondary">Inclusive</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold text-primary">{tax.rate}%</span>
                    <span className="text-sm text-muted-foreground">
                      • Applies to: {(tax.applies_to || []).join(', ') || 'All'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ArrowUpDown className="h-4 w-4" />
                  Order: {tax.calculation_order}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Active</span>
                  <Switch
                    checked={tax.is_active}
                    onCheckedChange={(checked) => onUpdate(tax.id, { is_active: checked })}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(tax.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Tax Calculation Order</h4>
              <p className="text-sm text-muted-foreground">
                Taxes are applied in order. Compound taxes are calculated on the amount + previous taxes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
