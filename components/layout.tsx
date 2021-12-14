import { signIn, signOut, useSession } from "next-auth/react"
import { PropsWithChildren, useEffect } from "react"
import loadScript from 'load-script'

function ChangelogButton() {
  const headwayConfig = {
    selector: "#changelog-badge",
    trigger: "#changelog-trigger",
    account: "xYvgB7",
    position: {
      x: "left"
    },
  }
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).Headway) {
      // TODO switch to 'next/script'?
      loadScript('https://cdn.headwayapp.co/widget.js', () => {
        if (!document.querySelector('#HW_badge')) {
          (window as any).Headway.init(headwayConfig)
        }
      })
    }
  })
  return (
    <div id="changelog-trigger"
      className="d-flex align-items-center align-self-center me-2"
      style={{ cursor: "pointer" }}>
      <div className="text-primary">News</div>
      <div id="changelog-badge" style={{ height: "32px", width: "32px", minHeight: "1px" }}></div>
    </div>
  )
}

function NavHeader() {
  const { data: session } = useSession()
  const loginOrLogout =
    session
      ? <button onClick={() => signOut()}>Log out</button>
      : <button onClick={() => signIn()}>Log in</button>
  return (
    <div className="d-flex justify-content-end align-items-center align-self-center mb-3">
      {/* TODO LOGO
            <div style="position:relative">
                <a href="/" class="stretched-link text-reset text-decoration-none">
                    <img src="/favicon-large.png" width="50" class="me-2 woc-logo-icon">
                    <span class="woc-logo-text">wind of change</span>
                </a>
            </div> */}
      <div className="d-flex" style={{ flex: "1" }}></div>
      <ChangelogButton />
      {/* TODO {feed}
          TODO {inbox} */}
      <div>{loginOrLogout}</div>
    </div>
  )
}

export default function Layout({ children }: PropsWithChildren<{}>): JSX.Element {
  return (
    <div id="layout">
      <div className="container mt-4">
        <NavHeader />
        {children}
      </div>
      <footer className="container py-4">
        <div className="text-center text-muted small">
          made by <a href="https://twitter.com/availablegreen">Artyom Kazak</a>{" "}
          • favicon by <a href="https://loading.io/">loading.io</a>
        </div>
      </footer>
    </div>
  )
}
