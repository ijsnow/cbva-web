import createClient from "gel"

async function main() {
  console.log("connecting...")

  const gelClient = createClient({
    instanceName: "drizzle",
  })

  console.log("connected")

  const res = await gelClient.query<{
    elements: {
      id: string
      teams: { id: string }
    }[]
  }>(`
    with
      tournaments := (
        select Tournament
        filter .status = TournamentStatus.Complete
      ),
      groups := (
        group tournaments
        by .start_at, .name, .gender, .division, .beach
      )
    select groups {
      elements: {
        id,
        # status,
        # beach: { id },
        # url,
        # name,
        # division,
        # start_at,
        # gender,
        teams := (
          with t_url := .url
          select Team filter .tournament.url = t_url
        )
      },
      dup_count := count(.elements)
    }
      filter count(.elements) > 1;
  `)

  if (res.length === 0) {
    console.log("all good")
    return
  }

  console.log(`found ${res.length}`)

  await gelClient.transaction(async (txn) => {
    for (const group of res) {
      const [keep, ...rest] = group.elements

      for (const { id } of rest.flatMap(({ teams }) => teams)) {
        // insert team, set old to transferred
        await txn.execute(
          `
					with
					  team := (select Team filter .id = <uuid>$teamId),
						tournament := (select Tournament filter .id = <uuid>$tournamentId limit 1),
						updated := (
						  update team set {
								status := TeamStatus.Transferred
							}
						)
					insert Team {
					  status := TeamStatus.Active,
					  tournament := tournament,
					  transaction_key := team.transaction_key,
					  can_edit := team.can_edit,
					  players := team.players
					}
					`,
          {
            teamId: id,
            tournamentId: keep.id,
          }
        )
      }

      for (const { id } of rest) {
        await txn.execute(
          `
			  update Tournament
				filter .id = <uuid>$id
				set {
				  status := TournamentStatus.Cancelled
				}
				`,
          {
            id,
          }
        )
      }
    }
  })
}

await main()
