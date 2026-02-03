import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CalendarPlus, 
  BedDouble, 
  Users, 
  ClipboardList,
  Search,
  Printer,
} from "lucide-react";

interface QuickActionsProps {
  onNewReservation?: () => void;
  onSearchGuest?: () => void;
}

export function QuickActions({ onNewReservation, onSearchGuest }: QuickActionsProps) {
  const actions = [
    {
      label: "New Reservation",
      icon: CalendarPlus,
      onClick: onNewReservation,
      variant: "default" as const,
    },
    {
      label: "Find Guest",
      icon: Search,
      onClick: onSearchGuest,
      variant: "outline" as const,
    },
    {
      label: "View Rooms",
      icon: BedDouble,
      href: "/rooms",
      variant: "outline" as const,
    },
    {
      label: "Reservations",
      icon: ClipboardList,
      href: "/reservations",
      variant: "outline" as const,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) =>
            action.href ? (
              <Button
                key={action.label}
                variant={action.variant}
                size="sm"
                className="gap-2"
                asChild
              >
                <Link to={action.href}>
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </Link>
              </Button>
            ) : (
              <Button
                key={action.label}
                variant={action.variant}
                size="sm"
                className="gap-2"
                onClick={action.onClick}
              >
                <action.icon className="h-4 w-4" />
                {action.label}
              </Button>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
