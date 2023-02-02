import gravatar from 'gravatar'

export function getUserpicUrl(email: string | null) {
  return gravatar.url(email || '', { protocol: 'https', size: '64', default: 'mp' })
}
