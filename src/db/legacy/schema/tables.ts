import {
	type AnyGelColumn,
	boolean,
	bytes,
	doublePrecision,
	duration,
	foreignKey,
	gelTable,
	integer,
	json,
	localDate,
	real,
	text,
	timestamp,
	timestamptz,
	uuid,
} from "drizzle-orm/gel-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

// module default {

const hasCreated = {
	created: timestamp().notNull(),
};

//     scalar type Gender extending enum<Male, Female, Coed>;
//     scalar type TShirtSize extending enum<S, M, L, XL>;

//     scalar type Rating extending enum<Novice, Unrated, B, A, AA, AAA>;
//     scalar type Division extending enum<
//             Unrated, B, A, AA, AAA, Open,
//             U12, U14, U16, U18>;

export const users = gelTable("User", {
	...hasCreated,
	id: uuid().primaryKey().notNull(),
	username: text().notNull().unique(),
	legalName: text().notNull(),
	firstName: text().notNull(),
	lastName: text().notNull(),
	avpId: integer().unique(),
	legacyId: integer().unique(),
	customerKey: text(),
	gender: text().notNull(),
	birthdate: localDate().notNull(),
	email: text().notNull(),
	phone: text().notNull(),
	playerPhone: text(),
	country: text().notNull(),
	zipcode: text(),
	tshirtSize: text().notNull(),
	highSchoolGradYear: integer(),
	rating: text().notNull(),
	ratedPoints: doublePrecision().notNull(),
	juniorsPoints: doublePrecision().notNull(),
	rank: integer().notNull(),
});

export const phoneVerification = gelTable("PhoneVerification", {
	userId: uuid()
		.notNull()
		.references(() => users.id),
	phone: text().notNull(),
});

export const directorPreferences = gelTable("DirectorPreferences", {
	id: uuid().primaryKey().notNull(),
	userId: uuid()
		.notNull()
		.references(() => users.id),
	email: text(),
	phone: text(),
});

//     scalar type Relationship extending enum<Parent, Guardian, Coach, Friend, Relative, Other>;

export const emergencyContact = gelTable("EmergencyContact", {
	name: text().notNull(),
	relationship: text().notNull(),
	userId: uuid().notNull(),
	email: text().notNull(),
	phone: text().notNull(),
	note: text().notNull(),
});

//     scalar type Social extending enum<Instagram, Facebook, YouTube, TikTok, Other>;

//     # Not used yet
//     type SocialLink {
//         required social: Social;
//         required url: str {
//             constraint max_len_value(100);
//         }
//         required user -> User  {
//             on target delete delete source;
//         }
//     }

//     scalar type BeachStatus extending enum<
//         Active,

//         # Tournaments were held here but not anymore
//         # Not shown in list
//         # Only shown in search dropdown if specifically searched for
//         Legacy,

//         # Not shown in list or search unless admin
//         Hidden,
//     >;

//     type Beach {
//         # TODO various exclusive constraints, once touched up
//         # TODO drop unused (0 tournaments)
//         # TODO drop after migrations
//         legacy_id: int32 {
//             constraint exclusive;
//             readonly := true;
//         }
//         # Eg Ocean Park
//         required name: str {
//             constraint min_len_value(5);
//             constraint max_len_value(54);
//         }
//         required city: str {
//             constraint min_len_value(5);
//             constraint max_len_value(54);
//         }
//         # Eg OP
//         required short_name: str {
//             constraint exclusive;
//             constraint min_len_value(2);
//             constraint max_len_value(2);
//         }
//         # Relative to www.cbva.com/b/, eg hermosa
//         required url: str {
//             constraint exclusive;
//             constraint min_len_value(4);
//             constraint max_len_value(38);
//         }
//         required refund_cutoff: duration {
//             default := <duration>'21 hours'
//         }
//         auto_open: duration;
//         required directions: str {
//             constraint min_len_value(2);
//             constraint max_len_value(2500);
//         }
//         required description: str {
//             constraint min_len_value(2);
//             constraint max_len_value(2500);
//         }
//         required google_maps_link: str {
//             constraint min_len_value(2);
//             constraint max_len_value(2500);
//         }
//         required status: BeachStatus;
//         required director -> User;
//     }

