import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Button } from "./button"

describe("Button", () => {
  it("can render", () => {
    render(<Button>Click Me</Button>)
    const buttonElement = screen.getByRole("button")
    expect(buttonElement).toBeInTheDocument()
  })
})
