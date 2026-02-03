import { useState } from "react";
import { Tags, Plus, Search, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CreateReferenceDialog } from "@/components/references/CreateReferenceDialog";
import { ReferenceCard } from "@/components/references/ReferenceCard";
import { ReferenceDetailDrawer } from "@/components/references/ReferenceDetailDrawer";
import { useReferences, useReferenceStats, type Reference } from "@/hooks/useReferences";
import { formatCurrency } from "@/lib/currency";

export default function References() {
  const { data: references, isLoading } = useReferences();
  const stats = useReferenceStats();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedReference, setSelectedReference] = useState<Reference | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  const filteredReferences = references?.filter((ref) => {
    const query = searchQuery.toLowerCase();
    return (
      ref.name.toLowerCase().includes(query) ||
      ref.code.toLowerCase().includes(query)
    );
  });

  const handleViewReference = (reference: Reference) => {
    setSelectedReference(reference);
    setDetailDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="border-l-4 border-l-vibrant-blue bg-gradient-to-br from-card to-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total References</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Tags className="h-8 w-8 text-vibrant-blue opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-vibrant-green bg-gradient-to-br from-card to-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-vibrant-green/20">
                <div className="h-3 w-3 rounded-full bg-vibrant-green" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-vibrant-amber bg-gradient-to-br from-card to-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold">{stats.inactive}</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-vibrant-amber/20">
                <div className="h-3 w-3 rounded-full bg-vibrant-amber" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-vibrant-purple bg-gradient-to-br from-card to-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Discount</p>
                <p className="text-2xl font-bold">{stats.avgDiscount}%</p>
              </div>
              <Percent className="h-8 w-8 text-vibrant-purple opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search references..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Reference
        </Button>
      </div>

      {/* References Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading references...</p>
        </div>
      ) : filteredReferences && filteredReferences.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredReferences.map((reference) => (
            <ReferenceCard
              key={reference.id}
              reference={reference}
              onClick={() => handleViewReference(reference)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <Tags className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No references found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchQuery
              ? "Try adjusting your search query"
              : "Create your first reference to get started"}
          </p>
          {!searchQuery && (
            <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Reference
            </Button>
          )}
        </div>
      )}

      {/* Dialogs */}
      <CreateReferenceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <ReferenceDetailDrawer
        reference={selectedReference}
        open={detailDrawerOpen}
        onOpenChange={setDetailDrawerOpen}
      />
    </div>
  );
}
