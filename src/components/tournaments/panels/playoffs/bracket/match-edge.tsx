import { type EdgeProps, StepEdge } from "@xyflow/react"
import { useActiveTeam } from "."

export function MatchEdge(props: EdgeProps) {
  const activeTeam = useActiveTeam()

  const activeTeamStr = activeTeam?.toString()

  const isActive =
    activeTeamStr === props.sourceHandleId ||
    activeTeamStr === props.targetHandleId

  return (
    <StepEdge
      {...props}
      style={{
        ...props.style,
        stroke: isActive ? "#000" : undefined,
        strokeWidth: isActive ? 2 : 1,
      }}
    />
  )
}
