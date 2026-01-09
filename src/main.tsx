import { RouterProvider } from "@tanstack/react-router"
import React from "react"
import { hydrateRoot } from "react-dom/client"
import { getRouter } from "./router"

// Set up a Router instance
const router = getRouter()

// Register things for typesafety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById("app")!

// if (!rootElement.innerHTML) {
//   const root = ReactDOM.createRoot(rootElement);

//   root.render(<RouterProvider router={router} />);
// }

if (!rootElement.innerHTML) {
  // const root = ReactDOM.createRoot(rootElement);

  hydrateRoot(
    rootElement,
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  )
}
