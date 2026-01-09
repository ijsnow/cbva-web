import { faker } from "@faker-js/faker"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { PoolMatchGrid } from "./pool-match-grid"

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "Tournament/Panels/PoolMatchGrid",
  component: PoolMatchGrid,
  parameters: {},
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {},
  args: {
    refetch: fn(),
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
} satisfies Meta<typeof PoolMatchGrid>

export default meta

type Story = StoryObj<typeof meta>

function playerProfile(id: number) {
  return {
    id,
    preferredName: faker.person.firstName(),
    lastName: faker.person.lastName(),
  }
}

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const InvidivualGameComplete: Story = {
  args: {
    id: 0,
    matchNumber: 1,
    winnerId: 0,
    teamA: {
      id: 0,
      poolTeam: {
        seed: 1,
      },
      team: {
        id: 0,
        players: [
          {
            profile: playerProfile(0),
          },
          {
            profile: playerProfile(1),
          },
        ],
      },
    },
    teamB: {
      id: 1,
      poolTeam: {
        seed: 2,
      },
      team: {
        id: 1,
        players: [
          {
            profile: playerProfile(2),
          },
          {
            profile: playerProfile(3),
          },
        ],
      },
    },
    sets: [
      {
        id: 0,
        teamAScore: 21,
        teamBScore: 12,
        setNumber: 1,
        winnerId: 0,
        startedAt: new Date(),
        endedAt: new Date(),
      },
    ],
  },
}

export const InvidivualGameInProgress: Story = {
  args: {
    id: 0,
    matchNumber: 1,
    winnerId: 0,
    teamA: {
      id: 0,
      poolTeam: {
        seed: 1,
      },
      team: {
        id: 0,
        players: [
          {
            profile: playerProfile(0),
          },
          {
            profile: playerProfile(1),
          },
        ],
      },
    },
    teamB: {
      id: 1,
      poolTeam: {
        seed: 2,
      },
      team: {
        id: 1,
        players: [
          {
            profile: playerProfile(2),
          },
          {
            profile: playerProfile(3),
          },
        ],
      },
    },
    sets: [
      {
        id: 0,
        teamAScore: 20,
        teamBScore: 12,
        setNumber: 1,
        winnerId: null,
        startedAt: new Date(),
        endedAt: null,
      },
    ],
  },
}

export const MatchThreeGamesComplete: Story = {
  args: {
    id: 0,
    matchNumber: 1,
    winnerId: 0,
    teamA: {
      id: 0,
      poolTeam: {
        seed: 1,
      },
      team: {
        id: 0,
        players: [
          {
            profile: playerProfile(0),
          },
          {
            profile: playerProfile(1),
          },
        ],
      },
    },
    teamB: {
      id: 1,
      poolTeam: {
        seed: 2,
      },
      team: {
        id: 1,
        players: [
          {
            profile: playerProfile(2),
          },
          {
            profile: playerProfile(3),
          },
        ],
      },
    },
    sets: [
      {
        id: 0,
        teamAScore: 21,
        teamBScore: 12,
        setNumber: 1,
        winnerId: 0,
        startedAt: new Date(),
        endedAt: new Date(),
      },
      {
        id: 1,
        teamAScore: 12,
        teamBScore: 21,
        setNumber: 2,
        winnerId: 1,
        startedAt: new Date(),
        endedAt: new Date(),
      },
      {
        id: 2,
        teamAScore: 21,
        teamBScore: 12,
        setNumber: 3,
        winnerId: 0,
        startedAt: new Date(),
        endedAt: new Date(),
      },
    ],
  },
}

export const MatchThirdInProgress: Story = {
  args: {
    id: 0,
    matchNumber: 1,
    winnerId: 0,
    teamA: {
      id: 0,
      poolTeam: {
        seed: 1,
      },
      team: {
        id: 0,
        players: [
          {
            profile: playerProfile(0),
          },
          {
            profile: playerProfile(1),
          },
        ],
      },
    },
    teamB: {
      id: 1,
      poolTeam: {
        seed: 2,
      },
      team: {
        id: 1,
        players: [
          {
            profile: playerProfile(2),
          },
          {
            profile: playerProfile(3),
          },
        ],
      },
    },
    sets: [
      {
        id: 0,
        teamAScore: 21,
        teamBScore: 12,
        setNumber: 1,
        winnerId: 0,
        startedAt: new Date(),
        endedAt: new Date(),
      },
      {
        id: 1,
        teamAScore: 12,
        teamBScore: 21,
        setNumber: 2,
        winnerId: 1,
        startedAt: new Date(),
        endedAt: new Date(),
      },
      {
        id: 2,
        teamAScore: 20,
        teamBScore: 12,
        setNumber: 3,
        winnerId: null,
        startedAt: new Date(),
        endedAt: null,
      },
    ],
  },
}

export const MatchThirdNotStarted: Story = {
  args: {
    id: 0,
    matchNumber: 1,
    winnerId: 0,
    teamA: {
      id: 0,
      poolTeam: {
        seed: 1,
      },
      team: {
        id: 0,
        players: [
          {
            profile: playerProfile(0),
          },
          {
            profile: playerProfile(1),
          },
        ],
      },
    },
    teamB: {
      id: 1,
      poolTeam: {
        seed: 2,
      },
      team: {
        id: 1,
        players: [
          {
            profile: playerProfile(2),
          },
          {
            profile: playerProfile(3),
          },
        ],
      },
    },
    sets: [
      {
        id: 0,
        teamAScore: 21,
        teamBScore: 12,
        setNumber: 1,
        winnerId: 0,
        startedAt: new Date(),
        endedAt: new Date(),
      },
      {
        id: 1,
        teamAScore: 12,
        teamBScore: 21,
        setNumber: 2,
        winnerId: 1,
        startedAt: new Date(),
        endedAt: new Date(),
      },
      {
        id: 2,
        teamAScore: 0,
        teamBScore: 0,
        setNumber: 3,
        winnerId: null,
        startedAt: null,
        endedAt: null,
      },
    ],
  },
}
