import { signIn, signOut, useSession } from 'next-auth/react'
import { ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import * as B from 'react-bootstrap'
import Head from 'next/head'
import Script from 'next/script'
import { useInboxCount } from 'lib/queries/inbox'
import { accountRoute, boardsRoute, feedRoute, inboxRoute } from 'lib/routes'
import { useHotkeys } from 'react-hotkeys-hook'
import styles from './layout.module.scss'
import { BiSearch } from 'react-icons/bi'
import { useSwitcherModal } from '@components/switcherModal'

function ChangelogButton() {
  const headwayConfig = {
    selector: '#changelog-badge',
    trigger: '#changelog-trigger',
    account: 'xYvgB7',
    position: {
      x: 'left',
    },
  }
  return (
    <>
      <Script
        src="https://cdn.headwayapp.co/widget.js"
        strategy="afterInteractive"
        onLoad={() => {
          const Headway = (window as any).Headway
          if (!document.querySelector('#HW_badge') && Headway) {
            Headway.init(headwayConfig)
          }
        }}
      />
      <div
        id="changelog-trigger"
        className="d-flex align-items-center align-self-center me-2"
        style={{ cursor: 'pointer' }}
      >
        <div className="text-primary">News</div>
        <div id="changelog-badge" style={{ height: '32px', width: '32px', minHeight: '1px' }}></div>
      </div>
    </>
  )
}

function InboxLink() {
  const { data } = useInboxCount({ refetchInterval: 5000 })
  return (
    <Link href={inboxRoute()}>
      Inbox
      {data !== undefined && (
        <B.Badge
          className="ms-2"
          id="inbox-badge"
          bg={data.itemCount === 0 ? 'secondary' : 'danger'}
        >
          {data.itemCount}
        </B.Badge>
      )}
    </Link>
  )
}

function NavHeader() {
  const { data: session } = useSession()
  const loginOrLogout = session ? (
    <B.Dropdown>
      <B.Dropdown.Toggle as="a" style={{ cursor: 'pointer' }} id="dropdown-account">
        Account
      </B.Dropdown.Toggle>
      <B.Dropdown.Menu align="end" className={styles.accountMenu}>
        {/* TODO: this doesn't use the Link machinery */}
        <B.Dropdown.Item href={boardsRoute()}>All boards</B.Dropdown.Item>
        <B.Dropdown.Item href={accountRoute()}>Account settings</B.Dropdown.Item>
        <B.Dropdown.Item onClick={async () => signOut()}>Log out</B.Dropdown.Item>
      </B.Dropdown.Menu>
    </B.Dropdown>
  ) : (
    <>
      <Link href="/Signup" className="me-4">
        Sign up
      </Link>
      <a href="#" onClick={async () => signIn()}>
        Log in
      </a>
    </>
  )
  return (
    <div className="d-flex justify-content-end align-items-center align-self-center mb-3">
      <div style={{ position: 'relative' }}>
        <Link href="/" className="stretched-link text-reset woc-logo-link">
          {/* Using img instead of Image because for some reason with Image the logo text isn't centered */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/favicon-large.png"
            width="50"
            height="50"
            className="me-2 woc-logo-icon"
            alt="wind of change logo"
          />
          <span className="woc-logo-text">wind of change</span>
        </Link>
      </div>
      <div className="d-flex" style={{ flex: '1' }}></div>
      <ChangelogButton />
      {session ? (
        <div className="me-4">
          <Link href={feedRoute()}>Feed</Link>
        </div>
      ) : null}
      {session ? (
        <div className="me-4">
          <InboxLink />
        </div>
      ) : null}
      <div>{loginOrLogout}</div>
    </div>
  )
}

function Switcher() {
  const switcherModal = useSwitcherModal()
  const session = useSession().data
  useHotkeys(
    'ctrl+k, command+k',
    () => {
      if (!switcherModal.isOpen) {
        switcherModal.open()
      }
    },
    {
      enableOnTags: ['INPUT', 'TEXTAREA', 'SELECT'],
      enableOnContentEditable: true,
    }
  )
  return session ? (
    <>
      <switcherModal.Component />
      {!switcherModal.isOpen && (
        <B.Button
          className={`${styles.switcherActionButton} rounded-circle`}
          onClick={() => {
            switcherModal.open()
            // An attempt to explicitly ask Safari on iOS to show the on-screen keyboard. Note: I checked and it still
            // doesn't work.
            //
            // switcherModal.focus()
          }}
        >
          <BiSearch className={styles.icon} />
        </B.Button>
      )}
    </>
  ) : null
}

type Props = {
  children?: ReactNode | undefined
}

function Layout(props: Props): JSX.Element {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="icon" href="favicon.png" />
        <link rel="apple-touch-icon" href="favicon-square.png" />
        <meta name="theme-color" content="#ffffff" />

        <meta property="og:site_name" content="wind of change" />
        <meta property="og:image" content="https://windofchange.me/favicon-square.png" />
        <meta property="twitter:image" content="https://windofchange.me/favicon-square.png" />
      </Head>

      <div id="layout">
        <div className="container mt-4">
          <NavHeader />
          <Switcher />
          {props.children}
        </div>
        <footer className="container py-4">
          <div className="text-center text-muted small">
            made by <a href="https://github.com/neongreen">Artyom Kazak</a> • favicon by{' '}
            <a href="https://loading.io/">loading.io</a>
          </div>
        </footer>
      </div>
    </>
  )
}

export default Layout
