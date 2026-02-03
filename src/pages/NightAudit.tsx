import { useState } from 'react';
import { format } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useNightAudit } from '@/hooks/useNightAudit';
import { NightAuditJourney } from '@/components/night-audit/NightAuditJourney';
import { NightAuditHistory } from '@/components/night-audit/NightAuditHistory';
import { NightAuditDetailTabs } from '@/components/night-audit/NightAuditDetailTabs';
import { NightAuditExportButtons } from '@/components/night-audit/NightAuditExportButtons';
import { NightAuditTrendCharts } from '@/components/night-audit/NightAuditTrendCharts';
import { openNightAuditReportView } from '@/components/night-audit/NightAuditReportView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Moon, Calendar } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';
import { toast } from 'sonner';

export default function NightAudit() {
  const { tenant } = useTenant();
  const {
    currentAudit,
    auditHistory,
    preAuditData,
    auditStats,
    businessDate,
    roomDetails,
    guestDetails,
    outstandingFolios,
    paymentsByMethod,
    revenueByCategory,
    isLoading,
    isLoadingRoomDetails,
    startAudit,
    postRoomCharges,
    completeAudit,
    isStartingAudit,
    isPostingCharges,
    isCompletingAudit,
  } = useNightAudit();

  const [activeTab, setActiveTab] = useState('journey');

  const handleExportPDF = () => {
    toast.info("PDF export not available (night_audits table not configured)");
  };

  const handleExportCSV = (type?: string) => {
    toast.info("CSV export not available (night_audits table not configured)");
  };

  const handleViewReport = () => {
    setActiveTab('details');
  };

  // Calculate outstanding balance
  const outstandingBalance = outstandingFolios.reduce((sum, f) => sum + f.balance, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(262_60%_55%)] to-[hsl(217_91%_60%)]">
              <Moon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Night Audit</h1>
              <p className="text-sm text-muted-foreground">
                Close the business day with care and precision
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <NightAuditExportButtons
              onExportCSV={handleExportCSV}
              onExportPDF={handleExportPDF}
              isLoading={isLoading}
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Business Date: {format(new Date(businessDate), 'MMMM d, yyyy')}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="journey" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(262_60%_55%/0.1)] data-[state=active]:to-[hsl(217_91%_60%/0.1)]">
              Closing the Day
            </TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="history">History & Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="journey" className="space-y-6 mt-6">
            {isLoading ? (
              <Skeleton className="h-[600px] rounded-2xl" />
            ) : (
              <NightAuditJourney
                businessDate={businessDate}
                hotelName={tenant?.name}
                currentAudit={currentAudit}
                preAuditData={preAuditData}
                auditStats={auditStats}
                roomDetails={roomDetails}
                outstandingFoliosCount={outstandingFolios.length}
                outstandingBalance={outstandingBalance}
                onStartAudit={() => startAudit()}
                onPostCharges={() => postRoomCharges()}
                onCompleteAudit={(notes) => completeAudit()}
                onViewReport={handleViewReport}
                onExportPDF={handleExportPDF}
                isStarting={isStartingAudit}
                isPostingCharges={isPostingCharges}
                isCompleting={isCompletingAudit}
              />
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-6 mt-6">
            <NightAuditDetailTabs
              rooms={roomDetails}
              guests={guestDetails}
              outstandingFolios={outstandingFolios}
              paymentsByMethod={paymentsByMethod}
              revenueByCategory={revenueByCategory}
              totalRevenue={auditStats?.totalRevenue || 0}
              totalPayments={auditStats?.totalPayments || 0}
              isLoading={isLoadingRoomDetails}
            />
          </TabsContent>

          <TabsContent value="history" className="space-y-6 mt-6">
            <NightAuditTrendCharts audits={auditHistory} />
            <NightAuditHistory 
              audits={auditHistory} 
              isLoading={isLoading}
              onExportCSV={() => handleExportCSV('history')}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
