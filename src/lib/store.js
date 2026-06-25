import { supabase } from "./supabase";

// Lokálna cache zdieľaných dát. Naplní sa raz po prihlásení (loadAllData),
// komponenty z nej čítajú synchrónne a zápisy sa ukladajú do Supabase (debounce).
let cache = {};
const timers = {};

export async function loadAllData() {
  cache = {};
  if (!supabase) return cache;
  const { data, error } = await supabase.from("app_data").select("key,value");
  if (!error && Array.isArray(data)) {
    for (const row of data) cache[row.key] = row.value;
  }
  return cache;
}

export function getCached(key, initial) {
  return key in cache ? cache[key] : initial;
}

export function setCached(key, value) {
  cache[key] = value;
  if (!supabase) return;
  clearTimeout(timers[key]);
  timers[key] = setTimeout(() => {
    supabase
      .from("app_data")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" })
      .then(({ error }) => {
        if (error) console.warn("Uloženie zlyhalo pre", key, error.message);
      });
  }, 400);
}

export function resetCache() {
  cache = {};
}
