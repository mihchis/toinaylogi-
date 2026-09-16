'use client';

import { useState } from 'react';
import { LogIn, LogOut, Package, User as UserIcon } from 'lucide-react';
import { AuthDialog } from './auth-dialog';
import type { User } from '@supabase/supabase-js';

export function UserMenu({
  user,
  inventoryCount,
  onOpenInventory,
  onSignOut,
}: {
  user: User | null;
  inventoryCount: number;
  onOpenInventory: () => void;
  onSignOut: () => void;
}) {
  const [authOpen, setAuthOpen] = useState(false);

  if (!user) {
    return (
      <>
        <button
          type="button"
          className="user-action-btn login-btn"
          onClick={() => setAuthOpen(true)}
        >
          <LogIn size={15} />
          <span>Đăng nhập</span>
        </button>
        <button
          type="button"
          className="user-action-btn inventory-btn"
          onClick={onOpenInventory}
          title="Xem túi đồ"
        >
          <Package size={15} />
          <span>Túi đồ</span>
          {inventoryCount > 0 && (
            <span className="inventory-badge-count">{inventoryCount}</span>
          )}
        </button>
        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      </>
    );
  }

  const displayName =
    user.user_metadata?.display_name ||
    user.email?.split('@')[0] ||
    'Thành viên';

  return (
    <div className="user-logged-box">
      <button
        type="button"
        className="user-action-btn inventory-btn"
        onClick={onOpenInventory}
        title="Xem túi đồ"
      >
        <Package size={15} />
        <span>Túi đồ</span>
        {inventoryCount > 0 && (
          <span className="inventory-badge-count">{inventoryCount}</span>
        )}
      </button>

      <div className="user-profile-badge" title={user.email || ''}>
        <UserIcon size={14} />
        <span className="user-profile-name">{displayName}</span>
      </div>

      <button
        type="button"
        className="user-action-btn logout-btn"
        onClick={onSignOut}
        title="Đăng xuất"
      >
        <LogOut size={14} />
      </button>
    </div>
  );
}
