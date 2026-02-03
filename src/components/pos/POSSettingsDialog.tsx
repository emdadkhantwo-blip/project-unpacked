import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical } from "lucide-react";
import {
  POSOutlet,
  POSCategory,
  POSItem,
  useUpdatePOSOutlet,
  usePOSCategories,
  usePOSItems,
  useCreatePOSCategory,
  useDeletePOSCategory,
  useUpdatePOSCategoryOrder,
  useCreatePOSItem,
  useUpdatePOSItem,
  useDeletePOSItem,
} from "@/hooks/usePOS";
import { toast } from "sonner";

interface POSSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outlet?: POSOutlet;
}

export function POSSettingsDialog({ open, onOpenChange, outlet }: POSSettingsDialogProps) {
  const [outletName, setOutletName] = useState("");
  const [isActive, setIsActive] = useState(true);

  // New item form
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemCode, setNewItemCode] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemCategoryId, setNewItemCategoryId] = useState<string | null>(null);

  // Delete confirmation state
  const [categoryToDelete, setCategoryToDelete] = useState<POSCategory | null>(null);
  const [itemToDelete, setItemToDelete] = useState<POSItem | null>(null);

  const { data: categories = [] } = usePOSCategories(outlet?.id);
  const { data: items = [] } = usePOSItems(outlet?.id);

  const updateOutlet = useUpdatePOSOutlet();
  const createCategory = useCreatePOSCategory();
  const deleteCategory = useDeletePOSCategory();
  const updateCategoryOrder = useUpdatePOSCategoryOrder();
  const createItem = useCreatePOSItem();
  const updateItem = useUpdatePOSItem();
  const deleteItem = useDeletePOSItem();

  useEffect(() => {
    if (outlet) {
      setOutletName(outlet.name);
      setIsActive(outlet.is_active);
    }
  }, [outlet]);

  const handleSaveOutlet = () => {
    if (!outlet) return;
    updateOutlet.mutate({
      id: outlet.id,
      updates: { name: outletName, is_active: isActive },
    });
  };

  const handleAddCategory = () => {
    if (!outlet || !newCategoryName.trim()) return;
    createCategory.mutate(
      { outlet_id: outlet.id, name: newCategoryName, sort_order: categories.length },
      { onSuccess: () => setNewCategoryName("") }
    );
  };

  const handleDeleteCategory = () => {
    if (!categoryToDelete) return;
    deleteCategory.mutate(categoryToDelete.id, {
      onSuccess: () => setCategoryToDelete(null),
    });
  };

  const handleDeleteItem = () => {
    if (!itemToDelete) return;
    deleteItem.mutate(itemToDelete.id, {
      onSuccess: () => setItemToDelete(null),
    });
  };

  const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === categories.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newCategories = [...categories];
    const [moved] = newCategories.splice(index, 1);
    newCategories.splice(newIndex, 0, moved);

    const updates = newCategories.map((cat, idx) => ({
      id: cat.id,
      sort_order: idx,
    }));

    updateCategoryOrder.mutate(updates);
  };

  const handleAddItem = () => {
    if (!outlet || !newItemName.trim() || !newItemCode.trim() || !newItemPrice) {
      toast.error("Please fill in all required fields");
      return;
    }

    createItem.mutate(
      {
        outlet_id: outlet.id,
        category_id: newItemCategoryId || undefined,
        name: newItemName,
        code: newItemCode.toUpperCase(),
        description: newItemDescription || undefined,
        price: parseFloat(newItemPrice),
      },
      {
        onSuccess: () => {
          setNewItemName("");
          setNewItemCode("");
          setNewItemPrice("");
          setNewItemDescription("");
          setNewItemCategoryId(null);
        },
      }
    );
  };

  const handleToggleItemAvailability = (itemId: string, isAvailable: boolean) => {
    updateItem.mutate({ id: itemId, updates: { is_available: isAvailable } });
  };

  if (!outlet) return null;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Outlet Settings - {outlet.name}</DialogTitle>
          <DialogDescription>
            Manage outlet settings, categories, and menu items.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="menu">Menu Items</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Outlet Name</Label>
              <Input
                value={outletName}
                onChange={(e) => setOutletName(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Active</Label>
                <p className="text-sm text-muted-foreground">
                  Inactive outlets won't appear in POS
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
            <Button onClick={handleSaveOutlet} disabled={updateOutlet.isPending}>
              {updateOutlet.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </TabsContent>

          <TabsContent value="categories" className="mt-4">
            <div className="mb-4 flex gap-2">
              <Input
                placeholder="New category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <Button onClick={handleAddCategory} disabled={createCategory.isPending}>
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {categories.map((category, index) => (
                  <Card key={category.id}>
                    <CardContent className="flex items-center gap-3 p-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 font-medium">{category.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {items.filter((i) => i.category_id === category.id).length} items
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleMoveCategory(index, 'up')}
                          disabled={index === 0 || updateCategoryOrder.isPending}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleMoveCategory(index, 'down')}
                          disabled={index === categories.length - 1 || updateCategoryOrder.isPending}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setCategoryToDelete(category)}
                          disabled={deleteCategory.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {categories.length === 0 && (
                  <p className="py-8 text-center text-muted-foreground">
                    No categories yet. Add one above.
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="menu" className="mt-4">
            <Card className="mb-4">
              <CardContent className="space-y-3 p-4">
                <h4 className="font-medium">Add New Item</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Name *</Label>
                    <Input
                      placeholder="e.g., Caesar Salad"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Code *</Label>
                    <Input
                      placeholder="e.g., CS01"
                      value={newItemCode}
                      onChange={(e) => setNewItemCode(e.target.value.toUpperCase())}
                      maxLength={10}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Price *</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Category</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      value={newItemCategoryId || ""}
                      onChange={(e) => setNewItemCategoryId(e.target.value || null)}
                    >
                      <option value="">Uncategorized</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Description</Label>
                  <Input
                    placeholder="Optional description"
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddItem} disabled={createItem.isPending}>
                  <Plus className="mr-2 h-4 w-4" />
                  {createItem.isPending ? "Adding..." : "Add Item"}
                </Button>
              </CardContent>
            </Card>

            <ScrollArea className="h-[250px]">
              <div className="space-y-2">
                {items.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="flex items-center gap-3 p-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-xs text-muted-foreground">{item.code}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          ${Number(item.price).toFixed(2)}
                          {item.category?.name && ` • ${item.category.name}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Available</Label>
                        <Switch
                          checked={item.is_available}
                          onCheckedChange={(checked) =>
                            handleToggleItemAvailability(item.id, checked)
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setItemToDelete(item)}
                          disabled={deleteItem.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {items.length === 0 && (
                  <p className="py-8 text-center text-muted-foreground">
                    No menu items yet. Add one above.
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

      {/* Delete Category Confirmation Dialog */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the category "{categoryToDelete?.name}"? 
              {items.filter(i => i.category_id === categoryToDelete?.id).length > 0 && (
                <span className="block mt-2 text-amber-600 font-medium">
                  This category has {items.filter(i => i.category_id === categoryToDelete?.id).length} menu item(s) that will become uncategorized.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCategory.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Item Confirmation Dialog */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Menu Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteItem.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
