import { useState, useMemo } from "react";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Search, Receipt, CreditCard, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useFolios, useFolioStats, type Folio } from "@/hooks/useFolios";
import { useFolioNotifications } from "@/hooks/useFolioNotifications";
import { FolioStatsBar } from "@/components/folios/FolioStatsBar";
import { FolioCard } from "@/components/folios/FolioCard";
import { FolioDetailDrawer } from "@/components/folios/FolioDetailDrawer";
import { FolioFilters } from "@/components/folios/FolioFilters";
import { BulkPaymentDialog } from "@/components/folios/BulkPaymentDialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function Folios() {
  // Enable real-time notifications for folios and payments
  useFolioNotifications();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"open" | "closed">("open");
  const [selectedFolio, setSelectedFolio] = useState<Folio | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Date filters
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  
  // Bulk selection
  const [selectedFolioIds, setSelectedFolioIds] = useState<string[]>([]);
  const [bulkPaymentOpen, setBulkPaymentOpen] = useState(false);

  const { data: folios, isLoading: foliosLoading } = useFolios(activeTab);
  const { data: stats, isLoading: statsLoading } = useFolioStats();

  const filteredFolios = useMemo(() => {
    return folios?.filter((folio) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          folio.folio_number.toLowerCase().includes(query) ||
          folio.guest?.first_name.toLowerCase().includes(query) ||
          folio.guest?.last_name.toLowerCase().includes(query) ||
          folio.reservation?.confirmation_number.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      
      // Date filter
      if (startDate || endDate) {
        const folioDate = new Date(folio.created_at);
        if (startDate && endDate) {
          if (!isWithinInterval(folioDate, { start: startOfDay(startDate), end: endOfDay(endDate) })) {
            return false;
          }
        } else if (startDate) {
          if (folioDate < startOfDay(startDate)) return false;
        } else if (endDate) {
          if (folioDate > endOfDay(endDate)) return false;
        }
      }
      
      return true;
    });
  }, [folios, searchQuery, startDate, endDate]);

  const selectedFoliosForPayment = useMemo(() => {
    return filteredFolios?.filter(f => selectedFolioIds.includes(f.id) && Number(f.balance) > 0) || [];
  }, [filteredFolios, selectedFolioIds]);

  const handleFolioClick = (folio: Folio) => {
    setSelectedFolio(folio);
    setIsDrawerOpen(true);
  };

  const handleToggleSelect = (folioId: string) => {
    setSelectedFolioIds(prev => 
      prev.includes(folioId) 
        ? prev.filter(id => id !== folioId)
        : [...prev, folioId]
    );
  };

  const handleSelectAll = () => {
    if (!filteredFolios) return;
    const foliosWithBalance = filteredFolios.filter(f => Number(f.balance) > 0);
    if (selectedFolioIds.length === foliosWithBalance.length) {
      setSelectedFolioIds([]);
    } else {
      setSelectedFolioIds(foliosWithBalance.map(f => f.id));
    }
  };

  const handleExport = () => {
    if (!filteredFolios?.length) return;
    
    const headers = ["Folio Number", "Guest Name", "Status", "Subtotal", "Tax", "Service Charge", "Total", "Paid", "Balance", "Created Date"];
    const rows = filteredFolios.map(f => [
      f.folio_number,
      `${f.guest?.first_name || ""} ${f.guest?.last_name || ""}`.trim(),
      f.status,
      Number(f.subtotal).toFixed(2),
      Number(f.tax_amount).toFixed(2),
      Number(f.service_charge).toFixed(2),
      Number(f.total_amount).toFixed(2),
      Number(f.paid_amount).toFixed(2),
      Number(f.balance).toFixed(2),
      format(new Date(f.created_at), "yyyy-MM-dd HH:mm"),
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `folios-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const handleBulkPaymentSuccess = () => {
    setSelectedFolioIds([]);
  };

  return (
    <div className="space-y-6">
      <FolioStatsBar stats={stats} isLoading={statsLoading} />

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by folio number, guest, or confirmation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <FolioFilters
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onExport={handleExport}
          resultsCount={filteredFolios?.length || 0}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => { 
        setActiveTab(v as "open" | "closed"); 
        setSelectedFolioIds([]); 
      }}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="open" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Open Folios
              {stats && <span className="ml-1 text-xs bg-primary/10 px-1.5 py-0.5 rounded">{stats.total_open}</span>}
            </TabsTrigger>
            <TabsTrigger value="closed" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Closed Folios
              {stats && <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded">{stats.total_closed}</span>}
            </TabsTrigger>
          </TabsList>
          
          {activeTab === "open" && selectedFoliosForPayment.length > 0 && (
            <Button onClick={() => setBulkPaymentOpen(true)}>
              <CreditCard className="h-4 w-4 mr-2" />
              Pay {selectedFoliosForPayment.length} Folio{selectedFoliosForPayment.length > 1 ? "s" : ""}
            </Button>
          )}
        </div>

        <TabsContent value="open" className="mt-6">
          {foliosLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : filteredFolios?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No open folios</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Open folios will appear here when guests check in
              </p>
            </div>
          ) : (
            <>
              {(filteredFolios?.some(f => Number(f.balance) > 0)) && (
                <div className="flex items-center gap-2 mb-4">
                  <Checkbox
                    checked={selectedFolioIds.length === filteredFolios?.filter(f => Number(f.balance) > 0).length && selectedFolioIds.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">
                    Select all with balance ({filteredFolios?.filter(f => Number(f.balance) > 0).length})
                  </span>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredFolios?.map((folio) => (
                  <div key={folio.id} className="relative">
                    {Number(folio.balance) > 0 && (
                      <div className="absolute top-2 left-2 z-10">
                        <Checkbox
                          checked={selectedFolioIds.includes(folio.id)}
                          onCheckedChange={() => handleToggleSelect(folio.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                    <FolioCard
                      folio={folio}
                      onClick={() => handleFolioClick(folio)}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="closed" className="mt-6">
          {foliosLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : filteredFolios?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No closed folios</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Closed folios will appear here after checkout
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredFolios?.map((folio) => (
                <FolioCard
                  key={folio.id}
                  folio={folio}
                  onClick={() => handleFolioClick(folio)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Folio Detail Drawer */}
      <FolioDetailDrawer
        folio={selectedFolio}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />

      {/* Bulk Payment Dialog */}
      <BulkPaymentDialog
        folios={selectedFoliosForPayment}
        open={bulkPaymentOpen}
        onOpenChange={setBulkPaymentOpen}
        onSuccess={handleBulkPaymentSuccess}
      />
    </div>
  );
}
