// Supabase connection for sync. These values are PUBLIC by design (the publishable/anon key
// only allows what Row Level Security permits). Leave both empty to run in local-only mode.
window.SCHED_CONFIG = {
  SUPABASE_URL: 'https://clpwvixdvzjvmnsuukbj.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_htREBUp_TWmtSWcqf4Im1Q_RqWmMZl3',
  // Web Push public key (VAPID). The matching private key is only in Supabase (Vault), never in this repo.
  VAPID_PUBLIC_KEY: 'BDl-x82qoDPELgv5TjdKrC4z7uHq2aSSDbRjNpwwyPeIcBcBZB2kIi81PRDbaPmvJ0zSsVVt0BtKY0nLEvzWuuI',
};
