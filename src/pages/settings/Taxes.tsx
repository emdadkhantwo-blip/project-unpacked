import { useState, useEffect } from 'react';
import { useTenant } from '@/hooks/useTenant';
import { useTaxConfigurations } from '@/hooks/useTaxConfigurations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, Receipt, FileText, Calculator } from 'lucide-react';
import TaxConfigurationList from '@/components/taxes/TaxConfigurationList';
import CreateTaxDialog from '@/components/taxes/CreateTaxDialog';
import TaxExemptionManager from '@/components/taxes/TaxExemptionManager';

export default function TaxesPage() {
  const { tenant, properties, currentProperty, isLoading: tenantLoading } = useTenant();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('configurations');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { 
    taxConfigurations, 
    isLoading: taxLoading, 
    createTaxConfiguration, 
    updateTaxConfiguration, 
    deleteTaxConfiguration,
    calculateTaxes 
  } = useTaxConfigurations();

  // Auto-select first property
  useEffect(() => {
    if (properties && properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

  const isLoading = tenantLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!properties || properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Properties Found</h2>
        <p className="text-muted-foreground">Create a property first to configure taxes.</p>
      </div>
    );
  }

  const selectedProperty = properties.find(p => p.id === selectedPropertyId) || properties[0];

  const handleCreateTax = async (_data: any) => {
    await createTaxConfiguration.mutateAsync();
  };

  const handleUpdateTax = (_id: string, _data: any) => {
    updateTaxConfiguration.mutate();
  };

  const handleDeleteTax = (_id: string) => {
    deleteTaxConfiguration.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tax Configuration</h1>
          <p className="text-muted-foreground">
            Configure VAT, service charges, and other taxes for your property
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPropertyId || selectedProperty.id} onValueChange={setSelectedPropertyId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select property" />
            </SelectTrigger>
            <SelectContent>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Tax
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Taxes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {taxConfigurations?.filter(t => t.is_active).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tax Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {taxConfigurations?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Combined Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(taxConfigurations?.filter(t => t.is_active && !t.is_compound).reduce((sum, t) => sum + Number(t.rate), 0) || 0).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="configurations" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Tax Types
          </TabsTrigger>
          <TabsTrigger value="exemptions" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Exemptions
          </TabsTrigger>
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Calculator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configurations" className="space-y-4">
          <TaxConfigurationList
            taxConfigurations={taxConfigurations || []}
            isLoading={taxLoading}
            onUpdate={handleUpdateTax}
            onDelete={handleDeleteTax}
          />
        </TabsContent>

        <TabsContent value="exemptions" className="space-y-4">
          <TaxExemptionManager propertyId={selectedPropertyId || selectedProperty.id} />
        </TabsContent>

        <TabsContent value="calculator" className="space-y-4">
          <TaxCalculatorCard 
            taxConfigurations={taxConfigurations || []} 
            calculateTaxes={calculateTaxes}
          />
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <CreateTaxDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        propertyId={selectedPropertyId || selectedProperty.id}
        onCreate={handleCreateTax}
      />
    </div>
  );
}

// Tax Calculator Component
function TaxCalculatorCard({ 
  taxConfigurations, 
  calculateTaxes 
}: { 
  taxConfigurations: any[]; 
  calculateTaxes: (amount: number, chargeType: 'room' | 'food' | 'service' | 'other' | 'all') => any;
}) {
  const [amount, setAmount] = useState<number>(1000);
  const [chargeType, setChargeType] = useState<'room' | 'food' | 'service' | 'other'>('room');

  const breakdown = calculateTaxes(amount, chargeType);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tax Calculator</CardTitle>
        <CardDescription>Preview how taxes are calculated on charges</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Base Amount</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Charge Type</label>
            <Select value={chargeType} onValueChange={(v: 'room' | 'food' | 'service' | 'other') => setChargeType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="room">Room Charge</SelectItem>
                <SelectItem value="food">Food & Beverage</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span>Base Amount</span>
            <span>৳{amount.toFixed(2)}</span>
          </div>
          {Object.entries(breakdown.breakdown).map(([taxCode, taxData]: [string, any]) => (
            <div key={taxCode} className="flex justify-between text-sm text-muted-foreground">
              <span>{taxData.name} ({taxData.rate}%)</span>
              <span>৳{taxData.amount.toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between font-semibold border-t pt-2">
            <span>Total Tax</span>
            <span>৳{breakdown.totalTax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Grand Total</span>
            <span>৳{breakdown.netAmount.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
