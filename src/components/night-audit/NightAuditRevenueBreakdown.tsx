import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/currency';
import { Wallet, CreditCard, Banknote, Landmark, Smartphone } from 'lucide-react';

export interface PaymentsByMethod {
  cash: number;
  credit_card: number;
  debit_card: number;
  bank_transfer: number;
  other: number;
}

export interface RevenueByCategory {
  room: number;
  food_beverage: number;
  laundry: number;
  minibar: number;
  spa: number;
  parking: number;
  telephone: number;
  internet: number;
  miscellaneous: number;
}

interface NightAuditRevenueBreakdownProps {
  paymentsByMethod: PaymentsByMethod;
  revenueByCategory: RevenueByCategory;
  totalRevenue: number;
  totalPayments: number;
}

export function NightAuditRevenueBreakdown({
  paymentsByMethod,
  revenueByCategory,
  totalRevenue,
  totalPayments,
}: NightAuditRevenueBreakdownProps) {
  const paymentMethods = [
    { key: 'cash', label: 'Cash', icon: Banknote, value: paymentsByMethod.cash, color: 'bg-green-500' },
    { key: 'credit_card', label: 'Credit Card', icon: CreditCard, value: paymentsByMethod.credit_card, color: 'bg-blue-500' },
    { key: 'debit_card', label: 'Debit Card', icon: CreditCard, value: paymentsByMethod.debit_card, color: 'bg-purple-500' },
    { key: 'bank_transfer', label: 'Bank Transfer', icon: Landmark, value: paymentsByMethod.bank_transfer, color: 'bg-cyan-500' },
    { key: 'other', label: 'Other', icon: Smartphone, value: paymentsByMethod.other, color: 'bg-gray-500' },
  ];

  const revenueCategories = [
    { key: 'room', label: 'Room Revenue', value: revenueByCategory.room },
    { key: 'food_beverage', label: 'F&B Revenue', value: revenueByCategory.food_beverage },
    { key: 'laundry', label: 'Laundry', value: revenueByCategory.laundry },
    { key: 'minibar', label: 'Minibar', value: revenueByCategory.minibar },
    { key: 'spa', label: 'Spa', value: revenueByCategory.spa },
    { key: 'parking', label: 'Parking', value: revenueByCategory.parking },
    { key: 'telephone', label: 'Telephone', value: revenueByCategory.telephone },
    { key: 'internet', label: 'Internet', value: revenueByCategory.internet },
    { key: 'miscellaneous', label: 'Miscellaneous', value: revenueByCategory.miscellaneous },
  ].filter(c => c.value > 0);

  const getPercentage = (value: number, total: number) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : '0';
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Revenue by Category */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Revenue Breakdown</CardTitle>
          </div>
          <CardDescription>Revenue by category</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {revenueCategories.length > 0 ? (
            <>
              {revenueCategories.map((category) => (
                <div key={category.key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{category.label}</span>
                    <span className="font-medium">
                      {formatCurrency(category.value)} ({getPercentage(category.value, totalRevenue)}%)
                    </span>
                  </div>
                  <Progress
                    value={totalRevenue > 0 ? (category.value / totalRevenue) * 100 : 0}
                    className="h-2"
                  />
                </div>
              ))}
              <Separator className="my-3" />
              <div className="flex justify-between font-semibold">
                <span>Total Revenue</span>
                <span className="text-primary">{formatCurrency(totalRevenue)}</span>
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-4">No revenue recorded</p>
          )}
        </CardContent>
      </Card>

      {/* Payments by Method */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Payments by Method</CardTitle>
          </div>
          <CardDescription>Payment method breakdown</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {paymentMethods.filter(m => m.value > 0).length > 0 ? (
            <>
              {paymentMethods
                .filter(m => m.value > 0)
                .map((method) => (
                  <div key={method.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${method.color}`} />
                      <method.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{method.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{formatCurrency(method.value)}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({getPercentage(method.value, totalPayments)}%)
                      </span>
                    </div>
                  </div>
                ))}
              <Separator className="my-3" />
              <div className="flex justify-between font-semibold">
                <span>Total Payments</span>
                <span className="text-green-600">{formatCurrency(totalPayments)}</span>
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-4">No payments recorded</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
