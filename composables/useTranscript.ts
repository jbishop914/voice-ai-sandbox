import type { TranscriptEntry } from '~/types/openai-realtime'

export function useTranscript() {
  const entries = useState<TranscriptEntry[]>('transcript-entries', () => [])

  function addEntry(speaker: 'user' | 'assistant', text: string, isFinal: boolean = false) {
    // Check if there's an existing non-final entry from the same speaker to update
    const lastEntry = entries.value[entries.value.length - 1]
    if (lastEntry && lastEntry.speaker === speaker && !lastEntry.isFinal) {
      lastEntry.text = text
      lastEntry.isFinal = isFinal
      return lastEntry.id
    }

    const entry: TranscriptEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      speaker,
      text,
      timestamp: new Date(),
      isFinal
    }
    entries.value.push(entry)
    return entry.id
  }

  function updateEntry(id: string, text: string, isFinal: boolean = false) {
    const entry = entries.value.find(e => e.id === id)
    if (entry) {
      entry.text = text
      entry.isFinal = isFinal
    }
  }

  function clear() {
    entries.value = []
  }

  return {
    entries: readonly(entries),
    addEntry,
    updateEntry,
    clear
  }
}
