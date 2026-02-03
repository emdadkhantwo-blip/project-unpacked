import { useState } from "react";
import { Search, Clock, CheckCircle, XCircle, ClipboardList } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminApplications, type AdminApplication } from "@/hooks/useAdminApplications";
import { ApplicationCard } from "@/components/admin/ApplicationCard";
import { ApplicationDetailDrawer } from "@/components/admin/ApplicationDetailDrawer";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminApplications() {
  const { data: applications, isLoading } = useAdminApplications();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<AdminApplication | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredApplications = applications?.filter(
    (app) =>
      app.hotel_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = applications?.filter((a) => a.status === "pending").length || 0;
  const approvedCount = applications?.filter((a) => a.status === "approved").length || 0;
  const rejectedCount = applications?.filter((a) => a.status === "rejected").length || 0;

  const handleApplicationClick = (application: AdminApplication) => {
    setSelectedApplication(application);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50">
                <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Pending</p>
                <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                  {isLoading ? <Skeleton className="h-9 w-12" /> : pendingCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50">
                <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Approved</p>
                <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                  {isLoading ? <Skeleton className="h-9 w-12" /> : approvedCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-200 dark:border-rose-800 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/50">
                <XCircle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-rose-600 dark:text-rose-400">Rejected</p>
                <p className="text-3xl font-bold text-rose-700 dark:text-rose-300">
                  {isLoading ? <Skeleton className="h-9 w-12" /> : rejectedCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Applications Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredApplications?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <ClipboardList className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No applications found</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
              {searchQuery
                ? "Try adjusting your search query"
                : "New applications will appear here when hotels apply"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredApplications?.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              onView={() => handleApplicationClick(application)}
            />
          ))}
        </div>
      )}

      {/* Detail Drawer */}
      <ApplicationDetailDrawer
        application={selectedApplication}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
