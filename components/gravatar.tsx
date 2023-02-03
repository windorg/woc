import { getUserpicUrl } from '@lib/userpic'

export function Gravatar(props: { url?: string; size: 'small' | 'tiny' }) {
  const size = props.size === 'small' ? '32' : '16'
  const url = props.url || getUserpicUrl(null)
  return <img className="userpic" width={size} height={size} src={url} alt="Profile picture" />
}
