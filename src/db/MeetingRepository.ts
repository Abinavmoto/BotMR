import { runQuery, getQuery, getAllQuery } from './database'
import * as Crypto from 'expo-crypto'

export interface Meeting {
  id: string
  title: string
  created_at: number
  updated_at: number
  duration_sec: number
  status: 'recorded' | 'recorded_partial' | 'processing' | 'completed' | 'failed'
  error_message?: string
  local_audio_uri: string
}

export interface CreateMeetingInput {
  title: string
  duration_sec: number
  local_audio_uri: string
  status?: Meeting['status']
  error_message?: string
}

export interface UpdateMeetingInput {
  title?: string
  duration_sec?: number
  status?: Meeting['status']
  local_audio_uri?: string
  error_message?: string
}

export class MeetingRepository {
  static async createMeeting(input: CreateMeetingInput): Promise<Meeting> {
    const id = await Crypto.randomUUID()
    const now = Date.now()

    const meeting: Meeting = {
      id,
      title: input.title,
      created_at: now,
      updated_at: now,
      duration_sec: input.duration_sec,
      status: input.status || 'recorded',
      local_audio_uri: input.local_audio_uri,
      error_message: input.error_message,
    }

    await runQuery(
      `INSERT INTO meetings (id, title, created_at, updated_at, duration_sec, status, local_audio_uri, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        meeting.id,
        meeting.title,
        meeting.created_at,
        meeting.updated_at,
        meeting.duration_sec,
        meeting.status,
        meeting.local_audio_uri,
        meeting.error_message || null,
      ],
    )

    return meeting
  }

  static async updateMeeting(id: string, input: UpdateMeetingInput): Promise<Meeting | null> {
    const existing = await this.getMeetingById(id)
    if (!existing) {
      return null
    }

    const updates: string[] = []
    const params: any[] = []

    if (input.title !== undefined) {
      updates.push('title = ?')
      params.push(input.title)
    }
    if (input.duration_sec !== undefined) {
      updates.push('duration_sec = ?')
      params.push(input.duration_sec)
    }
    if (input.status !== undefined) {
      updates.push('status = ?')
      params.push(input.status)
    }
    if (input.local_audio_uri !== undefined) {
      updates.push('local_audio_uri = ?')
      params.push(input.local_audio_uri)
    }
    if (input.error_message !== undefined) {
      updates.push('error_message = ?')
      params.push(input.error_message)
    }

    if (updates.length === 0) {
      return existing
    }

    updates.push('updated_at = ?')
    params.push(Date.now())
    params.push(id)

    await runQuery(`UPDATE meetings SET ${updates.join(', ')} WHERE id = ?`, params)

    return await this.getMeetingById(id)
  }

  static async getMeetingById(id: string): Promise<Meeting | null> {
    return await getQuery<Meeting>('SELECT * FROM meetings WHERE id = ?', [id])
  }

  static async listMeetings(): Promise<Meeting[]> {
    return await getAllQuery<Meeting>('SELECT * FROM meetings ORDER BY created_at DESC')
  }

  static async deleteMeeting(id: string): Promise<boolean> {
    const result = await runQuery('DELETE FROM meetings WHERE id = ?', [id])
    return (result.changes || 0) > 0
  }
}