//     scalar type TournamentStatus extending enum<
//         # Seeding always happens on any roster change
//         # TD always has a 'Preview Pools' button but pools aren't made yet
//         RosterPrivate,

//         # Automatic 9am the day before tournament
//         # TDs can toggle between this and private before then
//         # Enables button to generate pools
//         RosterPublic,

//         # Everything implicitly public
//         # Registration, pools are fully locked
//         # TD can set back to Public if games haven't started
//         # Displays sanction info
//         Running,

//         # Set by finals game being verified
//         # Waitlist cleared and refunded
//         # Results shown on team list
//         Complete,

//         # Roster, waitlist cleared and refunded
//         Cancelled,

//         Schedule
//     >;

//     scalar type RegistrationStatus extending enum<
//         # Shows normally
//         # Waitlist will automatically promote teams
//         Open,

//         # Shows normally but cannot register or waitlist unless invited.
//         # Used by Santa Cruz for T-30 days
//         # Used by Cal Cup to be qualifier only
//         # Otherwise only set manually
//         Closed,

//         # Specific TD, admin, registered, invited players can still find link easily
//         # Direct link to tournament always works
//         # This is a subtype of registration because hidden implicitly is also closed
//         Hidden,

//         # Only visible to admins
//         Test,
//     >;

//     # TODO manually apply these tags
//     scalar type TournamentTag extending enum<
//         CalCup, # Cal Cup qualifier. Will grant 2x points. TODO constraint is on juniors
//         BigMoney,
//         # "Recreational"/"Competitive" is whether requirements exists or not
//         # "Fours" is team_size
//         # "AVP Wildcard" is from its other object
//     >;

//     # A legacy tournament is this with no games, pools linked
//     # Teams are still there and have the required metadata
//     type Tournament extending HasCreated {
//         # TODO drop after migrations
//         legacy_id: int32 {
//             constraint exclusive;
//         }
//         bonus_points: int32;
//         point_factor: int32;

//         schedule_template -> Tournament;
//         required start_at: datetime;
//         # Unclear if these indices do anything
//         index on (.start_at);
//         index on (datetime_get(.start_at, 'day'));
//         index on (datetime_get(.start_at, 'month'));
//         index on (datetime_get(.start_at, 'year'));

//         # Should only be set if special name
//         # Though many juniors will be "AVP Bid Event"
//         # Use is name + gender + division for display
//         # As such, should not include gender or division
//         name: str {
//             constraint max_len_value(100);
//             rewrite insert, update using (
//                 with new := str_trim(str_replace(.name, '  ', ' '), '.:/- ')
//                 select new if len(new) > 0 else <str>{});
//         }

//         required url: str {
//             readonly := true;
//             constraint exclusive;
//             constraint min_len_value(8);
//             constraint max_len_value(8);
//             rewrite insert using (
//                 with letters := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
//                 select to_str(array_agg((for _ in range_unpack(range(0, 8)) union (
//                         letters[<int64>math::floor(random() * 1000 % len(letters))])
//                     )), '')
//             );
//         }

//         # The annual schedule is made up of these with status = Schedule
//         # Admin will have a button to clone schedule into year's tournaments
//         # Hidden tournaments can only be viewed by admins or TD
//         # There is no deletion
//         required status: TournamentStatus;
//         index on (.status);
//         required registration: RegistrationStatus;
//         index on (.registration);
//         required fee: float32; # Cost per team to enter

//         required division: Division;
//         index on (.division);
//         required gender: Gender;
//         index on (.gender);

//         required team_size: int16 {
//             default := 2;
//         }

//         custom_format: str {
//             constraint max_len_value(1000);
//         }

