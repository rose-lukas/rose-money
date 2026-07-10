"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { addMemberToAccount, removeMember } from "@/app/(authenticated)/settings/actions";

interface Member {
  id: string;
  role: string;
  joined_at: string;
  profiles: { id: string; display_name: string } | null;
}

export function MemberManager({
  members,
  isOwner,
}: {
  members: Member[];
  isOwner: boolean;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    if (!email.trim()) return;
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await addMemberToAccount(email.trim());
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess("Member added successfully.");
        setEmail("");
      }
    });
  }

  function handleRemove(memberId: string) {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await removeMember(memberId);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Account Members</h2>

      <div className="space-y-2">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div>
              <span className="font-medium">
                {m.profiles?.display_name ?? "Unknown"}
              </span>
              <span className="ml-2 text-xs text-muted-foreground capitalize">
                ({m.role})
              </span>
            </div>
            {isOwner && m.role !== "owner" && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => handleRemove(m.id)}
                disabled={isPending}
              >
                Remove
              </Button>
            )}
          </div>
        ))}
      </div>

      {isOwner && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Add a New Member</h3>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@example.com"
              className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button onClick={handleAdd} disabled={isPending || !email.trim()}>
              {isPending ? "Adding..." : "Add"}
            </Button>
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
          )}
        </div>
      )}
    </div>
  );
}
