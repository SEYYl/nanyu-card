export type HighlightItem = {
  period: string
  title: string
  description: string
}

export type SiteConfig = {
  site_name: string
  avatar: string | null
  description: string
  about: string
  occupation: string
  email: string | null
  github: string | null
  telegram: string | null
  icp: string | null
  police: string | null
  focus_areas: string[]
  skills: string[]
  highlights: HighlightItem[]
}

export type Project = {
  id: number
  title: string
  cover: string | null
  description: string
  content: string | null
  url: string | null
  github: string | null
  tags: string[]
  sort: number
}
