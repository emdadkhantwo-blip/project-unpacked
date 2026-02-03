import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NightAuditExportButtonsProps {
  onExportCSV: (type: 'summary' | 'detailed' | 'history') => void;
  onExportPDF: () => void;
  isLoading?: boolean;
}

export function NightAuditExportButtons({
  onExportCSV,
  onExportPDF,
  isLoading = false,
}: NightAuditExportButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isLoading}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onExportCSV('summary')}>
            Summary Report
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExportCSV('detailed')}>
            Detailed Report (Rooms & Guests)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onExportCSV('history')}>
            Audit History (30 Days)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Button variant="outline" size="sm" onClick={onExportPDF} disabled={isLoading}>
        <FileText className="h-4 w-4 mr-2" />
        Export PDF
      </Button>
    </div>
  );
}
