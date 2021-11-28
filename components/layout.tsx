import { signIn, signOut, useSession } from "next-auth/react"
import { PropsWithChildren } from "react"

function NavHeader() {
  const { data: session } = useSession()
  const loginOrLogout =
    session
      ? <button onClick={() => signOut()}>Log out</button>
      : <button onClick={() => signIn()}>Log in</button>
  return (
    <div className="d-flex justify-content-end align-items-center align-self-center mb-3">
      {/* TODO <div style="position:relative">
                <a href="/" class="stretched-link text-reset text-decoration-none">
                    <img src="/favicon-large.png" width="50" class="me-2 woc-logo-icon">
                    <span class="woc-logo-text">wind of change</span>
                </a>
            </div> */}
      <div className="d-flex" style={{ flex: "1" }}></div>
      <div id="changelog-trigger"
        className="d-flex align-items-center align-self-center me-2"
        style={{ cursor: "pointer" }}>
        <div className="text-primary">News</div>
        <div id="changelog-badge" style={{ height: "32px", width: "32px", minHeight: "1px" }}></div>
      </div>
      {/* {feed}
            {inbox} */}
      <div>{loginOrLogout}</div>
    </div>
  )
}

export default function Layout({ children }: PropsWithChildren<{}>): JSX.Element {
  return (
    <>
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
    </>
  )
}
