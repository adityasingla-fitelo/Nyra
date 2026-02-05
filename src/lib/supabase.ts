import { createClient } from "@supabase/supabase-js";

// ─── Supabase Client ─────────────────────────────────────────────────
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Auth Helpers (Google) ───────────────────────────────────────────

export const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
    },
  });

  if (error) throw error;
};

export const signOut = async () => {
  await supabase.auth.signOut();
};

export const getCurrentSession = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};

// ─── Types ───────────────────────────────────────────────────────────

export interface UserRow {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  login_method: "google";
  created_at?: string;
}

export interface PersonaRow {
  id?: string;
  user_id: string;
  age?: number;
  height_cm?: number;
  weight_kg?: number;
  gender?: string;
  occupation?: string;
  wake_time?: string;
  sleep_time?: string;
  activity_type?: string;
  activity_frequency?: string;
  activity_duration?: string;
  health_goal?: string;
  diet_preference?: string;
  medical_conditions?: string;
  water_intake?: string;
  stress_level?: string;
  created_at?: string;
}

export interface ChatRow {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
}

export interface MessageRow {
  id: string;
  chat_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

// ─── User Helpers (SAFE & RLS FRIENDLY) ───────────────────────────────

export async function upsertGoogleUser(): Promise<UserRow> {
  const session = await getCurrentSession();
  if (!session?.user) {
    throw new Error("No active Supabase session");
  }

  const authUser = session.user;

  const payload: UserRow = {
    id: authUser.id,
    email: authUser.email!,
    name: authUser.user_metadata?.full_name || "User",
    avatar_url: authUser.user_metadata?.avatar_url,
    login_method: "google",
  };

  // IMPORTANT: maybeSingle() — does NOT throw if row doesn't exist
  const { data: existing, error: fetchError } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  if (fetchError) {
    console.error("User fetch error:", fetchError);
    throw fetchError;
  }

  if (existing) {
    return existing as UserRow;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("users")
    .insert(payload)
    .select()
    .single();

  if (insertError) {
    console.error("User insert error:", insertError);
    throw insertError;
  }

  return inserted as UserRow;
}

// ─── Persona Helpers ─────────────────────────────────────────────────

export async function savePersona(persona: Partial<PersonaRow>) {
  if (!persona.user_id) throw new Error("user_id required");

  const cleanPersona: Record<string, any> = {};
  for (const [key, val] of Object.entries(persona)) {
    if (val !== undefined && val !== null && val !== "") {
      cleanPersona[key] = val;
    }
  }

  const { data: existing, error: fetchError } = await supabase
    .from("personas")
    .select("id")
    .eq("user_id", persona.user_id)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (existing) {
    const { data, error } = await supabase
      .from("personas")
      .update(cleanPersona)
      .eq("user_id", persona.user_id)
      .select()
      .single();
    if (error) throw error;
    return data as PersonaRow;
  }

  const { data, error } = await supabase
    .from("personas")
    .insert(cleanPersona)
    .select()
    .single();

  if (error) throw error;
  return data as PersonaRow;
}

export async function getPersona(userId: string) {
  const { data } = await supabase
    .from("personas")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return data as PersonaRow | null;
}

// ─── Chat Helpers ────────────────────────────────────────────────────

export async function createChat(userId: string, title: string) {
  const { data, error } = await supabase
    .from("chats")
    .insert({ user_id: userId, title })
    .select()
    .single();
  if (error) throw error;
  return data as ChatRow;
}

export async function updateChatTitle(chatId: string, title: string) {
  await supabase.from("chats").update({ title }).eq("id", chatId);
}

export async function getChats(userId: string) {
  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as ChatRow[];
}

export async function getMessages(chatId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as MessageRow[];
}

export async function saveMessage(msg: Partial<MessageRow>) {
  const { data, error } = await supabase
    .from("messages")
    .insert(msg)
    .select()
    .single();
  if (error) throw error;
  return data as MessageRow;
}

export async function deleteChat(chatId: string) {
  await supabase.from("messages").delete().eq("chat_id", chatId);
  await supabase.from("chats").delete().eq("id", chatId);
}
