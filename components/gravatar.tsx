import gravatar from 'gravatar'
import Image from 'next/image'

export function Gravatar(props: {
  email: string
  size: "small" | "tiny"
}) {
  const url = gravatar.url(
    props.email,
    { protocol: 'https', size: "64", default: 'mp' },
  )
  const size = props.size === "small" ? "32" : "16"
  return (
    <Image
      className="userpic"
      width={size}
      height={size}
      src={url}
      alt="Profile picture"
    />
  )
}
