import gravatar from 'gravatar'

export function Gravatar(props: { email: string; size: 'small' | 'tiny' }) {
  const url = gravatar.url(props.email, { protocol: 'https', size: '64', default: 'mp' })
  const size = props.size === 'small' ? '32' : '16'
  return <img className="userpic" width={size} height={size} src={url} alt="Profile picture" />
}
