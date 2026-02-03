import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface CreateTaxDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onCreate: (data: any) => Promise<void>;
}

const CHARGE_TYPES = [
  { id: 'room', label: 'Room Charges' },
  { id: 'food', label: 'Food & Beverage' },
  { id: 'service', label: 'Services' },
  { id: 'other', label: 'Other Charges' },
];

export default function CreateTaxDialog({
  open,
  onOpenChange,
  propertyId,
  onCreate,
}: CreateTaxDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    rate: '',
    is_compound: false,
    is_inclusive: false,
    is_active: true,
    calculation_order: 1,
    applies_to: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.code || !formData.rate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate({
        property_id: propertyId,
        name: formData.name,
        code: formData.code.toUpperCase(),
        rate: parseFloat(formData.rate),
        is_compound: formData.is_compound,
        is_inclusive: formData.is_inclusive,
        is_active: formData.is_active,
        calculation_order: formData.calculation_order,
        applies_to: formData.applies_to.length > 0 ? formData.applies_to : ['room', 'food', 'service', 'other'],
      });
      
      toast.success('Tax configuration created');
      onOpenChange(false);
      setFormData({
        name: '',
        code: '',
        rate: '',
        is_compound: false,
        is_inclusive: false,
        is_active: true,
        calculation_order: 1,
        applies_to: [],
      });
    } catch (error) {
      toast.error('Failed to create tax configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleChargeType = (typeId: string) => {
    setFormData(prev => ({
      ...prev,
      applies_to: prev.applies_to.includes(typeId)
        ? prev.applies_to.filter(t => t !== typeId)
        : [...prev.applies_to, typeId],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Tax Configuration</DialogTitle>
          <DialogDescription>
            Configure a new tax type (VAT, Service Charge, etc.)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tax Name *</Label>
              <Input
                id="name"
                placeholder="e.g., VAT"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                placeholder="e.g., VAT15"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rate">Rate (%) *</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                placeholder="15.00"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="order">Calculation Order</Label>
              <Input
                id="order"
                type="number"
                min="1"
                value={formData.calculation_order}
                onChange={(e) => setFormData({ ...formData, calculation_order: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Applies To</Label>
            <div className="grid grid-cols-2 gap-2">
              {CHARGE_TYPES.map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={type.id}
                    checked={formData.applies_to.includes(type.id)}
                    onCheckedChange={() => toggleChargeType(type.id)}
                  />
                  <Label htmlFor={type.id} className="font-normal cursor-pointer">
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty to apply to all charge types
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <Label>Compound Tax</Label>
                <p className="text-xs text-muted-foreground">
                  Calculate on amount + previous taxes
                </p>
              </div>
              <Switch
                checked={formData.is_compound}
                onCheckedChange={(checked) => setFormData({ ...formData, is_compound: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Tax Inclusive Pricing</Label>
                <p className="text-xs text-muted-foreground">
                  Prices already include this tax
                </p>
              </div>
              <Switch
                checked={formData.is_inclusive}
                onCheckedChange={(checked) => setFormData({ ...formData, is_inclusive: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">
                  Enable this tax for calculations
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Tax'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
