// TODO find a way to use this in board menu etc
export function LinkButton(props: {
  onClick
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <span
      className="text-muted link-button d-inline-flex align-items-center"
      onClick={props.onClick}
    >
      {props.icon && <>{props.icon}<span className="me-1" /></>}
      {props.children}
    </span>
  )
}