//         # If set this is a "rec" tournament
//         # All requirments must be fulfilled
//         # Rated division check is done by the overall division
//         # Juniors division check requires sufficient players
//         # Eg a coed AA tournament would have
//         # [{ minimum: 1, gender: Female, division: AA },
//         #  { minimum: 1, gender: Male, division: AA }]
//         # Eg a 4's A team could have team_size 4 and
//         # [{ minimum: 1, gender: Female, division: A },
//         #  { minimum: 1, gender: Male, division: A }]
//         # Or a Father/Daughter 14u team would have
//         # [{ minimum: 1, gender: Female, division: 14u },
//         #  { minimum: 1, gender: Male, division: Open }]
//         # Or a Father/Son would be:
//         # [{ minimum: 1, gender: Male, division: 14u },
//         #  { minimum: 1, gender: Male, division: Open }]
//         # These can display manually in title & fully on the tournament page
//         # TODO UI must make it clear when a tournament is competitive or rec
//         requirements: array<tuple<minimum: int16, gender: Gender, division: Division>>;
//         index on (exists .requirements);
//         constraint expression on (
//             exists .requirements or (.gender != Gender.Coed and .team_size = 2)
//         );

//         # tags: array<TournamentTag>;
//         # TODO proper index
//         # index on (contains(.tags, TournamentTag.TourStop))

//         # This allows for the tournament to be full when autopromote is disabled
//         required full: bool {
//             default := false;
//         }
//         required beach -> Beach;
//         required multi directors -> DirectorPreferences {
//             rank: int16;
//         }

//         required pools_public: bool {
//             default := false;
//         }

//         # required fee: float32; # Cost per team to enter
//         # # How much the office gets per team, in flat amount
//         # # Used by financial overview for TD, admin
//         # required office_cut: float32 {
//         #     default := 15;
//         # }

//         # If null, uses schedule version (TODO), then beach
//         directions: str {
//             constraint min_len_value(5);
//             constraint max_len_value(2500);
//         }
//         description: str {
//             constraint min_len_value(5);
//             constraint max_len_value(6000);
//         }

//         # -1 for half
//         # 0 for never (or per set if match)
//         # 7 for (every 7 for 21+ / every 5 for less)
//         # Other numbers for that number
//         # UI displays Standard (default), Half, Never, Other (input)
//         # required side_switch: int16 {
//         #     default := 7;
//         # }

//         required max_teams: int16 {
//             default := 10;
//         }
//         required max_waitlist: int16 {
//             default := 5;
//         }
//         required autopromote_wl: bool {
//             default := true;
//         }

//         # Bitmap encoding 4 bit warmup, 4 bit timeout (2x), 3 bit technical, 1 bit medical
//         # Warmup: 2.5m per, 10m base, starts the moment previous game ends
//         # Timeout: 30 seconds per
//         # Technical: 0, 30, 60, 90, 120, 180, 240, 300
//         # Medical: Kinda whatever, could even drop a bit
//         # required durations: int16 {
//         #     # 0010 warmup for 10 + 5 mins between games
//         #     # 0010 timeout 1, 2 = 1 min
//         #     # 0000 timeout 2, none
//         #     # 010  technical, 2 = 1 min
//         #     # 1    medical 5 min medical
//         #     # 0010001000000101
//         #     default := 8709;
//         # }
//         # required photo -> Photo;

//         # Backend hardcoded +time from tournament for first, second eligible
//         # Should send email to players, coaches when about to expire
//         # With link to both qualifier and main tournament
//         # Qualifier tournament has pass UI (with confirmation modal)
//         # Main tournament has buttons to pass or register that prefills the team
//         # And passes along metadata of which qualifier to claim, passes on others for both players
//         # Could also ignore pass UI, not like they would ever use it
//         # Multiple rows if multiple eligibilities

//         # I debated making this a multi property but no immediate use
//         # Decent increase in complexity esp UI
//         # But easy enough to add later if needed
//         # qualifier_for -> Tournament {
//         #     # Is default -time from Cal Cup or +time from tournament?
//         #     # Maybe a setting on the target tournament
//         #     # Also admin editable
//         #     expires_at: datetime;
//         #     finish_eligible: int16;
//         # }

