import { Tags, Percent, MoreVertical, Pencil, Trash2, Power } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToggleReferenceStatus, useDeleteReference, type Reference } from "@/hooks/useReferences";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface ReferenceCardProps {
  reference: Reference;
  onClick?: () => void;
}

export function ReferenceCard({ reference, onClick }: ReferenceCardProps) {
  const toggleStatus = useToggleReferenceStatus();
  const deleteReference = useDeleteReference();

  const handleToggleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleStatus.mutate();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this reference?")) {
      deleteReference.mutate();
    }
  };

  const discountDisplay =
    reference.discount_type === "percentage"
      ? `${reference.discount_percentage}%`
      : formatCurrency(reference.fixed_discount);

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5",
        "border-l-4",
        reference.is_active
          ? "border-l-vibrant-green"
          : "border-l-muted-foreground/30 opacity-75"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                reference.is_active
                  ? "bg-vibrant-purple/10 text-vibrant-purple"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Tags className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">{reference.name}</h3>
              <p className="text-sm text-muted-foreground">{reference.code}</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuItem onClick={onClick}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleStatus}>
                <Power className="mr-2 h-4 w-4" />
                {reference.is_active ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {reference.discount_type === "percentage" ? (
              <Percent className="h-4 w-4 text-vibrant-amber" />
            ) : (
              <span className="text-sm font-bold text-vibrant-green">৳</span>
            )}
            <span className="text-lg font-bold">{discountDisplay}</span>
            <span className="text-sm text-muted-foreground">discount</span>
          </div>

          <Badge
            variant={reference.is_active ? "default" : "secondary"}
            className={cn(
              reference.is_active
                ? "bg-vibrant-green/10 text-vibrant-green hover:bg-vibrant-green/20"
                : ""
            )}
          >
            {reference.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>

        {reference.notes && (
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
            {reference.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
