import dayjs from "dayjs"
import { useEffect, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"
import { getPadsByUidQuery, watchPads } from "../../services/pads"
import relativeTime from "dayjs/plugin/relativeTime"
import { usePadListStore } from "../../store/pad"
import { QueryDocumentSnapshot, Unsubscribe } from "firebase/firestore"
import ContextMenu from "../../components/ContextMenu"
import PadItem from "./PadItem"
import ScrollBar from "../../components/ScrollBar"

dayjs.extend(relativeTime)

function PadList() {
  const { user } = useAuth()
  const { id } = useParams()
  const { pads, query, updatePadList, appendPads } = usePadListStore()
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<unknown> | null>(
    null
  )
  const [end, setEnd] = useState("NONE")
  const isFetching = useRef(false)
  const needToLoadMoreData = useRef(false)

  const loadMore = () => {
    if (!needToLoadMoreData.current) {
      return
    }

    if (!lastDoc) {
      setEnd("END")
      return
    }

    if (!user || !user?.uid || !lastDoc || isFetching.current) return
    const clonedQuery = { ...query }

    clonedQuery.startAfter = lastDoc
    isFetching.current = true

    getPadsByUidQuery(user.uid, clonedQuery)
      .then(({ lastDoc, data }) => {
        appendPads(data)
        setLastDoc(lastDoc)
        !lastDoc && setEnd("END")
      })
      .finally(() => {
        isFetching.current = false
      })
  }

  useEffect(() => {
    let unsub: Unsubscribe | null
    if (user?.uid) {
      unsub = watchPads(query, (err, { last, data }) => {
        if (err) {
          return
        }

        if (last) {
          setEnd("NONE")
          setLastDoc(last)
        }

        updatePadList(data)
      })
    }

    return () => {
      unsub && unsub()
    }

    // eslint-disable-next-line
  }, [user?.uid, query])

  return (
    <>
      <ScrollBar
        height="calc(100vh - 80px)"
        onScrollStop={loadMore}
        onScrollFrame={(values) => {
          needToLoadMoreData.current = values.top > 0.9
        }}
      >
        <div className="pad-list">
          {pads.map((pad) => {
            return (
              <ContextMenu key={pad.id}>
                <PadItem active={id === pad.id} pad={pad} />
              </ContextMenu>
            )
          })}
        </div>
      </ScrollBar>
      <div className="text-2xs px-4 border-t border-color-dark flex items-center justify-between uppercase">
        <span>{end === "END" ? "Reached Limit" : ""}</span>
        <span>Total: {pads.length}</span>
      </div>
    </>
  )
}

export default PadList
