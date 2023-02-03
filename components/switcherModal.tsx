import * as React from 'react'
import * as B from 'react-bootstrap'
import { useSession } from 'next-auth/react'
import { Key } from 'ts-key-enum'
import { filterSync } from 'lib/array'
import _ from 'lodash'
import { cardRoute } from 'lib/routes'
import { useRouter } from 'next/router'
import styles from './switcherModal.module.scss'
import scrollIntoView from 'scroll-into-view-if-needed'
import Link from 'next/link'
import { graphql } from 'generated/graphql'
import { useQuery } from '@apollo/client'

// Note: we can't use forwardRef, see https://stackoverflow.com/questions/58469229/react-with-typescript-generics-while-using-react-forwardref/58473012

// TODO: move this to a shared component
function FilterBox<Item>(props: {
  className?: string
  // If "undefined", we assume the items are still loading
  items: Item[] | undefined
  match: (text: string, item: Item) => boolean
  renderItem: (item: Item) => React.ReactNode
  // What to do when Enter is pressed or an item is clicked
  onSelect: (item: Item) => void
}) {
  const [searchText, setSearchText] = React.useState('')
  const filteredItems = (
    !_.isUndefined(props.items)
      ? filterSync(props.items, (item) => props.match(searchText, item))
      : []
  ).map((item) => ({ ...item, ref: React.createRef<HTMLAnchorElement>() }))
  const [activeItemIndex, setActiveItemIndex] = React.useState(0)
  // Don't allow mouse events when we are navigating with the keyboard
  const [isNavigating, setIsNavigating] = React.useState(false)
  const [latestTimeout, setLatestTimeout] = React.useState<null | NodeJS.Timeout>(null)

  const handleMouseEnter = (index: number) => () => {
    if (!isNavigating) {
      setActiveItemIndex(index)
    }
  }

  const handleKeyDown: React.KeyboardEventHandler = (event) => {
    const length = Math.max(1, filteredItems.length) // "max 1" because we can't divide by zero
    switch (event.key) {
      case Key.ArrowDown: {
        event.preventDefault()
        setIsNavigating(true)
        const newIndex = (activeItemIndex + length + 1) % length
        setActiveItemIndex(newIndex)
        if (filteredItems[newIndex]) {
          scrollIntoView(filteredItems[newIndex].ref.current!, {
            scrollMode: 'if-needed',
            block: 'nearest',
            inline: 'nearest',
          })
        }
        if (latestTimeout) clearTimeout(latestTimeout)
        setLatestTimeout(setTimeout(() => setIsNavigating(false), 100))
        break
      }
      case Key.ArrowUp: {
        event.preventDefault()
        setIsNavigating(true)
        const newIndex = (activeItemIndex + length - 1) % length
        setActiveItemIndex(newIndex)
        if (filteredItems[newIndex]) {
          scrollIntoView(filteredItems[newIndex].ref.current!, {
            scrollMode: 'if-needed',
            block: 'nearest',
            inline: 'nearest',
          })
        }
        if (latestTimeout) clearTimeout(latestTimeout)
        setLatestTimeout(setTimeout(() => setIsNavigating(false), 100))
        break
      }
      case Key.Enter: {
        event.preventDefault()
        if (activeItemIndex < filteredItems.length) props.onSelect(filteredItems[activeItemIndex])
        break
      }
      default:
        break
    }
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value)
    setActiveItemIndex(0)
  }

  return (
    <>
      <B.Form onSubmit={(event) => event.preventDefault()} className={props.className || ''}>
        <B.Form.Control
          type="text"
          name="search"
          id="search"
          autoComplete="off"
          autoFocus
          value={searchText}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        <div className={`mt-3 ${styles.results}`}>
          {props.items ? (
            <B.ListGroup className={styles.listGroup}>
              {filteredItems.map((item, index) => (
                <B.ListGroupItem
                  className={styles.itemWrapper}
                  key={index}
                  active={index === activeItemIndex}
                  onMouseEnter={handleMouseEnter(index)}
                  onClick={() => props.onSelect(item)}
                  ref={item.ref}
                >
                  {props.renderItem(item)}
                </B.ListGroupItem>
              ))}
            </B.ListGroup>
          ) : (
            <B.Spinner animation="border" role="status" />
          )}
        </div>
      </B.Form>
    </>
  )
}

const _getAllCards = graphql(`
  query getAllCards($userId: UUID!) {
    user(id: $userId) {
      id
      allCards {
        id
        title
        createdAt
      }
    }
  }
`)

export function useSwitcherModal() {
  const router = useRouter()
  const session = useSession().data

  // If focus was on Tiptap, for some reason just doing '.focus()' doesn't work. So we blur the previously focused element, and focus it back when the modal closes. The actual focusing is done via 'autoFocus' on the input.
  const previousFocus = React.useRef<HTMLElement | null>(null)
  const [isOpen, setIsOpen] = React.useState(false)

  const open = React.useCallback(() => {
    setIsOpen(true)
    if (document.activeElement instanceof HTMLElement) {
      previousFocus.current = document.activeElement
      document.activeElement.blur()
    }
  }, [setIsOpen])

  const close = React.useCallback(() => {
    setIsOpen(false)
    previousFocus.current?.focus()
    previousFocus.current = null
  }, [setIsOpen])

  const Component = () => {
    const cardsQuery = useQuery(_getAllCards, {
      variables: { userId: session?.userId || '' },
      skip: !session,
      fetchPolicy: 'cache-and-network',
      nextFetchPolicy: 'cache-and-network',
    })
    return (
      session && (
        <B.Modal className={styles.modal} size="lg" show={isOpen} onHide={close}>
          <B.Modal.Header closeButton>
            <B.Modal.Title>Find a card</B.Modal.Title>
          </B.Modal.Header>

          <B.Modal.Body>
            <FilterBox
              className={styles.filterBox}
              items={
                _.isUndefined(cardsQuery.data)
                  ? undefined
                  : _.orderBy(cardsQuery.data.user.allCards, ['createdAt'], ['desc'])
              }
              match={(text, card) => card.title.toLowerCase().includes(text.toLowerCase())}
              renderItem={(card) => <span>{card.title}</span>}
              onSelect={async (card) => {
                close()
                await router.push(cardRoute(card.id))
              }}
            />
          </B.Modal.Body>
        </B.Modal>
      )
    )
  }

  return { Component, isOpen, open, close }
}
