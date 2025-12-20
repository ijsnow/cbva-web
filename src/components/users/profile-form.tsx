import { type CalendarDate, today } from "@internationalized/date";
import z from "zod/v4";
import { useViewer } from "@/auth/shared";
import { useAppForm } from "@/components/base/form";
import {
	useInsertPlayerProfile,
	useUpdatePlayerProfile,
} from "@/data/profiles";
import type { CreatePlayerProfile } from "@/db/schema";
import { getDefaultTimeZone } from "@/lib/dates";

const schema = z.object({
	firstName: z
		.string({
			message: "This field is required",
		})
		.nonempty({
			message: "This field is required",
		}),
	preferredName: z.string().optional().nullable(),
	lastName: z
		.string({
			message: "This field is required",
		})
		.nonempty({
			message: "This field is required",
		}),
	birthdate: z
		.any()
		.refine((value) => Boolean(value), {
			message: "This field is required",
		})
		.refine(
			(value: CalendarDate) => {
				if (!value) {
					return true;
				}

				const todayDate = today(getDefaultTimeZone());

				return value < todayDate;
			},
			{
				message: "Player must have already been born to play",
			},
		),
	gender: z.enum(["female", "male"], {
		message: "This field is required",
	}),
	imageSource: z.string().optional().nullable(),
	bio: z.string().optional().nullable(),
	heightFeet: z.number().optional().nullable(),
	heightInches: z.number().optional().nullable(),
	dominantArm: z.enum(["right", "left"]).optional().nullable(),
	preferredRole: z.enum(["blocker", "defender", "split"]).optional().nullable(),
	preferredSide: z.enum(["right", "left"]).optional().nullable(),
	club: z.string().optional().nullable(),
	highSchoolGraduationYear: z.number().optional().nullable(),
	college_team: z.string().optional().nullable(),
	collegeTeamYearsParticipated: z.number().optional().nullable(),
});

