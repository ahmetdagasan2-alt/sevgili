"use client";

import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Clock, Eye, Footprints, RotateCcw, Trophy } from "lucide-react";
import { toast } from "sonner";
import { saveScore } from "@/app/(app)/games/puzzle/actions";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/format";
import { GRID_LABELS, GRID_SIZES, isSolved, shuffledBoard, type GridSize } from "@/lib/puzzle";
import type { BestScore } from "@/lib/scores";
import { cn } from "@/lib/utils";

type Props = {
  photo: { id: string; url: string; width: number; height: number };
  initialSize: GridSize;
  initialBoard: number[];
  bests: Record<number, BestScore>;
  /** Set for photos in a shared album: the friend's records to race against. */
  rival?: { name: string; bests: Record<number, BestScore> };
};

export function PuzzleGame({ photo, initialSize, initialBoard, bests: initialBests, rival }: Props) {
  const [gridSize, setGridSize] = useState<GridSize>(initialSize);
  const [bests, setBests] = useState(initialBests);
  const bestScore = bests[gridSize] ?? null;
  const rivalScore = rival?.bests[gridSize] ?? null;
  const [board, setBoard] = useState(initialBoard);
  const [moves, setMoves] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [solved, setSolved] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [peek, setPeek] = useState(false);
  const [result, setResult] = useState<{ seconds: number; moves: number } | null>(null);

  // Keyboard users swap with Enter/Space via the tap-to-swap click handler.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const justDragged = useRef(false);

  useEffect(() => {
    if (startedAt === null || solved) return;
    const id = setInterval(() => setElapsed(Math.floor((now() - startedAt) / 1000)), 500);
    return () => clearInterval(id);
  }, [startedAt, solved]);

  function swap(a: number, b: number) {
    if (a === b || solved) return;
    const next = [...board];
    [next[a], next[b]] = [next[b], next[a]];
    const nextMoves = moves + 1;
    setBoard(next);
    setMoves(nextMoves);
    const start = startedAt ?? now();
    if (startedAt === null) setStartedAt(start);
    if (isSolved(next)) finish(nextMoves, Math.max(1, Math.round((now() - start) / 1000)));
  }

  async function finish(finalMoves: number, seconds: number) {
    setResult({ seconds, moves: finalMoves });
    setElapsed(seconds);
    setSolved(true);
    setSelected(null);
    celebrate();
    const isRecord = !bestScore || seconds < bestScore.seconds;
    if (isRecord) setBests((b) => ({ ...b, [gridSize]: { seconds, moves: finalMoves } }));
    try {
      await saveScore({ photoId: photo.id, gridSize, moves: finalMoves, seconds });
      if (rival && rivalScore && seconds < rivalScore.seconds && (!bestScore || bestScore.seconds >= rivalScore.seconds)) {
        toast.success(`${rival.name} kişisini geçtin! 🏆`);
      } else if (isRecord && bestScore) {
        toast.success("Yeni rekor! 🏆");
      }
    } catch {
      toast.error("Skor kaydedilemedi");
    }
  }

  function restart(size: GridSize = gridSize) {
    setBoard(shuffledBoard(size * size));
    setMoves(0);
    setStartedAt(null);
    setElapsed(0);
    setSolved(false);
    setSelected(null);
    setResult(null);
  }

  function changeSize(size: GridSize) {
    if (size === gridSize) return;
    setGridSize(size);
    restart(size);
    window.history.replaceState(null, "", `?size=${size}`);
  }

  function handleTap(slot: number) {
    if (solved || justDragged.current) return;
    if (selected === null) setSelected(slot);
    else {
      swap(selected, slot);
      setSelected(null);
    }
  }

  function onDragStart(e: DragStartEvent) {
    setDragging(Number(e.active.id));
    setSelected(null);
  }

  function onDragEnd(e: DragEndEvent) {
    setDragging(null);
    // Some browsers fire a click right after the pointer is released.
    justDragged.current = true;
    setTimeout(() => (justDragged.current = false), 0);
    if (e.over) swap(Number(e.active.id), Number(e.over.id));
  }

  const ratio = photo.width / photo.height;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
      <div className="flex flex-col items-center">
        <div
          className="relative overflow-hidden rounded-2xl bg-blush shadow-xl ring-4 ring-card"
          style={{ aspectRatio: `${photo.width} / ${photo.height}`, width: `min(100%, calc(68vh * ${ratio}))` }}
        >
          <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
            <div
              className="grid size-full"
              style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`, gridTemplateRows: `repeat(${gridSize}, 1fr)` }}
            >
              {board.map((piece, slot) => (
                <Slot
                  key={slot}
                  slot={slot}
                  piece={piece}
                  gridSize={gridSize}
                  url={photo.url}
                  selected={selected === slot}
                  hidden={dragging === slot}
                  disabled={solved}
                  onTap={() => handleTap(slot)}
                />
              ))}
            </div>
            <DragOverlay dropAnimation={{ duration: 180 }}>
              {dragging !== null ? (
                <PieceImage
                  piece={board[dragging]}
                  gridSize={gridSize}
                  url={photo.url}
                  className="size-full scale-105 rounded-md shadow-2xl ring-2 ring-white"
                />
              ) : null}
            </DragOverlay>
          </DndContext>

          <AnimatePresence>
            {(solved || peek) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: solved ? 0.8 : 0.15 }}
                className="pointer-events-none absolute inset-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt="" className="size-full object-cover" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Parçaları sürükleyip bırak ya da iki parçaya sırayla dokunarak yerlerini değiştir.
        </p>
      </div>

      <aside className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Stat icon={Clock} label="Süre" value={formatDuration(elapsed)} />
          <Stat icon={Footprints} label="Hamle" value={String(moves)} />
        </div>
        {rival ? (
          <div className="rounded-2xl border border-border bg-card p-4 text-sm">
            <p className="mb-2 flex items-center gap-1.5 text-muted-foreground">
              <Trophy className="size-4 text-amber-500" /> Yarışma · {GRID_LABELS[gridSize]}
            </p>
            <ScoreRow name="Sen" score={bestScore} leader={leads(bestScore, rivalScore)} />
            <ScoreRow name={rival.name} score={rivalScore} leader={leads(rivalScore, bestScore)} />
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <Trophy className="size-5 text-amber-500" />
            <div className="text-sm">
              <p className="text-muted-foreground">En iyi ({GRID_LABELS[gridSize]})</p>
              <p className="font-semibold">
                {bestScore ? `${formatDuration(bestScore.seconds)} · ${bestScore.moves} hamle` : "Henüz yok"}
              </p>
            </div>
          </div>
        )}

        <AnimatePresence>
          {solved && result && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-primary p-5 text-primary-foreground"
            >
              <p className="font-hand text-3xl">Tamamladın! 💖</p>
              <p className="mt-1 text-sm opacity-90">
                {formatDuration(result.seconds)} sürede, {result.moves} hamlede.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap gap-2">
          <Button size="lg" className="rounded-full px-4" onClick={() => restart()}>
            <RotateCcw /> {solved ? "Tekrar oyna" : "Yeniden karıştır"}
          </Button>
          {!solved && (
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-4"
              onPointerDown={() => setPeek(true)}
              onPointerUp={() => setPeek(false)}
              onPointerLeave={() => setPeek(false)}
              onPointerCancel={() => setPeek(false)}
              onContextMenu={(e) => e.preventDefault()}
            >
              <Eye /> Basılı tut: ipucu
            </Button>
          )}
        </div>

        <div className="mt-2">
          <p className="mb-2 text-sm text-muted-foreground">Zorluk</p>
          <div className="flex flex-wrap gap-2">
            {GRID_SIZES.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={s === gridSize ? "default" : "outline"}
                className="rounded-full px-3"
                aria-pressed={s === gridSize}
                onClick={() => changeSize(s)}
              >
                {GRID_LABELS[s]}
              </Button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

function Slot({
  slot,
  piece,
  gridSize,
  url,
  selected,
  hidden,
  disabled,
  onTap,
}: {
  slot: number;
  piece: number;
  gridSize: number;
  url: string;
  selected: boolean;
  hidden: boolean;
  disabled: boolean;
  onTap: () => void;
}) {
  const { setNodeRef: setDragRef, listeners, attributes } = useDraggable({ id: slot, disabled });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: slot, disabled });

  return (
    <div ref={setDropRef} className={cn("relative p-px transition-colors", isOver && !hidden && "bg-primary/60")}>
      <button
        ref={setDragRef}
        type="button"
        {...listeners}
        {...attributes}
        aria-label={`Parça ${slot + 1}`}
        onClick={onTap}
        className={cn(
          "relative block size-full touch-none overflow-hidden rounded-[3px] outline-none transition-[transform,opacity] duration-150 focus-visible:ring-4 focus-visible:ring-primary",
          !disabled && "cursor-grab active:cursor-grabbing",
          selected && "z-10 scale-[0.92]",
          hidden && "opacity-30",
          isOver && !hidden && "scale-95",
        )}
      >
        <PieceImage piece={piece} gridSize={gridSize} url={url} className="size-full" />
        {selected ? (
          // Inset so the board's rounded overflow can't clip it; visible on any photo colour.
          <span className="pointer-events-none absolute inset-0 animate-pulse rounded-[3px] border-4 border-white shadow-[inset_0_0_0_4px_var(--primary),0_0_0_2px_var(--primary)]" />
        ) : null}
      </button>
    </div>
  );
}

function PieceImage({
  piece,
  gridSize,
  url,
  className,
}: {
  piece: number;
  gridSize: number;
  url: string;
  className?: string;
}) {
  const row = Math.floor(piece / gridSize);
  const col = piece % gridSize;
  const step = 100 / (gridSize - 1);
  return (
    <div
      className={className}
      style={{
        backgroundImage: `url("${url}")`,
        backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
        backgroundPosition: `${col * step}% ${row * step}%`,
      }}
    />
  );
}

/** Faster time wins; fewer moves breaks a tie. */
function leads(a: BestScore, b: BestScore) {
  if (!a) return false;
  if (!b) return true;
  return a.seconds < b.seconds || (a.seconds === b.seconds && a.moves < b.moves);
}

function ScoreRow({ name, score, leader }: { name: string; score: BestScore; leader: boolean }) {
  return (
    <div className={cn("flex items-center justify-between rounded-xl px-2 py-1.5", leader && "bg-amber-50")}>
      <span className="truncate font-medium">
        {leader ? "👑 " : ""}
        {name}
      </span>
      <span className="shrink-0 tabular-nums text-muted-foreground">
        {score ? `${formatDuration(score.seconds)} · ${score.moves} hamle` : "henüz yok"}
      </span>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </p>
      <p className="mt-1 font-heading text-2xl font-semibold tabular-nums text-rose-ink">{value}</p>
    </div>
  );
}

// Only ever called from event handlers / timers, never during render.
function now() {
  return Date.now();
}

function celebrate() {
  const colors = ["#e11d48", "#fb7185", "#fda4af", "#fde68a", "#ffffff"];
  const heart = confetti.shapeFromPath({ path: "M167 72c19,-38 37,-56 75,-56 42,0 76,33 76,75 0,76 -76,151 -151,227 -76,-76 -151,-151 -151,-227 0,-42 33,-75 75,-75 38,0 57,18 76,56z" });
  confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 }, colors, shapes: [heart, "circle"], scalar: 1.4 });
  setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0 }, colors }), 250);
  setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1 }, colors }), 400);
}
