"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateProfile, uploadAvatar } from "@/app/(authenticated)/settings/actions";

interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

export function ProfileManager({ profiles }: { profiles: Profile[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);

  async function handleSave(id: string) {
    if (!editName.trim()) return;
    await updateProfile(id, editName.trim());
    setEditingId(null);
  }

  async function handleAvatarUpload(id: string, file: File) {
    setUploading(id);
    const formData = new FormData();
    formData.set("avatar", file);
    await uploadAvatar(id, formData);
    setUploading(null);
  }

  return (
    <section className="rounded-lg border p-4 space-y-4">
      <h2 className="text-lg font-semibold">User Profiles</h2>
      <p className="text-sm text-muted-foreground">
        Edit display names and avatars. Names appear throughout the app.
      </p>

      <div className="space-y-4">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className="flex items-center gap-4 rounded-md border p-3"
          >
            {/* Avatar */}
            <label className="relative cursor-pointer group shrink-0">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-primary transition-colors">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-medium text-muted-foreground">
                    {profile.display_name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs">
                  {uploading === profile.id ? "..." : "Edit"}
                </span>
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarUpload(profile.id, file);
                }}
              />
            </label>

            {/* Name */}
            <div className="flex-1 min-w-0">
              {editingId === profile.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave(profile.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="flex h-8 flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSave(profile.id)}
                  >
                    ✓
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingId(null)}
                  >
                    ✕
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {profile.display_name}
                  </span>
                  <button
                    onClick={() => {
                      setEditingId(profile.id);
                      setEditName(profile.display_name);
                    }}
                    className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Edit Name
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
