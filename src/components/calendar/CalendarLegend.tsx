import { Crown, UserCheck, CalendarClock, LogOut } from "lucide-react";

export function CalendarLegend() {
  const items = [
    {
      label: "Confirmed",
      color: "bg-blue-500",
      icon: CalendarClock,
    },
    {
      label: "Checked In",
      color: "bg-emerald-500",
      icon: UserCheck,
    },
    {
      label: "VIP Guest",
      color: "bg-amber-400",
      icon: Crown,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      <span className="text-muted-foreground font-medium">Legend:</span>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className={`h-3 w-3 rounded ${item.color}`} />
          <item.icon className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">{item.label}</span>
        </div>
      ))}
      {/* Checkout indicator legend */}
      <div className="flex items-center gap-1.5">
        <div 
          className="h-3 w-3 rounded border border-muted-foreground/30"
          style={{
            background: `repeating-linear-gradient(
              -45deg,
              hsl(var(--muted)),
              hsl(var(--muted)) 1px,
              hsl(var(--muted-foreground) / 0.3) 1px,
              hsl(var(--muted-foreground) / 0.3) 2px
            )`,
          }}
        />
        <LogOut className="h-3 w-3 text-muted-foreground" />
        <span className="text-muted-foreground">Checkout Day</span>
      </div>
    </div>
  );
}
