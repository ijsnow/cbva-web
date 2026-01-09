import { useMount } from "ahooks"
import { useState } from "react"

// Use this hook to disable interactive elements by until they are properly mounted.
//
// This hook is primarily used to prevent interactions with the dom before react causing
// hydrate the dom. This is primarily an issue in e2e tests. The programatic users begin
// interactions as soon as dom is visible, not when the listeners are all registered.
export function useIsMounted() {
  const [isMounted, setIsMounted] = useState(false)

  useMount(() => {
    setIsMounted(true)
  })

  return isMounted
}