//         # Probably just do both players invited separately, only invited eligible
//         # TD can sort it out if they somehow make the wrong team
//         # Also allows more generic form where they can choose any partner
//         multi invited -> User;

//         # Defaults are stored on TDs?
//         # Global defaults?
//         # multi withdrawal_rules -> WithdrawalRule;
//     }

//     scalar type TeamStatus extending enum<
//         Active,

//         # No withdraw fees
//         # Full refund to wallet when tournament starts
//         # Can be solo due to signing up to waitlist while solo
//         Waitlisted,

//         # Terminal statuses
//         # These states cannot be changed - team has to sign up again
//         # Except forfeit can go abandoned ref/ejected?
//         # UI needs a lot of confirms around this
//         # Unless denoted as inactive, teams are still "active"
//         # Are shown in list of teams, are in pools
//         # They just don't have / won't have more games
//         # May have a section showing inactive teams

//         Transferred, # Inactive status

//         # Set by user withdrawal (until noon day before)
//         # Creates appropriate wallet refunds minus fees
//         Withdrawn, # Inactive status

//         # Score history stays for games already played or in progress
//         # If playoffs, handles like a loss
//         # If pool, calculates them as full losses
//         # If somehow still put to playoffs (eg small tournament)
//         # Make sure # playoff teams is actually min(# teams, # playoffs teams)
//         # Also important in case TD sets number higher than signups (also no shows)
//         # Can be set by either TD or team
//         Forfeited,

//         # Manually set by TD
//         AbandonedRef,
//         Ejected, # Similar to Forfeit but displays different
//         # Inactive statuses. No refund.
//         LateWithdrawn,
//         NoShowed,
//     >;

//     type Team extending HasCreated {
//         # TODO drop after migrations
//         legacy_id: int32 {
//             constraint exclusive;
//         }
//         legacy_payment_id: int32;

//         # Basically just a url slug.
//         required url: str {
//             readonly := true;
//             constraint exclusive;
//             constraint min_len_value(8);
//             constraint max_len_value(8);
//             rewrite insert using (
//                 with letters := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
//                 select to_str(array_agg((for _ in range_unpack(range(0, 8)) union (
//                         letters[<int64>math::floor(random() * 1000 % len(letters))])
//                     )), '')
//             );
//         }

//         # Transaction key from usaepay
//         # LEGACY for teams prior to migration
//         # ADMIN:id for td/admin override pay
//         required transaction_key: str;

//         # Changing players is allowed until pools are public
//         # If change after that is needed TD can do it
//         multi players -> User {
//             # Current values set at time of tournament start
//             # Before start uses directly from User
//             rating: Rating;
//             points: float32; # Rated/junior depending on division
//             rank: int32;
//             checked_in: bool;
//             note: str {
//                 constraint max_len_value(500);
//             }
//         }
//         # Purchaser is duplicated into here from purchase
//         # TODO trigger for adding that
//         # They can theoretically be removed & simplifies query
//         # UI elements to add, remove people if needed
//         multi can_edit -> User;
//         # "Transfer" registration is actually withdraw -> reregister
//         required tournament -> Tournament {
//             readonly := true;
//         }
//         # TODO constraint appropriate TerminalStatus exists
//         # TODO trigger assert cannot change once terminal
//         required status: TeamStatus;
//         index on (.status);

//         # Position on waitlist if status is waitlist
//         # Null if other inactive status
//         # TODO constraint for that
//         seed: int16;
//         pool -> Pool;
//         pool_seed: int16; # May not be in same order as seed, eg late join

//         finish: int16;
//         points_earned: float32; # Juniors vs rated points from tournament type
//         rating_earned: Rating;

//         # trigger active after insert, update for each do (
//         #     assert(__new__.status = TeamStatus.Withdrawn or
//         #     __new__.tournament.status = TournamentStatus.Complete or
//         #     __new__.players.active,
//         #     message := 'Invalid player membership')
//         # );

//         # trigger team_size after insert, update for each do (
//         #     assert(__new__.status = TeamStatus.Withdrawn or
//         #     __new__.tournament.status = TournamentStatus.Complete or
//         #     count(__new__.players) = __new__.tournament.team_size,
//         #     message := 'Invalid team size')
//         # );

