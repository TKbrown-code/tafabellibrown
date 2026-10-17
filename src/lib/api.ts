import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import type { Message, NewMessage, Post, Project, Skill } from "./types";
import { seedPosts, seedProjects, seedSkills } from "@/data/seed";
import axios from "axios";


const demo = {
  projects: structuredClone(seedProjects) as Project[],
  posts: structuredClone(seedPosts) as Post[],
  skills: structuredClone(seedSkills) as Skill[],
  messages: [
    {
      id: "m-1",
      name: "Lena Fischer",
      email: "lena@example.com",
      subject: "Remote frontend role",
      body: "Hi Tafa, we're hiring a remote React/TypeScript developer and your Dream Scholarships work caught our eye. Are you open to a quick call next week?",
      is_read: false,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    },
  ] as Message[],
};

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms));

type Table = "projects" | "posts" | "skills" | "messages";
type Row = { id: string };

async function list<T extends Row>(table: Table, opts: { admin?: boolean } = {}): Promise<T[]> {
  if (!supabase) {
    await wait(120);
    let rows = demo[table] as unknown as T[];
    if (!opts.admin && (table === "projects" || table === "posts")) rows = rows.filter((r) => (r as unknown as { published: boolean }).published);
    return sortRows(table, [...rows]);
  }
  
  let q = supabase.from(table).select("*");
  if (table === "projects" || table === "skills") q = q.order("sort_order", { ascending: true });
  if (table === "posts") q = q.order("published_at", { ascending: false });
  if (table === "messages") q = q.order("created_at", { ascending: false });
  if (!opts.admin && (table === "projects" || table === "posts")) q = q.eq("published", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as T[];
}

function sortRows<T>(table: Table, rows: T[]): T[] {
  const r = rows as unknown as Record<string, unknown>[];
  if (table === "projects" || table === "skills") r.sort((a, b) => (a.sort_order as number) - (b.sort_order as number));
  if (table === "posts") r.sort((a, b) => String(b.published_at).localeCompare(String(a.published_at)));
  if (table === "messages") r.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return rows;
}

async function upsert<T extends Row>(table: Table, row: Partial<T> & { id?: string }): Promise<T> {
  if (!supabase) {
    await wait();
    const rows = demo[table] as unknown as T[];
    if (row.id) {
      const i = rows.findIndex((r) => r.id === row.id);
      if (i >= 0) { rows[i] = { ...rows[i], ...row } as T; return rows[i]; }
    }
    const created = { ...row, id: row.id || uid() } as T;
    rows.push(created);
    return created;
  }
  const payload = { ...row } as Record<string, unknown>;
  if (!payload.id) delete payload.id; // new row → let Postgres generate the uuid
  const { data, error } = await supabase.from(table).upsert(payload).select().single();
  if (error) throw error;
  return data as T;
}

async function remove(table: Table, id: string) {
  if (!supabase) {
    await wait();
    const rows = demo[table] as unknown as Row[];
    const i = rows.findIndex((r) => r.id === id);
    if (i >= 0) rows.splice(i, 1);
    return;
  }
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

export async function sendMessage(m: NewMessage) {
  if (!supabase) {
    await wait(600);
    demo.messages.unshift({ ...m, id: uid(), is_read: false, created_at: new Date().toISOString() });
    return;
  }
  const { error } = await supabase.from("messages").insert({ name: m.name, email: m.email, subject: m.subject || null, body: m.body });
  if (error) throw error;
}


/* ---------------------------- Public hooks ---------------------------- */
export const useProjects = () => useQuery({ queryKey: ["projects"], queryFn: () => list<Project>("projects") });
export const usePosts = () => useQuery({ queryKey: ["posts"], queryFn: () => list<Post>("posts") });
export const useSkills = () => useQuery({ queryKey: ["skills"], queryFn: () => list<Skill>("skills") });

export const useSendMessage = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: sendMessage, onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "messages"] }) });
};


export const Beari = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60_000,
});

/* ----------------------------- Admin hooks ---------------------------- */
export const useAdminList = <T extends Row>(table: Table) =>
  useQuery({ queryKey: ["admin", table], queryFn: () => list<T>(table, { admin: true }) });

export const useAdminSave = <T extends Row>(table: Table) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (row: Partial<T> & { id?: string }) => upsert<T>(table, row),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", table] });
      qc.invalidateQueries({ queryKey: [table] });
    },
  });
};

export const useAdminDelete = (table: Table) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => remove(table, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", table] });
      qc.invalidateQueries({ queryKey: [table] });
    },
  });
};
