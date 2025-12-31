import { useSyncExternalStore } from "react"

type Modality = "keyboard" | "pointer"

let modality: Modality = "pointer"
const subs = new Set<() => void>()
const notify = () => subs.forEach((f) => f())

if (typeof window !== "undefined") {
  const onKey = (e: KeyboardEvent) => {
    const k = e.key
    if (
      k === "Tab" || k === "Shift" ||
      k.startsWith("Arrow") || k === "Enter" || k === " "
    ) {
      if (modality !== "keyboard") { modality = "keyboard"; notify() }
    }
  }
  const onPointer = () => { if (modality !== "pointer") { modality = "pointer"; notify() } }

  window.addEventListener("keydown", onKey, true)
  window.addEventListener("mousedown", onPointer, true)
  window.addEventListener("pointerdown", onPointer, true)
  window.addEventListener("touchstart", onPointer, true)
}

export function useInputModality(): Modality {
  return useSyncExternalStore(
    (cb) => { subs.add(cb); return () => subs.delete(cb) },
    () => modality,
    () => "pointer"
  )
}
