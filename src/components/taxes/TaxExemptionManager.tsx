import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Building2, User, FileX } from 'lucide-react';
import { useCorporateAccounts } from '@/hooks/useCorporateAccounts';
import { useTaxConfigurations } from '@/hooks/useTaxConfigurations';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface TaxExemptionManagerProps {
  propertyId: string;
}

export default function TaxExemptionManager({ propertyId }: TaxExemptionManagerProps) {
  const queryClient = useQueryClient();
  const corporateAccountsQuery = useCorporateAccounts();
  const corporateAccounts = corporateAccountsQuery.data || [];
  const { taxConfigurations } = useTaxConfigurations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    tax_configuration_id: '',
    entity_type: 'corporate_account' as 'corporate_account' | 'guest',
    entity_id: '',
    exemption_type: 'full' as 'full' | 'partial',
    exemption_rate: '100',
    valid_from: '',
    valid_until: '',
    notes: '',
  });

  // Fetch exemptions
  const { data: exemptions, isLoading } = useQuery({
    queryKey: ['tax-exemptions', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tax_exemptions')
        .select(`
          *,
          tax_configuration:tax_configurations(name, code)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!propertyId,
  });

  // Create exemption mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: profile } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', profile.user?.id)
        .single();

      const { error } = await supabase
        .from('tax_exemptions')
        .insert({
          ...data,
          tenant_id: userProfile?.tenant_id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-exemptions'] });
      toast.success('Exemption created');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to create exemption');
    },
  });

  // Delete exemption mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tax_exemptions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-exemptions'] });
      toast.success('Exemption removed');
    },
    onError: () => {
      toast.error('Failed to remove exemption');
    },
  });

  const resetForm = () => {
    setFormData({
      tax_configuration_id: '',
      entity_type: 'corporate_account',
      entity_id: '',
      exemption_type: 'full',
      exemption_rate: '100',
      valid_from: '',
      valid_until: '',
      notes: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tax_configuration_id || !formData.entity_id) {
      toast.error('Please fill in required fields');
      return;
    }

    createMutation.mutate({
      tax_configuration_id: formData.tax_configuration_id,
      entity_type: formData.entity_type,
      entity_id: formData.entity_id,
      exemption_type: formData.exemption_type,
      exemption_rate: formData.exemption_type === 'full' ? 100 : parseFloat(formData.exemption_rate),
      valid_from: formData.valid_from || null,
      valid_until: formData.valid_until || null,
      notes: formData.notes || null,
    });
  };

  const getEntityName = (exemption: any) => {
    if (exemption.entity_type === 'corporate_account') {
      const account = corporateAccounts?.find((a: any) => a.id === exemption.entity_id);
      return account?.company_name || 'Unknown Company';
    }
    return 'Guest';
  };

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
          <h3 className="text-lg font-semibold">Tax Exemptions</h3>
          <p className="text-sm text-muted-foreground">
            Configure tax exemptions for corporate accounts or specific guests
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Exemption
        </Button>
      </div>

      {(!exemptions || exemptions.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileX className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Exemptions</h3>
            <p className="text-sm text-muted-foreground text-center">
              Add exemptions for corporate accounts that have special tax arrangements
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {exemptions.map((exemption: any) => (
            <Card key={exemption.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                      {exemption.entity_type === 'corporate_account' ? (
                        <Building2 className="h-5 w-5 text-primary" />
                      ) : (
                        <User className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{getEntityName(exemption)}</span>
                        <Badge variant="outline">
                          {exemption.tax_configuration?.code}
                        </Badge>
                        <Badge variant={exemption.exemption_type === 'full' ? 'default' : 'secondary'}>
                          {exemption.exemption_type === 'full' ? '100%' : `${exemption.exemption_rate}%`} Exempt
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {exemption.tax_configuration?.name}
                        {exemption.valid_from && exemption.valid_until && (
                          <> • {format(new Date(exemption.valid_from), 'MMM d, yyyy')} - {format(new Date(exemption.valid_until), 'MMM d, yyyy')}</>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(exemption.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Exemption Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Tax Exemption</DialogTitle>
            <DialogDescription>
              Configure a tax exemption for a corporate account or guest
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Tax Type *</Label>
              <Select
                value={formData.tax_configuration_id}
                onValueChange={(v) => setFormData({ ...formData, tax_configuration_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tax" />
                </SelectTrigger>
                <SelectContent>
                  {taxConfigurations?.map((tax) => (
                    <SelectItem key={tax.id} value={tax.id}>
                      {tax.name} ({tax.code}) - {tax.rate}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Entity Type *</Label>
              <Select
                value={formData.entity_type}
                onValueChange={(v: 'corporate_account' | 'guest') => setFormData({ ...formData, entity_type: v, entity_id: '' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corporate_account">Corporate Account</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.entity_type === 'corporate_account' && (
              <div className="space-y-2">
                <Label>Corporate Account *</Label>
                <Select
                  value={formData.entity_id}
                  onValueChange={(v) => setFormData({ ...formData, entity_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {corporateAccounts?.map((account: any) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.company_name} ({account.account_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Exemption Type</Label>
                <Select
                  value={formData.exemption_type}
                  onValueChange={(v: 'full' | 'partial') => setFormData({ ...formData, exemption_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full (100%)</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.exemption_type === 'partial' && (
                <div className="space-y-2">
                  <Label>Exemption Rate (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.exemption_rate}
                    onChange={(e) => setFormData({ ...formData, exemption_rate: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valid From</Label>
                <Input
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Valid Until</Label>
                <Input
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                placeholder="Optional notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Exemption'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
