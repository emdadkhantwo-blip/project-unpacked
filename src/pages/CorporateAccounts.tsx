import { useState } from "react";
import {
  Briefcase,
  Search,
  Plus,
  MoreHorizontal,
  Trash2,
  Users,
  Percent,
  Eye,
  CheckCircle,
  Receipt,
  DollarSign,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useCorporateAccounts,
  useDeleteCorporateAccount,
  type CorporateAccount,
} from "@/hooks/useCorporateAccounts";
import { CreateCorporateAccountDialog } from "@/components/corporate/CreateCorporateAccountDialog";
import { CorporateAccountDetailDrawer } from "@/components/corporate/CorporateAccountDetailDrawer";
import { BulkCorporatePaymentDialog } from "@/components/corporate/BulkCorporatePaymentDialog";

export default function CorporateAccounts() {
  const [search, setSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<CorporateAccount | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAccount, setPaymentAccount] = useState<CorporateAccount | null>(null);

  const { data: accounts = [], isLoading } = useCorporateAccounts();
  const deleteAccount = useDeleteCorporateAccount();

  const filteredAccounts = accounts.filter(
    (account) =>
      account.company_name.toLowerCase().includes(search.toLowerCase()) ||
      account.account_code.toLowerCase().includes(search.toLowerCase()) ||
      account.contact_email?.toLowerCase().includes(search.toLowerCase())
  );

  const activeAccounts = accounts.filter((a) => a.is_active).length;
  const totalLinkedGuests = accounts.reduce(
    (acc, a) => acc + (a.linked_guests_count || 0),
    0
  );

  const handleViewAccount = (account: CorporateAccount) => {
    setSelectedAccount(account);
    setDrawerOpen(true);
  };

  const handleRecordPayment = (account: CorporateAccount) => {
    setPaymentAccount(account);
    setPaymentDialogOpen(true);
  };

  const handleDelete = (account: CorporateAccount) => {
    if (
      confirm(
        `Are you sure you want to delete ${account.company_name}? This will unlink all associated guests.`
      )
    ) {
      deleteAccount.mutate(account.id);
    }
  };

  const totalOutstandingBalance = accounts.reduce(
    (acc, a) => acc + (a.current_balance || 0),
    0
  );

  const statItems = [
    {
      label: "Total Accounts",
      value: accounts.length,
      icon: Briefcase,
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      label: "Active",
      value: activeAccounts,
      icon: CheckCircle,
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      label: "Outstanding Balance",
      value: `৳${totalOutstandingBalance.toLocaleString()}`,
      icon: DollarSign,
      gradient: "from-amber-500 to-orange-600",
    },
    {
      label: "Linked Guests",
      value: totalLinkedGuests,
      icon: Users,
      gradient: "from-purple-500 to-violet-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2 shadow-md">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            Corporate Accounts
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage corporate clients and travel agent accounts
          </p>
        </div>
        <Button 
          onClick={() => setCreateDialogOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-none shadow-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {statItems.map((item) => (
            <Card 
              key={item.label}
              className={cn(
                "relative overflow-hidden border-none shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5",
                `bg-gradient-to-br ${item.gradient}`
              )}
            >
              {/* Decorative circles */}
              <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white/10" />
              <div className="absolute -bottom-2 -left-2 h-12 w-12 rounded-full bg-white/5" />
              
              <CardContent className="relative z-10 flex items-center gap-3 p-4">
                <div className="rounded-xl bg-white/20 p-2.5">
                  <item.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{item.value}</p>
                  <p className="text-xs text-white/80 font-medium">{item.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Accounts Table */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div>
              <CardTitle>All Accounts</CardTitle>
              <CardDescription>
                View and manage corporate accounts
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search accounts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Guests</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-10 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">No accounts found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map((account) => (
                    <TableRow 
                      key={account.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-2 w-2 rounded-full",
                            account.is_active ? "bg-emerald-500" : "bg-slate-400"
                          )} />
                          <div>
                            <p className="font-medium">{account.company_name}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {account.account_code}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {account.contact_name && (
                            <p className="font-medium">{account.contact_name}</p>
                          )}
                          {account.contact_email && (
                            <p className="text-muted-foreground text-xs">
                              {account.contact_email}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {account.discount_percentage > 0 ? (
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-none shadow-sm">
                            <Percent className="h-3 w-3 mr-1" />
                            {account.discount_percentage}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <div className="rounded-full bg-purple-500/10 p-1">
                            <Users className="h-3 w-3 text-purple-500" />
                          </div>
                          <span className="font-medium">{account.linked_guests_count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {account.is_active ? (
                          <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-none shadow-sm">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem
                              onClick={() => handleViewAccount(account)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRecordPayment(account)}
                            >
                              <Receipt className="mr-2 h-4 w-4" />
                              Record Payment
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(account)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <CreateCorporateAccountDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Detail Drawer */}
      <CorporateAccountDetailDrawer
        account={selectedAccount}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onRecordPayment={handleRecordPayment}
      />

      {/* Bulk Payment Dialog */}
      <BulkCorporatePaymentDialog
        account={paymentAccount}
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
      />
    </div>
  );
}
