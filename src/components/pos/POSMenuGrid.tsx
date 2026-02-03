import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, UtensilsCrossed, Coffee, Wine, Pizza, Salad, IceCream, Soup, Sandwich, Beef, Fish } from "lucide-react";
import { POSItem, POSCategory } from "@/hooks/usePOS";
import { cn } from "@/lib/utils";

interface POSMenuGridProps {
  items: POSItem[];
  categories: POSCategory[];
  onAddItem: (item: POSItem) => void;
}

// Color palette for categories
const categoryColors = [
  { bg: "bg-blue-500", bgLight: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", hover: "hover:bg-blue-100" },
  { bg: "bg-emerald-500", bgLight: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", hover: "hover:bg-emerald-100" },
  { bg: "bg-purple-500", bgLight: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", hover: "hover:bg-purple-100" },
  { bg: "bg-amber-500", bgLight: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", hover: "hover:bg-amber-100" },
  { bg: "bg-rose-500", bgLight: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", hover: "hover:bg-rose-100" },
  { bg: "bg-cyan-500", bgLight: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", hover: "hover:bg-cyan-100" },
  { bg: "bg-orange-500", bgLight: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", hover: "hover:bg-orange-100" },
  { bg: "bg-indigo-500", bgLight: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", hover: "hover:bg-indigo-100" },
];

const categoryIcons: Record<string, typeof UtensilsCrossed> = {
  "main": UtensilsCrossed,
  "drinks": Coffee,
  "beverages": Wine,
  "pizza": Pizza,
  "salads": Salad,
  "desserts": IceCream,
  "soup": Soup,
  "sandwiches": Sandwich,
  "meat": Beef,
  "seafood": Fish,
};

export function POSMenuGrid({ items, categories, onAddItem }: POSMenuGridProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory && item.is_available;
  });

  const groupedByCategory = filteredItems.reduce((acc, item) => {
    const categoryName = item.category?.name || "Uncategorized";
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(item);
    return acc;
  }, {} as Record<string, POSItem[]>);

  // Get color for category
  const getCategoryColor = (index: number) => categoryColors[index % categoryColors.length];
  const categoryColorMap = categories.reduce((acc, cat, idx) => {
    acc[cat.id] = getCategoryColor(idx);
    return acc;
  }, {} as Record<string, typeof categoryColors[0]>);

  return (
    <Card className="h-full border-none shadow-lg">
      <CardContent className="flex h-full flex-col p-4">
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-primary/50"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "transition-all",
              selectedCategory === null 
                ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md" 
                : "hover:bg-muted"
            )}
          >
            All Items
          </Button>
          {categories.map((category, idx) => {
            const colors = getCategoryColor(idx);
            const isSelected = selectedCategory === category.id;
            return (
              <Button
                key={category.id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "transition-all",
                  isSelected 
                    ? cn(colors.bg, "text-white shadow-md") 
                    : cn(colors.bgLight, colors.text, colors.border, colors.hover)
                )}
              >
                {category.name}
              </Button>
            );
          })}
        </div>

        {/* Items Grid */}
        <ScrollArea className="flex-1">
          {Object.entries(groupedByCategory).map(([categoryName, categoryItems]) => {
            const category = categories.find(c => c.name === categoryName);
            const colors = category ? categoryColorMap[category.id] : categoryColors[0];
            
            return (
              <div key={categoryName} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn("p-1.5 rounded-lg", colors.bgLight)}>
                    <UtensilsCrossed className={cn("h-4 w-4", colors.text)} />
                  </div>
                  <h3 className={cn("text-sm font-semibold", colors.text)}>
                    {categoryName}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {categoryItems.length}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {categoryItems.map((item) => (
                    <Card
                      key={item.id}
                      className={cn(
                        "cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group",
                        "border-l-4",
                        colors.border.replace("border-", "border-l-"),
                        "hover:border-l-4",
                        colors.bg.replace("bg-", "hover:border-l-")
                      )}
                      onClick={() => onAddItem(item)}
                    >
                      <CardContent className="p-3 relative">
                        {/* Quick add indicator */}
                        <div className={cn(
                          "absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity",
                          colors.bgLight
                        )}>
                          <Plus className={cn("h-3 w-3", colors.text)} />
                        </div>
                        
                        <div className="flex items-start justify-between pr-6">
                          <div className="flex-1">
                            <p className="font-semibold leading-tight text-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.code}</p>
                          </div>
                        </div>
                        
                        {item.description && (
                          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                        
                        <div className="mt-2 flex items-center justify-between">
                          <Badge 
                            className={cn(
                              "font-bold",
                              colors.bgLight, 
                              colors.text,
                              "border",
                              colors.border
                            )}
                          >
                            ৳{Number(item.price).toFixed(0)}
                          </Badge>
                          {item.prep_time_minutes && (
                            <span className="text-xs text-muted-foreground">
                              {item.prep_time_minutes} min
                            </span>
                          )}
                        </div>
                        
                        {!item.is_available && (
                          <Badge variant="destructive" className="mt-2 w-full justify-center">
                            Unavailable
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="flex h-40 flex-col items-center justify-center text-muted-foreground">
              <UtensilsCrossed className="h-10 w-10 mb-2 opacity-50" />
              <p>No menu items found</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
