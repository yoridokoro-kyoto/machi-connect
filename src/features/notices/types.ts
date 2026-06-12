export type NoticeType = 'notice' | 'circular'

export type Notice = {
  id: string
  title: string
  content: string
  type: NoticeType
  image_url: string | null
  image_urls: string[]
  created_at: string
  requires_confirmation: boolean
  requires_rsvp: boolean
  rsvp_deadline: string | null
  organization_id: string | null
}

export type RsvpStatus = 'attending' | 'absent' | 'undecided'

export type CircularConfirmation = {
  id: string
  notice_id: string
  user_id: string
  confirmed_at: string | null
  rsvp: RsvpStatus | null
}

export type RsvpRecord = {
  user_id: string
  rsvp: RsvpStatus | null
  name: string
}