//         # trigger gender after insert, update for each do (
//         #     assert(__new__.tournament.status = TournamentStatus.Complete or
//         #         __new__.tournament.gender = Gender.Coed or
//         #         __new__.players.gender = __new__.tournament.gender,
//         #     message := 'Invalid player gender')
//         # );

//         # trigger juniors after insert, update for each do (
//         #     assert((with
//         #         d := __new__.tournament.division,
//         #         diff := 0 if d = Division.U18 else
//         #                 2 if d = Division.U16 else
//         #                 4 if d = Division.U14 else
//         #                 6 if d = Division.U12 else
//         #                 -10000,
//         #         sept_diff := 1 if datetime_get(__new__.tournament.start_at, 'month') > 8 else 0
//         #         select __new__.status = TeamStatus.Withdrawn or
//         #         __new__.tournament.status = TournamentStatus.Complete or
//         #         exists __new__.tournament.requirements or
//         #         d in {
//         #             Division.Open,
//         #             Division.AAA,
//         #             Division.AA,
//         #             Division.A,
//         #             Division.B,
//         #             Division.Unrated,
//         #         } or
//         #         datetime_get(__new__.tournament.start_at, 'year') + diff + sept_diff <= (__new__.players.high_school_grad_year ?? 0)),
//         #     message := 'Invalid player age')
//         # );

//         # trigger rated after insert, update for each do (
//         #     assert((with
//         #         d := __new__.tournament.division,
//         #         rs := __new__.players.rating
//         #         select __new__.status = TeamStatus.Withdrawn or
//         #         __new__.tournament.status = TournamentStatus.Complete or
//         #         d in {
//         #             Division.Open,
//         #             Division.AAA,
//         #             Division.U18,
//         #             Division.U16,
//         #             Division.U14,
//         #             Division.U12,
//         #         } or
//         #         (rs not in { Rating.AAA } if d = Division.AA else
//         #         rs not in { Rating.AAA, Rating.AA } if d = Division.A else
//         #         rs not in { Rating.AAA, Rating.AA, Rating.A } if d = Division.B else
//         #         rs not in { Rating.AAA, Rating.AA, Rating.A, Rating.B })),
//         #     message := 'Invalid player rating')
//         # );

//         # trigger full_status_check after insert for each do (
//         #     with cnt := count((
//         #         select __new__.tournament.<tournament[is Team]
//         #         filter .status = TeamStatus.Active
//         #     )),
//         #     update __new__.tournament set {
//         #         full := (cnt >= .max_teams) and
//         #         assert(cnt <= .max_teams, message := 'Tournament Full') and
//         #         assert(.status in { TournamentStatus.RosterPublic, TournamentStatus.RosterPrivate } and
//         #                .registration in { RegistrationStatus.Open, RegistrationStatus.Test },
//         #                message := 'Invalid tournament status')
//         #     }
//         # );

//         trigger set_tournament_full after insert for each do (
//             with cnt := count((
//                 select __new__.tournament.<tournament[is Team]
//                 filter .status = TeamStatus.Active
//             )),
//             update __new__.tournament set {
//                 full := (cnt >= .max_teams)
//             }
//         );
//     }

//     type TeamPlayerChanged extending HasCreated {
//         required team -> Team {
//             readonly := true;
//         }
//         required multi old -> User {
//             readonly := true;
//             on target delete delete source;
//         }
//         required multi new -> User {
//             readonly := true;
//             on target delete delete source;
//         }
//         required editor -> User {
//             readonly := true;
//             on target delete delete source;
//         }
//     }

//     type Pool {
//         # Let's have some fun
//         # Take various alphabetical word lists
//         # So can shorten to Pool A-F whatever
//         # But display as full name
//         required name: str;
//         # index on (.name);
//         required tournament -> Tournament {
//             readonly := true;
//         }
//         court: str {
//             constraint max_len_value(50);
//             rewrite insert, update using (str_trim(.court, '.:/- '));
//         }
//         # Teams are implicit via series
//         # Ranking calculated on the fly?
//         # Or via fields that are calculated via trigger?

