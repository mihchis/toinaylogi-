export type ItemType = 'actress' | 'movie';

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  total_spins: number;
  created_at: string;
};

export type InventoryItem = {
  id: string;
  user_id?: string;
  item_type: ItemType;
  item_id: string;
  item_name: string;
  item_subname?: string | null;
  tier: 0 | 1 | 2 | 3 | 4;
  image_url: string;
  metadata?: Record<string, unknown>;
  quantity: number;
  first_obtained_at: string;
  last_obtained_at: string;
};
