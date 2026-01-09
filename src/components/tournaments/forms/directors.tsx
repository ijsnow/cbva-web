import { useQuery } from "@tanstack/react-query"
import { PlusIcon } from "lucide-react"
import { AddDirector } from "@/components/directors/add"
import { RemoveDirector } from "@/components/directors/remove"
import { ProfileName } from "@/components/profiles/name"
import { ProfilePhoto } from "@/components/profiles/photo"
import { tournamentQueryOptions } from "@/data/tournaments"

export function DirectorsSection({ tournamentId }: { tournamentId: number }) {
  const { data: directors } = useQuery({
    ...tournamentQueryOptions(tournamentId),
    select: (data) => data?.directors,
  })

  return (
    <div className="flex flex-col space-y-4 relative">
      <div className="flex flex-col space-y-2">
        {directors?.map(({ id, director }) => (
          <div key={id} className="flex flex-row justify-between items-center">
            <div className="flex flex-row space-x-2 items-center">
              <ProfilePhoto {...director.profile} />
              <ProfileName {...director.profile} />
            </div>
            <RemoveDirector
              id={id}
              name={`${director.profile.preferredName ?? director.profile.firstName} ${director.profile.lastName}`}
              targetId={tournamentId}
              mode="tournament"
              isDisabled={directors.length === 1}
            />
          </div>
        ))}
      </div>

      <AddDirector
        triggerProps={{
          size: "sm",
          variant: "solid",
          children: (
            <>
              <PlusIcon size={12} /> Add Director
            </>
          ),
        }}
        targetId={tournamentId}
        mode="tournament"
        existingDirectorIds={directors?.map(({ id }) => id) ?? []}
      />
    </div>
  )
}
