"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, LogOut, Trash2, Shield } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const [email, setEmail] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email ?? null);
        setCreatedAt(user.created_at ?? null);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleDeleteAccount = async () => {
    setDeleteError("");
    const supabase = createClient();
    const { error } = await supabase.rpc("delete_user");
    if (error) {
      setDeleteError("Could not delete account. Please contact support.");
      return;
    }
    await supabase.auth.signOut();
    router.push("/login");
  };

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="flex min-h-full flex-col bg-[var(--background)]">
      {/* Top bar */}
      <header className="flex items-center gap-3 border-b border-[var(--card-border)] bg-[var(--sidebar-bg)] px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </Link>
      </header>

      <main className="mx-auto w-full max-w-lg px-6 py-12">
        {/* Avatar & title */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)]/15 ring-1 ring-[var(--accent)]/30">
            <User className="h-7 w-7 text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--foreground)]">Your Profile</h1>
            <p className="text-xs text-[var(--muted)]">Manage your account</p>
          </div>
        </div>

        {/* Account info card */}
        <div className="mb-4 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] divide-y divide-[var(--card-border)]">
          <div className="flex items-center gap-3 px-5 py-4">
            <Mail className="h-4 w-4 text-[var(--muted)] flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-[var(--muted)]">Email address</p>
              <p className="truncate text-sm font-medium text-[var(--foreground)]">
                {loading ? "Loading…" : email ?? "—"}
              </p>
            </div>
          </div>

          {formattedDate && (
            <div className="flex items-center gap-3 px-5 py-4">
              <Shield className="h-4 w-4 text-[var(--muted)] flex-shrink-0" />
              <div>
                <p className="text-[10px] text-[var(--muted)]">Member since</p>
                <p className="text-sm font-medium text-[var(--foreground)]">{formattedDate}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className="mb-3 flex w-full items-center gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-5 py-3.5 text-sm font-medium text-[var(--foreground)] transition hover:border-red-400/30 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>

        {/* Danger zone */}
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
          <h2 className="mb-1 text-xs font-semibold text-red-400">Danger zone</h2>
          <p className="mb-4 text-xs text-[var(--muted)]">
            Permanently delete your account. This cannot be undone.
          </p>

          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-2 rounded-lg border border-red-500/30 px-4 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete account
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-medium text-red-400">Are you sure? This is permanent.</p>
              {deleteError && <p className="text-xs text-red-400">{deleteError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  className="rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-600"
                >
                  Yes, delete my account
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="rounded-lg border border-[var(--card-border)] px-4 py-2 text-xs text-[var(--muted)] transition hover:text-[var(--foreground)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