//         # Courts are implicit via series
//         # Logic for 6+ team pools on multiple courts in frontend
//         # Large pools are rare, will just do its best, TD can override

//         # Pool play shows in seed order until done
//         # Still keeps original seed, order calculated in frontend
//         # TODO constraint that if true,
//         # No games in this pool have contested
//         # All games have an end time
//         required done: bool {
//             default := false;
//         }

//         constraint exclusive on ((.name, .tournament))
//     }

//     abstract type MatchNumber {
//         required match_number: int16;
//         team_a -> Team;
//         team_b -> Team;
//         # If manually set by TD/admin can be user
//         # Phil can access score independently of this, if enabled
//         multi refs -> User {
//             scorekeeper: bool;
//             # constraint exclusive on ((@source, @scorekeeper));
//         }

//         court: str {
//             constraint max_len_value(50);
//             rewrite insert, update using (str_trim(.court, '.:/- '));
//         }

//         # If not set uses what tournament has. See bitmap on tournament.
//         # Between sets in a match is always 5 mins
//         # durations: int16;
//     }

//     type PoolMatch extending MatchNumber {
//         overloaded required team_a -> Team;
//         overloaded required team_b -> Team;

//         required pool -> Pool {
//             readonly := true;
//         }

//         # index on (.match_number);
//         constraint exclusive on ((.match_number, .pool))
//     }

//     type PlayoffMatch extending MatchNumber {
//         required tournament -> Tournament {
//             readonly := true;
//         }

//         # TODO change this to a single multi link with constraints
//         a_from -> PlayoffMatch | Pool {
//             rank: int16;
//         }
//         b_from -> PlayoffMatch | Pool {
//             rank: int16;
//         }
//         # multi teams_from: PlayoffMatch | Pool {
//         #     rank: int16;
//         #     # constraint exclusive on((@target, @rank));
//         #     side: PlayoffSide;
//         #     constraint expression on (@side ?= PlayoffSide.A or @side ?= PlayoffSide.B);
//         #     # constraint exclusive on ((@source, @side));
//         # }

//         # Doesn't work, can't use agg functions
//         # constraint expression on (count(.teams_from) <= 2);

//         ref_from -> PlayoffMatch;

//         constraint exclusive on ((.match_number, .tournament));
//     }

//     # Can't be called Set because reserved :(
//     type MatchSet {
//         required for_match -> MatchNumber {
//             readonly := true;
//         }
//         required set_number: int16;
//         # index on (.set_number);
//         started_at: datetime;
//         ended_at: datetime;
//         # required service -> int32 {
//         #     # Bitmap encoding initial order, next serve
//         #     default := 0;
//         # }
//         required win_score: int16;
//         score: bytes; # History bitmap, score calculated on frontend
//         # Bitmap again, with point taken, duration
//         # Up to 8 times to track - warmup, 2x normal, 2x medical, technical
//         # Team is a bit
//         # Score taken at is 7 bits
//         # Type of timeout is 2 bits
//         # If 2 bytes, leaves 6 bits
//         # Probably just add a byte and use 14 bits to track to the second
//         # Maybe on series?
//         # Probably a total stretch goal for now
//         # required timeouts: bytes;

//         constraint exclusive on ((.set_number, .for_match));
//     }

//     type Invite extending HasCreated {
//         required multi tournament -> Tournament;
//         # One or more players
//         # If a player is specified, they must be on the team
//         required multi players -> User;

//         source_tournament -> Tournament
//     }

//     type Faq {
//         required question: str;
//         required answer: str;
//     }

//     scalar type OptInService extending enum<ConstantContact>;

//     type OptIn extending HasCreated {
//       required user: User;
//       required service: OptInService;
//       required committed: bool {
//         default := false;
//       }
//       constraint exclusive on ((.user, .service))
//     }

//     type ConstantContactContact extending HasCreated {
//       required user: User;
//       required list_memberships: array<uuid>;

