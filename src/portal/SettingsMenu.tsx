import { useEffect, useRef, useState } from 'react'
import { WordLengthSelector } from '../games/sanuri/components/WordLengthSelector'
import type { WordLength } from '../games/sanuri/wordLists'
import { useI18n } from '../i18n/I18nProvider'
import { LanguageToggle } from '../i18n/LanguageToggle'

export interface SettingsMenuProps {
  /** Omit to hide the word length section, e.g. when not on a game page. */
  wordLength?: WordLength
  onWordLengthChange?: (length: WordLength) => void
}

export function SettingsMenu({ wordLength, onWordLengthChange }: SettingsMenuProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-label={t('settings.title')}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded text-ink-100 transition-colors hover:bg-white/10"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          aria-label={t('settings.title')}
          className="absolute top-full right-0 z-10 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-lg"
        >
          {wordLength && onWordLengthChange && (
            <>
              <p className="mb-2 text-xs font-semibold tracking-widest text-slate-500 uppercase">
                {t('sanuri.wordLengthLabel')}
              </p>
              <WordLengthSelector value={wordLength} onChange={onWordLengthChange} />
              <div className="my-3 border-t border-slate-200" />
            </>
          )}
          <p className="mb-2 text-xs font-semibold tracking-widest text-slate-500 uppercase">
            {t('settings.language')}
          </p>
          <LanguageToggle />
        </div>
      )}
    </div>
  )
}
