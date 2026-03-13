
## Plan: Precision UI Adjustments — Premium Minimalist

### Files to modify

1. `src/components/MarcelaAssistant.tsx` — FAB repositioning
2. `src/components/MasSection.tsx` — Monochrome grid with Lucide outline icons
3. `src/components/CocinarGroupSection.tsx` — Banner overlay gradient
4. `src/components/MiCocinaSection.tsx` — Banner overlay gradient + border cleanup
5. `src/components/PlanificarSection.tsx` — Banner overlay gradient + border cleanup
6. `src/components/NutritionalBalance.tsx` — Banner overlay gradient (lines 300-317)
7. `src/components/LearnSection.tsx` — Banner overlay gradient

---

### Change 1 — FAB repositioning (MarcelaAssistant.tsx)
The hidden-state button is currently at `bottom-24 right-4`. Move it to `bottom-[100px] right-[20px]`.

```tsx
// From:
className="fixed bottom-24 right-4 z-[60] ..."
// To:
className="fixed bottom-[100px] right-[20px] z-[60] w-14 h-14 bg-background border border-border/40 shadow-sm text-primary rounded-full ..."
```
- Replace `border border-border` with `border border-border/40`
- Replace `shadow-lg` with `shadow-sm` (per spec: `0 4px 6px -1px rgb(0 0 0 / 0.1)`)
- Standardize button size to `w-14 h-14`

---

### Change 2 — MasSection.tsx: Monochrome grid
Replace gradient-colored icon containers with a monochrome treatment:
- Remove `bg-gradient-to-br ${item.gradient}` from the icon wrapper `<div>`
- Replace with `text-slate-800 dark:text-slate-200` applied directly to icon
- Remove the inner `<div className="p-3 rounded-xl bg-gradient-to-br ...">` wrapper entirely
- Replace all icons with Lucide outline variants: `GraduationCap`, `Gamepad2`, `Lightbulb`, `HeartPulse`, `Youtube`, `User`, `Palette` — all with `strokeWidth={1.5}` and `size={32}`
- Apply `text-[#1e293b] dark:text-slate-200` to all icons uniformly
- Keep the card containers with `rounded-xl` and `border border-border/50`

Updated icons map:
```
aprender  → GraduationCap
jugar     → Gamepad2
guia      → Lightbulb
balance   → Activity (replace HeartPulse)
marcela   → Youtube (keep, outline)
perfil    → User (keep)
temas     → Palette (keep)
```

---

### Change 3 — Banner overlays (all Slim Headers)

All banners currently use `from-black/75 via-black/40 to-transparent` (horizontal gradient). Per spec, add a **vertical** bottom-to-top gradient overlay as a second `<div>` layer for WCAG contrast:

```tsx
{/* Primary horizontal gradient */}
<div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent flex items-center">
  ...
</div>
{/* Secondary vertical gradient for WCAG AAA contrast */}
<div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/20 pointer-events-none" />
```

Apply to:
- `CocinarGroupSection.tsx`
- `MiCocinaSection.tsx`
- `PlanificarSection.tsx`
- `NutritionalBalance.tsx` (the inner balance banner at line ~301)
- `LearnSection.tsx` (the learn banner)

---

### Change 4 — Border cleanup

Cards in MasSection already use `rounded-2xl border border-border/50`. Update to `rounded-xl border border-slate-100 dark:border-border/50` for the `1px solid #f1f5f9` equivalence.

The NutritionalBalance inner sub-banner (lines 301-317) uses `rounded-xl overflow-hidden` with no border — add `border border-slate-100 dark:border-border/30`.

---

### Summary of file changes

| File | Changes |
|------|---------|
| `MarcelaAssistant.tsx` | FAB: bottom-[100px], right-[20px], shadow-sm, w-14 h-14 |
| `MasSection.tsx` | Monochrome icons, remove gradients, Lucide outline 32px strokeWidth 1.5 |
| `CocinarGroupSection.tsx` | Add vertical gradient overlay on banner |
| `MiCocinaSection.tsx` | Add vertical gradient overlay on banner |
| `PlanificarSection.tsx` | Add vertical gradient overlay on banner |
| `NutritionalBalance.tsx` | Add vertical gradient overlay on inner balance banner |
| `LearnSection.tsx` | Add vertical gradient overlay on banner |
