"use client";

import { useOptimistic, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Dices, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  addActivity,
  addStarterIdeas,
  deleteActivity,
  setActivityDone,
} from "@/app/(app)/activities/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORIES, type Activity, type Category } from "@/lib/activities";
import { cn } from "@/lib/utils";

/** Added optimistically, not saved yet — can't be toggled or deleted. */
const isTemp = (a: Activity) => a.id.startsWith("temp-");

type OptimisticAction =
  | { type: "toggle"; id: string; done: boolean }
  | { type: "delete"; id: string }
  | { type: "add"; activity: Activity };

function applyOptimistic(list: Activity[], action: OptimisticAction): Activity[] {
  switch (action.type) {
    case "toggle":
      return list.map((a) =>
        a.id === action.id ? { ...a, done: action.done, done_at: action.done ? new Date().toISOString() : null } : a,
      );
    case "delete":
      return list.filter((a) => a.id !== action.id);
    case "add":
      return [action.activity, ...list];
  }
}

/** With a friendshipId this edits that friendship's shared list. */
export function ActivityBoard({
  activities: serverActivities,
  friendshipId,
}: {
  activities: Activity[];
  friendshipId?: string;
}) {
  const [tab, setTab] = useState<"todo" | "done">("todo");
  const [pending, startTransition] = useTransition();
  // Changes show instantly; the server result replaces them when it arrives.
  const [activities, addOptimistic] = useOptimistic(serverActivities, applyOptimistic);

  const todo = activities.filter((a) => !a.done);
  const done = activities.filter((a) => a.done);
  const shown = tab === "todo" ? todo : done;

  function run(optimistic: OptimisticAction | null, action: () => Promise<void>, success?: string) {
    startTransition(async () => {
      if (optimistic) addOptimistic(optimistic);
      try {
        await action();
        if (success) toast.success(success);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Bir şeyler ters gitti");
      }
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <section>
        <div className="mb-4 flex gap-2">
          <TabButton active={tab === "todo"} onClick={() => setTab("todo")}>
            Yapılacaklar <span className="opacity-60">{todo.length}</span>
          </TabButton>
          <TabButton active={tab === "done"} onClick={() => setTab("done")}>
            Yaptıklarımız <span className="opacity-60">{done.length}</span>
          </TabButton>
        </div>

        {activities.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-border px-6 py-14 text-center">
            <Sparkles className="size-8 text-primary/70" />
            <p className="text-muted-foreground">Henüz bir aktivite yok. Kendin ekle ya da birkaç fikirle başla.</p>
            <Button
              size="lg"
              className="rounded-full px-5"
              disabled={pending}
              onClick={() => run(null, () => addStarterIdeas(friendshipId), "Fikirler eklendi ✨")}
            >
              {pending ? <Loader2 className="animate-spin" /> : <Sparkles />} Hazır fikirleri ekle
            </Button>
          </div>
        ) : shown.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">
            {tab === "todo" ? "Hepsini yaptık! Yeni bir şey ekleyelim mi? 🎉" : "Henüz tamamlanan yok."}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {shown.map((a) => (
                <motion.li
                  key={a.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs"
                >
                  <button
                    type="button"
                    aria-label={a.done ? "Yapılmadı olarak işaretle" : "Yaptık olarak işaretle"}
                    disabled={isTemp(a)}
                    onClick={() =>
                      run(
                        { type: "toggle", id: a.id, done: !a.done },
                        () => setActivityDone(a.id, !a.done),
                        a.done ? undefined : "Bir anı daha 💕",
                      )
                    }
                    className={cn(
                      "mt-0.5 flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-primary/40 transition-colors hover:border-primary",
                      a.done && "border-primary bg-primary text-primary-foreground",
                    )}
                  >
                    {a.done ? <Check className="size-3.5" strokeWidth={3} /> : null}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={cn("font-semibold", a.done && "text-muted-foreground line-through")}>{a.title}</p>
                    {a.description ? <p className="text-sm text-muted-foreground">{a.description}</p> : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {CATEGORIES[a.category].emoji} {CATEGORIES[a.category].label}
                      {a.done_at ? ` · ${new Date(a.done_at).toLocaleDateString("tr-TR")}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Sil"
                    disabled={isTemp(a)}
                    onClick={() => run({ type: "delete", id: a.id }, () => deleteActivity(a.id))}
                    className="cursor-pointer rounded-full p-1.5 text-muted-foreground opacity-60 transition hover:bg-accent hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>

      <aside className="flex flex-col gap-5">
        <RandomPicker options={todo} />
        <AddForm
          onAdd={(input) =>
            run(
              {
                type: "add",
                activity: {
                  id: `temp-${crypto.randomUUID()}`,
                  title: input.title.trim(),
                  description: input.description.trim() || null,
                  category: input.category,
                  done: false,
                  done_at: null,
                  created_at: new Date().toISOString(),
                },
              },
              () => addActivity(input, friendshipId),
            )
          }
        />
      </aside>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

function RandomPicker({ options }: { options: Activity[] }) {
  const [current, setCurrent] = useState<Activity | null>(null);
  const [spinning, setSpinning] = useState(false);

  function spin() {
    if (options.length === 0 || spinning) return;
    setSpinning(true);
    let ticks = 0;
    const total = 14 + Math.floor(Math.random() * 6);
    const step = () => {
      setCurrent(options[Math.floor(Math.random() * options.length)]);
      ticks++;
      if (ticks < total) setTimeout(step, 50 + ticks * 12);
      else setSpinning(false);
    };
    step();
  }

  return (
    <div className="overflow-hidden rounded-3xl bg-linear-to-br from-rose-200 via-rose-100 to-orange-100 p-5">
      <p className="font-hand text-2xl text-rose-ink">Bugün ne yapsak?</p>
      <div className="my-4 flex min-h-20 items-center justify-center rounded-2xl bg-white/70 px-4 py-3 text-center">
        <AnimatePresence mode="popLayout">
          <motion.p
            key={current?.id ?? "empty"}
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.12 }}
            className={cn("font-heading text-lg font-semibold text-rose-ink", !current && "text-rose-ink/50")}
          >
            {current ? `${CATEGORIES[current.category].emoji} ${current.title}` : options.length ? "Zarı at!" : "Önce bir aktivite ekle"}
          </motion.p>
        </AnimatePresence>
      </div>
      <Button size="lg" className="w-full rounded-full" disabled={spinning || options.length === 0} onClick={spin}>
        <Dices className={cn(spinning && "animate-spin")} /> Rastgele seç
      </Button>
    </div>
  );
}

function AddForm({
  onAdd,
}: {
  onAdd: (input: { title: string; description: string; category: Category }) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("evde");

  return (
    <form
      className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onAdd({ title, description, category });
        setTitle("");
        setDescription("");
      }}
    >
      <p className="font-heading text-lg font-semibold text-rose-ink">Yeni aktivite</p>
      <Input placeholder="Ne yapalım?" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} required />
      <Input
        placeholder="Kısa bir not (isteğe bağlı)"
        value={description}
        maxLength={300}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(CATEGORIES) as Category[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setCategory(key)}
            className={cn(
              "cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors",
              category === key ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent",
            )}
          >
            {CATEGORIES[key].emoji} {CATEGORIES[key].label}
          </button>
        ))}
      </div>
      <Button type="submit" size="lg" className="rounded-full" disabled={!title.trim()}>
        <Plus /> Ekle
      </Button>
    </form>
  );
}
