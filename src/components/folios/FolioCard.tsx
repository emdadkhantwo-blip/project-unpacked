import { format } from "date-fns";
import { User, Calendar, Receipt, CreditCard, Wallet, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Folio } from "@/hooks/useFolios";
import { cn } from "@/lib/utils";

interface FolioCardProps {
  folio: Folio;
  onClick: () => void;
}

export function FolioCard({ folio, onClick }: FolioCardProps) {
  const isOpen = folio.status === "open";
  const balance = Number(folio.balance);
  const totalAmount = Number(folio.total_amount);
  const paidAmount = Number(folio.paid_amount);
  
  // Determine balance status
  const isPaid = balance <= 0;
  const isPartial = paidAmount > 0 && balance > 0;
  const isUnpaid = paidAmount === 0 && balance > 0;

  // Get border color based on status
  const getBorderColor = () => {
    if (!isOpen) return "border-l-slate-400";
    if (isPaid) return "border-l-emerald-500";
    if (isPartial) return "border-l-amber-500";
    return "border-l-rose-500";
  };

  // Get status badge for payment
  const getPaymentStatus = () => {
    if (isPaid) return { label: "Paid", className: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 };
    if (isPartial) return { label: "Partial", className: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock };
    return { label: "Unpaid", className: "bg-rose-100 text-rose-700 border-rose-200", icon: Wallet };
  };

  const paymentStatus = getPaymentStatus();
  const PaymentIcon = paymentStatus.icon;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border-l-4",
        getBorderColor()
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-lg",
              isOpen ? "bg-blue-100" : "bg-slate-100"
            )}>
              <Receipt className={cn("h-4 w-4", isOpen ? "text-blue-600" : "text-slate-600")} />
            </div>
            <span className="font-mono text-sm font-semibold">{folio.folio_number}</span>
          </div>
          <div className="flex items-center gap-2">
            {isOpen && (
              <Badge className={cn("border text-xs", paymentStatus.className)}>
                <PaymentIcon className="mr-1 h-3 w-3" />
                {paymentStatus.label}
              </Badge>
            )}
            <Badge variant={isOpen ? "default" : "secondary"} className={isOpen ? "bg-blue-600" : ""}>
              {isOpen ? "Open" : "Closed"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Guest Info */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-muted rounded-full">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <span className="font-medium text-foreground">
            {folio.guest?.first_name} {folio.guest?.last_name}
          </span>
        </div>

        {/* Reservation Info */}
        {folio.reservation && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {format(new Date(folio.reservation.check_in_date), "MMM d")} -{" "}
              {format(new Date(folio.reservation.check_out_date), "MMM d, yyyy")}
            </span>
          </div>
        )}

        {/* Financial Summary */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t">
          <div className="p-2 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-0.5">Total Amount</p>
            <p className="font-bold text-foreground">৳{totalAmount.toLocaleString()}</p>
          </div>
          <div className={cn(
            "p-2 rounded-lg",
            isPaid ? "bg-emerald-50" : isPartial ? "bg-amber-50" : "bg-rose-50"
          )}>
            <p className="text-xs text-muted-foreground mb-0.5">Balance Due</p>
            <p className={cn(
              "font-bold",
              isPaid ? "text-emerald-600" : isPartial ? "text-amber-600" : "text-rose-600"
            )}>
              ৳{balance.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Payments indicator */}
        {folio.payments.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-md text-emerald-700">
              <CreditCard className="h-3 w-3" />
              <span>{folio.payments.length} payment{folio.payments.length > 1 ? 's' : ''}</span>
            </div>
            <span className="text-muted-foreground">
              ৳{paidAmount.toLocaleString()} paid
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
