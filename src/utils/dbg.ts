export function dbg<T>(t: T, tag = "dbg ->"): T {
  console.debug(tag, t)

  return t
}