export function ProfileForm({
	className,
	initialValues,
	isEdit,
	onSuccess,
	onCancel,
}: {
	className?: string;
	initialValues?: CreatePlayerProfile | null;
	isEdit?: boolean;
	onSuccess?: () => void;
	onCancel?: () => void;
}) {
	const viewer = useViewer();

	const { mutate: insert } = useInsertPlayerProfile();
	const { mutate: update } = useUpdatePlayerProfile();

	const form = useAppForm({
		defaultValues:
			initialValues ??
			({} as Partial<
				Omit<CreatePlayerProfile, "birthdate"> & { birthdate: CalendarDate }
			>),
		validators: {
			onMount: schema,
			onBlur: schema,
			onChange: schema,
		},
		onSubmit: ({ value: { birthdate, ...value } }) => {
			if (isEdit) {
				update(
					{
						...(value as Omit<CreatePlayerProfile, "birthdate">),
						birthdate: birthdate!.toString(),
					},
					{
						onSuccess,
					},
				);
			} else {
				insert(
					{
						...(value as Omit<CreatePlayerProfile, "birthdate">),
						birthdate: birthdate!.toString(),
					},
					{
						onSuccess,
					},
				);
			}
		},
	});

	return (
		<form
			className={className}
			onSubmit={(e) => {
				e.preventDefault();

				const data = new FormData(e.target as HTMLFormElement);

				form.handleSubmit(data);
			}}
		>
			<div className="grid grid-cols-6 gap-4 max-w-md items-end">
				<form.AppField
					name="firstName"
					children={(field) => (
						<field.Text
							isRequired
							className="col-span-full"
							label="First Name"
							field={field}
							isDisabled={isEdit}
						/>
					)}
				/>

				<form.AppField
					name="preferredName"
					children={(field) => (
						<field.Text
							className="col-span-full"
							label="Preferred Name"
							field={field}
						/>
					)}
				/>

				<form.AppField
					name="lastName"
					children={(field) => (
						<field.Text
							isRequired
							className="col-span-full"
							label="Last Name"
							field={field}
							isDisabled={isEdit}
						/>
					)}
				/>

				<form.AppField
					name="birthdate"
					children={(field) => (
						<field.Date
							className="col-span-full"
							isRequired
							label="Birthday"
							field={field}
							isDisabled={isEdit}
						/>
					)}
				/>

				<form.AppField
					name="gender"
					children={(field) => (
						<field.Select
							isRequired
							className="col-span-full"
							label="Gender"
							field={field}
							options={[
								{
									display: "Female",
									value: "female",
								},
								{
									display: "Male",
									value: "male",
								},
							]}
							isDisabled={isEdit}
						/>
					)}
				/>

				<form.AppField
					name="imageSource"
					children={(field) => (
						<field.ImageUpload
							className="col-span-full"
							label="Profile Photo"
							field={field}
							bucket="users"
							prefix={`${viewer?.id}/profile-photos`}
							circular={true}
						/>
					)}
				/>

				<form.AppField
					name="bio"
					children={(field) => (
						<field.TextArea
							className="col-span-full"
							label="Bio"
							field={field}
							placeholder="Tell us about yourself..."
						/>
					)}
				/>

				<form.AppField
					name="heightFeet"
					children={(field) => (
						<field.Number
							className="col-span-3"
							label="Height"
							placeholder="ft"
							minValue={0}
							field={field}
						/>
					)}
				/>

				<form.AppField
					name="heightInches"
					children={(field) => (
						<field.Number
							className="col-span-3"
							placeholder="in"
							minValue={0}
							field={field}
						/>
					)}
				/>

				<form.AppField
					name="dominantArm"
					children={(field) => (
						<field.Select
							className="col-span-full"
							label="Dominant Arm"
							field={field}
							options={[
								{
									display: "Right",
									value: "right",
								},
								{
									display: "Left",
									value: "left",
								},
							]}
						/>
					)}
				/>

				<form.AppField
					name="preferredRole"
					children={(field) => (
						<field.Select
							className="col-span-3"
							label="Preferred Role"
							field={field}
							options={[
								{
									display: "Blocker",
									value: "blocker",
								},
								{
									display: "Defender",
									value: "defender",
								},
								{
									display: "Split",
									value: "split",
								},
							]}
						/>
					)}
				/>

				<form.AppField
					name="preferredSide"
					children={(field) => (
						<field.Select
							className="col-span-3"
							label="Preferred Side"
							field={field}
							options={[
								{
									display: "Right",
									value: "right",
								},
								{
									display: "Left",
									value: "left",
								},
							]}
						/>
					)}
				/>

				<form.AppField
					name="highSchoolGraduationYear"
					children={(field) => (
						<field.Number
							className="col-span-full"
							label="High School Graduation year"
							placeholder="2030"
							minValue={1900}
							formatOptions={{ useGrouping: false }}
							field={field}
						/>
					)}
				/>

				<form.AppField
					name="club"
					children={(field) => (
						<field.Text
							className="col-span-full"
							label="Club"
							placeholder="Clubname"
							field={field}
						/>
					)}
				/>

				<form.AppField
					name="collegeTeam"
					children={(field) => (
						<field.Text
							className="col-span-3"
							label="College Team"
							placeholder="College Name"
							field={field}
						/>
					)}
				/>

				<form.AppField
					name="collegeTeamYearsParticipated"
					children={(field) => (
						<field.Number
							className="col-span-3"
							label="Number of Years Participated"
							minValue={0}
							field={field}
						/>
					)}
				/>

				<form.AppForm>
					<form.Footer className="col-span-full">
						{onCancel && (
							<form.Button color="default" onClick={onCancel}>
								Cancel
							</form.Button>
						)}

						<form.SubmitButton>Submit</form.SubmitButton>
					</form.Footer>
				</form.AppForm>
			</div>
		</form>
	);
}