//       # If different than .user.email, contant contact needs updated
//       required email: str;

//       # Populated once created via the api
//       constant_contact_id: uuid;

//       constraint exclusive on (.user)
//     }

//     type VblPublication {
//       required tournament: Tournament;

//       required published: bool {
//         default := false
//       }

//       created: datetime {
//         rewrite insert using (datetime_of_statement())
//       }
//       modified: datetime {
//         rewrite update using (datetime_of_statement())
//       }
//     }
// }

export const beaches = gelTable("Beach", {
	id: uuid().primaryKey().notNull(),
	legacyId: integer(),
	name: text().notNull(),
	city: text().notNull(),
	shortName: text().notNull(),
	url: text().notNull(),
	refundCutoff: duration().notNull(),
	autoOpen: duration(),
	directions: text().notNull(),
	description: text().notNull(),
	googleMapsLink: text().notNull(),
	status: text().notNull(),
	directorId: uuid()
		.references(() => users.id)
		.notNull(),
});

export const tournaments = gelTable("Tournament", {
	...hasCreated,
	id: uuid().primaryKey().notNull(),
	legacyId: integer(),
	bonusPoints: integer(),
	pointFactor: integer(),
	scheduleTemplateId: uuid().references((): AnyGelColumn => tournaments.id),
	startAt: timestamptz().notNull(),
	name: text(),
	url: text().notNull(),
	status: text().notNull(),
	registration: text().notNull(),
	fee: real().notNull(),
	division: text().notNull(),
	gender: text().notNull(),
	teamSize: integer().notNull().default(2),
	customFormat: text(),
	requirements:
		json().$type<{ minimum: number; gender: string; division: string }[]>(),
	full: boolean().notNull().default(false),
	beachId: uuid()
		.references(() => beaches.id)
		.notNull(),
	poolsPublic: boolean().notNull().default(false),
	directions: text(),
	description: text(),
	maxTeams: integer().notNull().default(10),
	maxWaitlist: integer().notNull().default(5),
	autopromoteWl: boolean().notNull().default(true),
});

export const tournamentDirectors = gelTable(
	"Tournament.directors",
	{
		source: uuid().notNull(),
		target: uuid().notNull(),
		rank: integer(),
	},
	(table) => [
		foreignKey({
			columns: [table.target],
			foreignColumns: [directorPreferences.id],
			name: "Tournament.directors_fk_target",
		})
			.onUpdate("restrict")
			.onDelete("restrict"),
		foreignKey({
			columns: [table.source],
			foreignColumns: [tournaments.id],
			name: "Tournament.directors_fk_source",
		})
			.onUpdate("restrict")
			.onDelete("restrict"),
	],
);

export const tournamentInvites = gelTable("TournamentInvites", {
	id: uuid().primaryKey().notNull(),
	tournamentId: uuid()
		.references(() => tournaments.id)
		.notNull(),
	userId: uuid()
		.references(() => users.id)
		.notNull(),
});

export const teams = gelTable("Team", {
	...hasCreated,
	id: uuid().primaryKey().notNull(),
	legacyId: integer(),
	legacyPaymentId: integer(),
	url: text().notNull(),
	transactionKey: text().notNull(),
	tournamentId: uuid()
		.references(() => tournaments.id)
		.notNull(),
	status: text().notNull(),
	seed: integer(),
	poolId: uuid().references(() => pools.id),
	poolSeed: integer(),
	finish: integer(),
	pointsEarned: real(),
	ratingEarned: text(),
});

export const teamPlayers = gelTable(
	"Team.players",
	{
		source: uuid().notNull(),
		target: uuid().notNull(),
		rank: integer(),
	},
	(table) => [
		foreignKey({
			columns: [table.target],
			foreignColumns: [users.id],
			name: "Team.players_fk_target",
		})
			.onUpdate("restrict")
			.onDelete("restrict"),
		foreignKey({
			columns: [table.source],
			foreignColumns: [teams.id],
			name: "Team.players_fk_source",
		})
			.onUpdate("restrict")
			.onDelete("restrict"),
	],
);

