"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { assignUsersToProject } from "@/lib/actions/projects";
import { getDevelopers } from "@/lib/actions/users-new";
import { User } from "@prisma/client";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface AssignUserDialogProps {
  projectId: string;
  assignedUserIds?: string[];
}

export function AssignUserDialog({ projectId, assignedUserIds = [] }: AssignUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open, assignedUserIds]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const availableUsers = await getDevelopers();
      // Filter out users already assigned to the project
      const unassignedUsers = availableUsers.filter(
        user => !assignedUserIds.includes(user.id)
      );
      setUsers(unassignedUsers);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserToggle = (userId: string, checked: boolean) => {
    setSelectedUserIds(prev => 
      checked 
        ? [...prev, userId]
        : prev.filter(id => id !== userId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedUserIds(checked ? users.map(user => user.id) : []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedUserIds.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    setIsLoading(true);

    try {
      const result = await assignUsersToProject({
        projectId,
        userIds: selectedUserIds,
      });

      if (result.success) {
        toast.success(result.message || `Successfully assigned ${selectedUserIds.length} user(s) to project`);
        setOpen(false);
        setSelectedUserIds([]);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to assign users");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to assign users"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Members
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Team Members</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {loadingUsers ? (
              <div className="text-sm text-muted-foreground">
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                No available users to assign
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedUserIds.length === users.length}
                    onCheckedChange={handleSelectAll}
                    disabled={isLoading}
                  />
                  <Label htmlFor="select-all" className="text-sm font-medium">
                    Select All ({users.length} users)
                  </Label>
                </div>
                
                <ScrollArea className="h-[300px] w-full border rounded-md p-3">
                  <div className="space-y-3">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
                        <Checkbox
                          id={user.id}
                          checked={selectedUserIds.includes(user.id)}
                          onCheckedChange={(checked) => handleUserToggle(user.id, checked as boolean)}
                          disabled={isLoading}
                        />
                        <div className="flex-1">
                          <Label htmlFor={user.id} className="text-sm font-medium cursor-pointer">
                            {user.firstName} {user.lastName}
                          </Label>
                          <div className="text-xs text-muted-foreground">
                            {user.role.toLowerCase()} • {user.email}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                {selectedUserIds.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {selectedUserIds.length} user{selectedUserIds.length !== 1 ? 's' : ''} selected
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || selectedUserIds.length === 0}
            >
              {isLoading ? "Assigning..." : `Assign ${selectedUserIds.length || ''} User${selectedUserIds.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
