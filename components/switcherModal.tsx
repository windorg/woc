import * as React from 'react'
import * as B from 'react-bootstrap'
import { useSession } from 'next-auth/react'
import { useCards } from 'lib/queries/cards'
import { Key } from 'ts-key-enum'
import { filterSync } from 'lib/array'
import _ from 'lodash'
import { cardRoute } from 'lib/routes'
import { useRouter } from 'next/router'
import styles from './switcherModal.module.scss'
import scrollIntoView from 'scroll-into-view-if-needed'
import Link from 'next/link'

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
  searchInputRef?: React.RefObject<HTMLInputElement>
}) {
  const [searchText, setSearchText] = React.useState('')
  const filteredItems =
    (!(_.isUndefined(props.items)) ? filterSync(props.items, item => props.match(searchText, item)) : [])
      .map(item => ({ ...item, ref: React.createRef<HTMLAnchorElement>() }))
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
          scrollIntoView(
            filteredItems[newIndex].ref.current!,
            { scrollMode: 'if-needed', block: 'nearest', inline: 'nearest' },
          )
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
          scrollIntoView(
            filteredItems[newIndex].ref.current!,
            { scrollMode: 'if-needed', block: 'nearest', inline: 'nearest' },
          )
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
      default: break
    }
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value)
    setActiveItemIndex(0)
  }

  return (<>
    <B.Form onSubmit={event => event.preventDefault()} className={props.className || ""}>
      <B.Form.Control
        type="text" name="search" id="search" autoComplete="off"
        value={searchText} onChange={handleChange} onKeyDown={handleKeyDown}
        ref={props.searchInputRef} />
      <div className={`mt-3 ${styles.results}`}>
        {props.items
          ? <B.ListGroup className={styles.listGroup}>
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
          : <B.Spinner animation="border" role="status" />
        }
      </div>
    </B.Form>
  </>)
}

export function useSwitcherModal() {
  // NB: autoFocus is broken inside modals so we use a ref and onEntered instead.
  // See https://github.com/react-bootstrap/react-bootstrap/issues/5102
  const searchInputRef: React.RefObject<HTMLInputElement> = React.useRef(null)
  const session = useSession().data!  // assuming there's definitely a user, otherwise we shouldn't allow the switcher
  // This gets both boards and cards now
  const cardsQuery = useCards({ owners: [session.userId] })
  const router = useRouter()

  const [isOpen, setIsOpen] = React.useState(false)
  const open = React.useCallback(() => {
    setIsOpen(true)
    searchInputRef.current?.focus()
  }, [setIsOpen])
  const close = React.useCallback(() => {
    setIsOpen(false)
  }, [setIsOpen])

  const Component = () => {
    return (
      <B.Modal
        className={styles.modal}
        size="lg"
        show={isOpen}
        onHide={close}
      >
        <B.Modal.Header closeButton>
          <B.Modal.Title>Find a card</B.Modal.Title>
        </B.Modal.Header>

        <B.Modal.Body>
          <FilterBox className={styles.filterBox}
            items={
              _.isUndefined(cardsQuery.data)
                ? undefined
                : _.orderBy(cardsQuery.data, ['createdAt'], ['desc'])
            }
            match={(text, card) => card.title.toLowerCase().includes(text.toLowerCase())}
            renderItem={card => (
              <span>{card.title}</span>
            )}
            onSelect={async card => {
              close()
              await router.push(cardRoute(card.id))
            }}
            searchInputRef={searchInputRef}
          />
        </B.Modal.Body>
      </B.Modal>
    )
  }

  return { Component, isOpen, open, close }
}