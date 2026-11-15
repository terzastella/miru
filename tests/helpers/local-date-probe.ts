// Usato dal test delle date: gira in un processo separato con TZ=Europe/Rome.
import { localISODate } from '../../lib/library-merge'

const instant = new Date('2026-01-01T00:30:00+01:00')
process.stdout.write(
  `${localISODate(instant)} ${instant.toISOString().slice(0, 10)}`,
)
