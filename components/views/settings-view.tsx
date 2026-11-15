'use client'

import { Download, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,

} from '@/components/ui/select'
import { LOCALES, LOCALE_LABELS, useI18n, type Locale } from '@/lib/i18n'
import { useMiru } from '@/lib/store'
import type { LibraryStatus, MiruExport } from '@/lib/types'

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const MAL_STATUS: Record<LibraryStatus, string> = {
  plan: 'plan to watch',
  watching: 'watching',
  onhold: 'on-hold',
  dropped: 'dropped',
  done: 'completed',
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export function SettingsView() {
  const { t } = useI18n()
  const { setTheme, theme } = useTheme()
  const {
    ready,
    preferences,
    setPreferences,
    entries,
    exportState,
    importState,
    resetAll,
  } = useMiru()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [displayNameDraft, setDisplayNameDraft] = useState(
    preferences.displayName,
  )

  if (!ready) {
    return (
      <div className="px-4 py-10 md:px-10">
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      </div>
    )
  }

  function exportJson() {
    const payload = exportState()
    download(
      `miru-backup-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(payload, null, 2),
      'application/json',
    )
  }

  function exportMal() {
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<myanimelist>',
      '  <myinfo>',
      `    <user_name>${escapeXml(preferences.displayName || 'MIRU user')}</user_name>`,
      `    <user_export_type>1</user_export_type>`,
      `    <user_total_anime>${entries.length}</user_total_anime>`,
      '  </myinfo>',
      entries.map((entry) => {
        const anime = entry.anime
        return [
          '  <anime>',
          `    <series_animedb_id>${anime.malId ?? 0}</series_animedb_id>`,
          `    <series_title>${escapeXml(anime.title)}</series_title>`,
          `    <series_type>${anime.type?.toLowerCase() ?? 'tv'}</series_type>`,
          `    <series_episodes>${anime.episodesTotal ?? 0}</series_episodes>`,
          '    <my_id>0</my_id>',
          `    <my_watched_episodes>${entry.watchedEpisodes.length}</my_watched_episodes>`,
          `    <my_start_date>${entry.startedAt ?? '0000-00-00'}</my_start_date>`,
          `    <my_finish_date>${entry.finishedAt ?? '0000-00-00'}</my_finish_date>`,
          `    <my_rated>${entry.userScore ?? ''}</my_rated>`,
          `    <my_score>${entry.userScore ?? 0}</my_score>`,
          `    <my_status>${MAL_STATUS[entry.status]}</my_status>`,
          `    <my_rewatching>${entry.rewatchCount > 0 ? '1' : '0'}</my_rewatching>`,
          '    <my_rewatching_ep>0</my_rewatching_ep>',
          `    <my_tags>${escapeXml(entry.customTags.join(', '))}</my_tags>`,
          `    <my_comments>${escapeXml(entry.notes)}</my_comments>`,
          '  </anime>',
        ].join('\n')
      }).join('\n'),
      '</myanimelist>',
    ].join('\n')
    download(
      `miru-mal-${new Date().toISOString().slice(0, 10)}.xml`,
      xml,
      'application/xml',
    )
    toast.success(t('common.saved'))
  }

  function handleImportFile(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as MiruExport
        if (!Array.isArray(parsed.entries)) throw new Error('invalid')
        const count = importState(parsed)
        toast.success(t('settings.importDone', { count }))
      } catch {
        toast.error(t('settings.importError'))
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="motion-rise mx-auto max-w-2xl px-4 py-8 md:px-10 md:py-12">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {t('settings.title')}
        </h1>
      </header>

      <section className="mt-8 space-y-5 rounded-lg border border-border bg-card/60 p-5">
        <h2 className="font-display text-sm font-semibold tracking-tight">
          {t('settings.profile')}
        </h2>

        <div>
          <Label htmlFor="display-name" className="text-xs text-muted-foreground">
            {t('settings.displayName')}
          </Label>
          <div className="mt-1.5 flex gap-2">
            <Input
              id="display-name"
              value={displayNameDraft}
              onChange={(event) => setDisplayNameDraft(event.target.value)}
              placeholder={t('account.guest')}
            />
            <Button
              onClick={() => {
                setPreferences({ displayName: displayNameDraft.trim() })
                toast.success(t('common.saved'))
              }}
            >
              {t('common.save')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="language" className="text-xs text-muted-foreground">
              {t('settings.language')}
            </Label>
            <Select
              value={preferences.locale}
              onValueChange={(value) =>
                setPreferences({ locale: value as Locale })
              }
            >
              <SelectTrigger id="language" className="mt-1.5 w-full">
                <span className="flex-1 text-left">
                  {LOCALE_LABELS[preferences.locale as Locale]}
                </span>
              </SelectTrigger>
              <SelectContent>
                {LOCALES.map((locale) => (
                  <SelectItem key={locale} value={locale}>
                    {LOCALE_LABELS[locale]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="theme" className="text-xs text-muted-foreground">
              {t('settings.theme')}
            </Label>
            <Select
              value={theme ?? 'dark'}
              onValueChange={(value) => setTheme(value ?? 'dark')}
            >
              <SelectTrigger id="theme" className="mt-1.5 w-full">
                <span className="flex-1 text-left">
                  {t(
                    theme === 'light'
                      ? 'settings.themeLight'
                      : theme === 'system'
                        ? 'settings.themeSystem'
                        : 'settings.themeDark',
                  )}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">{t('settings.themeDark')}</SelectItem>
                <SelectItem value="light">{t('settings.themeLight')}</SelectItem>
                <SelectItem value="system">{t('settings.themeSystem')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="mt-6 space-y-5 rounded-lg border border-border bg-card/60 p-5">
        <h2 className="font-display text-sm font-semibold tracking-tight">
          {t('settings.data')}
        </h2>

        <div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t('settings.exportHint')}
          </p>
          <Button variant="outline" className="mt-2" onClick={exportJson}>
            <Download className="size-4" aria-hidden="true" />
            {t('settings.export')}
          </Button>
        </div>

        <div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t('settings.exportMal')}
          </p>
          <Button variant="outline" className="mt-2" onClick={exportMal}>
            <Download className="size-4" aria-hidden="true" />
            {t('settings.exportMal')}
          </Button>
        </div>

        <div>
          <Label htmlFor="import-file" className="text-xs text-muted-foreground">
            {t('settings.importHint')}
          </Label>
          <div className="mt-2">
            <input
              ref={fileInputRef}
              id="import-file"
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(event) => {
                handleImportFile(event.target.files?.[0])
                event.target.value = ''
              }}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-4" aria-hidden="true" />
              {t('settings.import')}
            </Button>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          {confirmReset ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  resetAll()
                  setConfirmReset(false)
                }}
              >
                {t('common.confirm')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmReset(false)}
              >
                {t('common.cancel')}
              </Button>
            </div>
          ) : (
            <Button
              variant="destructive"
              onClick={() => setConfirmReset(true)}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              {t('settings.reset')}
            </Button>
          )}
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {t('settings.resetConfirm')}
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-border bg-card/60 p-5">
        <h2 className="font-display text-sm font-semibold tracking-tight">
          {t('settings.storage')}
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {t('settings.storageLocal')}
        </p>
      </section>
    </div>
  )
}