export const teamCanEdit = gelTable("TeamCanEdit", {
	id: uuid().primaryKey().notNull(),
	teamId: uuid()
		.references(() => teams.id)
		.notNull(),
	userId: uuid()
		.references(() => users.id)
		.notNull(),
});

export const teamPlayerChanges = gelTable("TeamPlayerChanged", {
	...hasCreated,
	id: uuid().primaryKey().notNull(),
	teamId: uuid()
		.references(() => teams.id)
		.notNull(),
	editorId: uuid()
		.references(() => users.id)
		.notNull(),
});

export const teamPlayerChangesOld = gelTable("TeamPlayerChangedOld", {
	id: uuid().primaryKey().notNull(),
	teamPlayerChangeId: uuid()
		.references(() => teamPlayerChanges.id)
		.notNull(),
	userId: uuid()
		.references(() => users.id)
		.notNull(),
});

export const teamPlayerChangesNew = gelTable("TeamPlayerChangedNew", {
	id: uuid().primaryKey().notNull(),
	teamPlayerChangeId: uuid()
		.references(() => teamPlayerChanges.id)
		.notNull(),
	userId: uuid()
		.references(() => users.id)
		.notNull(),
});

export const pools = gelTable("Pool", {
	id: uuid().primaryKey().notNull(),
	name: text().notNull(),
	tournamentId: uuid()
		.references(() => tournaments.id)
		.notNull(),
	court: text(),
	done: boolean().notNull().default(false),
});

export const poolMatches = gelTable("PoolMatch", {
	id: uuid().primaryKey().notNull(),
	matchNumber: integer().notNull(),
	teamAId: uuid().references(() => teams.id),
	teamBId: uuid().references(() => teams.id),
	poolId: uuid()
		.references(() => pools.id)
		.notNull(),
	court: text(),
});

export const playoffMatches = gelTable("PlayoffMatch", {
	id: uuid().primaryKey().notNull(),
	matchNumber: integer().notNull(),
	teamAId: uuid().references(() => teams.id),
	teamBId: uuid().references(() => teams.id),
	tournamentId: uuid()
		.references(() => tournaments.id)
		.notNull(),
	aFromId: uuid(), // .references((): AnyGelColumn => playoffMatches.id),
	// aFromPoolId: uuid().references(() => pools.id),
	// aFromRank: integer(),
	bFromId: uuid(), //.references((): AnyGelColumn => playoffMatches.id),
	// bFromPoolId: uuid().references(() => pools.id),
	// bFromRank: integer(),
	refFromId: uuid(), // .references((): AnyGelColumn => playoffMatches.id),
	court: text(),
});

export const matchRefs = gelTable("MatchRefs", {
	id: uuid().primaryKey().notNull(),
	matchId: uuid().notNull(),
	userId: uuid()
		.references(() => users.id)
		.notNull(),
	scorekeeper: boolean(),
});

export const matchSets = gelTable("MatchSet", {
	id: uuid().primaryKey().notNull(),
	forMatchId: uuid().notNull(),
	setNumber: integer().notNull(),
	startedAt: timestamp(),
	endedAt: timestamp(),
	winScore: integer().notNull(),
	score: text(),
});

export const invites = gelTable("Invite", {
	...hasCreated,
	id: uuid().primaryKey().notNull(),
	sourceTournamentId: uuid().references(() => tournaments.id),
});

export const inviteTournaments = gelTable("InviteTournaments", {
	id: uuid().primaryKey().notNull(),
	inviteId: uuid()
		.references(() => invites.id)
		.notNull(),
	tournamentId: uuid()
		.references(() => tournaments.id)
		.notNull(),
});

export const invitePlayers = gelTable("InvitePlayers", {
	id: uuid().primaryKey().notNull(),
	inviteId: uuid()
		.references(() => invites.id)
		.notNull(),
	userId: uuid()
		.references(() => users.id)
		.notNull(),
});

export const faqs = gelTable("Faq", {
	id: uuid().primaryKey().notNull(),
	question: text().notNull(),
	answer: text().notNull(),
});
