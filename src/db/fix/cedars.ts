import "dotenv/config";

import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { v4 as uuidv4 } from "uuid";
import { blogs, CreateBlog } from "../schema";
import { db } from "../connection";
import { LexicalEditorService } from "../seed/lexical";
import { marked } from "marked";

const STORAGE_URL = `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public`;

const BLOGS: [string, string, string, string][] = [
	[
		"Should Athletes Play through Pain?",
		'The "gladiator" mentality throughout sports history has been widely celebrated and glorified. For avid sports fans such as myself, we can remember those seemingly impossible performances by such revered modern-day warriors as the late, great Kobe Bryant, shooting and making two free throws...',
		"/cedars/new/play-through.png",
		"https://www.vernonwilliamsmd.com/blog/2021/march/dr-williams-for-u-s-news-world-report-should-ath/",
	],
	[
		"Achilles Tendon Tears – 3 Commonly Asked Questions",
		"From an anatomical standpoint, the Achilles tendon can be highly underappreciated until something goes wrong with it. This strong cord of fibrous tissue connects the muscles from the back of the calf to the heel bone in each leg, and it is used with every step you take. Achilles tendon tears are most commonly seen in athletes – both ...",
		"/cedars/new/achilles.jpg",
		"https://www.cedars-sinai.org/blog/how-to-treat-an-achilles-tendon-tear.html",
	],
	[
		"ACL Tears in Girls and Women Athletes",
		"Medical experts are still learning why certain groups are more prone to sports injuries than others. Women and girls—especially those who play soccer, basketball or softball—are more likely than boys and men to tear the anterior cruciate ligament (ACL), knee tissue that connects the thighbone to the shin and requires...",
		"/cedars/new/acl.png",
		"https://www.cedars-sinai.org/blog/acl-tears-in-girls-and-women.html",
	],
	[
		"How Some Sports Injuries Can Cause Arthritis at an Early Age",
		"Your high school soccer career ended with a torn anterior cruciate ligament (ACL) and knee surgery. Now, 20 years later, you're experiencing increasing pain in that same knee and the doctor diagnoses the problem as post-traumatic osteoarthritis (PTOA)...",
		"/cedars/new/arthritis.png",
		"https://www.cedars-sinai.org/blog/arthritis-at-early-age.html",
	],
	[
		"Gender Differences Mean More Knee Injuries for Women",
		"Though men and women are equal, they're not the same—and that includes their knees. Those differences contribute to women athletes being more than twice as likely to tear their anterior cruciate ligament (ACL) as men, a figure that varies by sport. Female basketball players have a 3.5 times greater incidence of ACL tears...",
		"/cedars/new/gender-difference.png",
		"https://www.cedars-sinai.org/blog/gender-differences-knee-injuries.html",
	],
	[
		"Is there such a thing as too much exercise?",
		"News flash: Exercise is good for you. But is there such a thing as too much exercise? That's a question raised by the exponential growth in ultra-endurance athletics, such as ultramarathon running and extra-long triathlons. According to one report, worldwide participation in ultrarunning increased almost 1700% from the late 1990s to 2020...",
		"/cedars/new/too-much.png",
		"https://www.cedars-sinai.org/blog/is-there-such-a-thing-as-too-much-exercise.html",
	],
	[
		"How to Keep Your Knees Strong and Healthy",
		"Despite being the largest joint in the human body, the knee can be underappreciated when it comes to daily exercise. After all, if you ask most folks what their workout routines consist of, they will probably tell you they do squats and lunges for glute and quad toning, planks and crunches for abdominal muscle...",
		"/cedars/new/healthy-knees.png",
		"https://www.win-within.com/blog/2022/august/how-to-keep-your-knees-strong-and-healthy/",
	],
	[
		"Safety Tips for Avoiding Injury When Beginning to Exercise",
		"Living healthier, personal improvement and weight loss top many Americans' New Year's Resolution lists this year. This is undoubtedly a season of renewed focus on exercise and fitness for millions of people. And while we applaud our patients' renewed efforts towards improving their health and physical fitness – we ask that they do it carefully, thoughtfully, and with safety in mind...",
		"/cedars/new/range-of-motion.png",
		"https://www.cedars-sinai.org/blog/safety-tips-to-get-the-most-out-of-exercise-and-reduce-injury-risks.html",
	],
	[
		"Sleep – The secret weapon of Athletes",
		"As a sports neurologist, I witness firsthand the incredible dedication and rigorous training athletes employ to achieve peak performance in their chosen sport. However, one critical factor often overlooked by many athletes (and non-athletes) is the crucial role of sleep. Sleep is not merely a period of rest; it's a dynamic process during which...",
		"/cedars/new/sleep.png",
		"https://www.vernonwilliamsmd.com/blog/2025/february/sleep-the-secret-weapon-of-athletes-/",
	],
	[
		"Why are Women More Prone to Knee Injuries?",
		"Anatomical and hormonal differences may be to blame, but there are ways to help reduce the risk. More recent research has indicated what we orthopedic surgeons have often seen in our practice: women are 2 to 9 times more likely than men to have certain kinds of knee problems. Generally, knee injuries are very...",
		"/cedars/new/more-prone.png",
		"https://www.win-within.com/blog/2019/june/why-are-women-more-prone-to-knee-injuries-/",
	],
	[
		"Hormonal Birth Control Might Reduce Female Athletes' ACL Tears",
		"Female athletes are two to eight times more likely to tear their anterior cruciate ligament (ACL) than their male counterparts performing the same sport at the same level. They are also at greater risk for other ligament and tendon injuries, such as ankle sprains. One factor that may contribute to this...",
		"/cedars/new/hormonal-birth-control.png",
		"https://www.cedars-sinai.org/blog/hormonal-birth-control-might-reduce-female-athletes-acl-tears.html",
	],
	[
		"What is Tennis Elbow?",
		"Tennis elbow, also known as lateral epicondylitis, is an overuse injury that leads to pain in the forearm and elbow. Despite its name, tennis elbow can happen after doing many different activities, not just working on your backhand. To find out more about tennis elbow...",
		"/cedars/new/tennis-elbow.jpg",
		"https://www.cedars-sinai.org/blog/what-is-tennis-elbow.html",
	],
	[
		"De Quervain's Tenosynovitis: Understanding Wrist Pain",
		"As a board-certified orthopedic surgeon and hand surgeon, I frequently encounter patients struggling with radial-sided (thumb) wrist pain. A common culprit behind the pain is an ailment known as De Quervain's tenosynovitis. This inflammatory condition can significantly impact hand grip and, as a result, many activities of daily living. Let's delve...",
		"/cedars/new/wrist-pain.png",
		"https://www.cedars-sinai.org/blog/dequervains-tenosynovitis-understanding-wrist-pain.html",
	],
	[
		"Rotator Cuff: 10 Questions on Cause, Diagnosis, Treatment, & Recovery",
		"Shoulder pain from a rotator cuff injury can significantly disrupt your daily activities or favorite sports. This common condition, especially among athletes and older adults, can cause significant discomfort and limit mobility. This article will answer ten frequently asked questions about rotator cuff injuries, exploring everything from causes and diagnosis to treatment options and recovery tips. With knowledge and proper guidance, you can conquer...",
		"/cedars/new/rotator-cuff.png",
		"https://www.cedars-sinai.org/blog/questions-and-answers-about-rotator-cuff-tears.html",
	],
	[
		"Treatment and Prevention of Hamstring Injuries",
		"The Hamstring is a group of three muscles on the back of the upper leg, which bend the knee - critical for running and jumping. When considering a treatment plan for a hamstring injury, consider...",
		"/cedars/hamstring.png",
		"https://www.cedars-sinai.org/blog/how-to-treat-and-prevent-hamstring-injury.html",
	],
	[
		"The ABCs of ACL, LCL, MCL, and PCL Knee Injuries",
		'The knee joint is part of a complex cable-pulley system that is foundational for movement. The knee ligaments are "elasticized bands" of tissue that connects the thighbone to the two shin bones that give your knee joint its...',
		"/cedars/mcl.jpg",
		"https://www.cedars-sinai.org/blog/torn-acl.html",
	],
	[
		"Athletes and the Flu",
		"The influenza virus is a microscopic, infectious organism that replicates in your cells. Flu season typically hits during colder, drier months. Familiar symptoms are more severe than that of common cold, including fever, body aches, and cough, and the onset is often much more...",
		"/cedars/flu.png",
		"https://www.cedars-sinai.org/blog/how-athletes-can-weather-the-flu.html",
	],
	[
		'Understanding Adhesive Capsulitis - AKA "Frozen Shoulder"',
		'Frozen shoulder is a condition that occurs when inflammation in the ball and socket of the shoulder leads to a "sticking" of the head of the humerus or upper arm bone inside that socket. This condition more frequently impacts more often in...',
		"/cedars/frozen.png",
		"https://www.cedars-sinai.org/blog/the-mysteries-of-frozen-shoulder.html",
	],
	[
		"The Best Foods to Eat Post Workout",
		"Replenish what's lost during workout or competition including Carbohydrates to speed up recovery time, delay fatigue, restore muscle glycogen stores and minimize exercise-induced hypoglycemia (blood sugar deficiency in the bloodstream), and help maintain...",
		"/cedars/salmon.png",
		"https://www.cedars-sinai.org/blog/eating-well-is-crucial-after-working-out.html",
	],
	[
		"What to Know about DOMS (Delayed Onset of Muscle Soreness)",
		"Lengthy time off from your work-out regimen or even an elongated activity or endurance competition, the phenomenon known as DOMS, frequently occurs. The term delayed-onset muscle soreness simply refers to...",
		"/cedars/mfdooms.png",
		"https://www.cedars-sinai.org/blog/what-is-delayed-onset-muscle-soreness.html",
	],
	[
		"Why Range-of-Motion Matters, Especially for Athletes and Weekend Warriors",
		'The term "range-of-motion" is often used interchangeably with the word "flexibility" when describing any athletic movement. Specifically, range of motion refers to the degree of movement of an individual joint in...',
		"/cedars/dotherobot.png",
		"https://www.cedars-sinai.org/blog/better-range-of-motion-can-prevent-sports-injuries.html",
	],
	[
		"Can Playing Sports / Physical Activity Lead to a Healthier Brain?",
		"People who engage in regular, sustained physical activity tend to have more vigorous minds than those who don't. And all this exercise provides a variety of benefits, including increased blood flow and oxygen to the brain. Physical activity also helps a person's mind to become sharper and more focused...",
		"/cedars/braaaaains.png",
		"https://www.cedars-sinai.org/blog/running-your-way-to-better-bone-and-brain-health.html",
	],
	[
		"Understanding and Encouraging Sun Protective Behavior in Youth Athletes",
		"Sun exposure risks can be magnified, especially for young athletes who engage in an outdoor sport. By understanding what we know today about the sun-protective behaviors of young athletes and some tips to encourage regular and consistent sun protection in them, we can help reduce your young athlete's sun damage risk in the future...",
		"/cedars/bluelizard.png",
		"https://www.cedars-sinai.org/blog/protect-your-kids-from-the-sun.html",
	],
	[
		"Electrolytes. Beyond the Conventional Sports Drinks",
		"Staying properly hydrated is tantamount to any athlete's workout regimen or performance when competing. So, stay hydrated - Not just with Water! Electrolytes in your body are essential salt compounds that...",
		"/cedars/itswhatplantscrave.png",
		"https://www.cedars-sinai.org/blog/do-i-need-to-hydrate-with-electrolytes.html",
	],
];

function getContentType(filePath: string): string {
	const ext = filePath.split(".").pop()?.toLowerCase();

	switch (ext) {
		case "png":
			return "image/png";
		case "jpg":
		case "jpeg":
			return "image/jpeg";
		case "gif":
			return "image/gif";
		case "webp":
			return "image/webp";
		default:
			return "application/octet-stream";
	}
}

async function main() {
	const editor = new LexicalEditorService();

	const supabase = createClient(
		process.env.VITE_SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE_KEY!,
	);

	const timestamp = Date.now();
	const entries: CreateBlog[] = [];

	for (const [i, [title, summary, localImagePath, link]] of BLOGS.entries()) {
		await editor.injectHTML(await Promise.resolve(marked.parse(summary)));
		const summaryState = editor.getEditorStateJSON();

		// Read local image file and upload to Supabase
		const publicDir = join(process.cwd(), "public");
		const fullPath = join(publicDir, localImagePath);

		let imageSource: string | null = null;

		try {
			const fileBuffer = await readFile(fullPath);
			const contentType = getContentType(localImagePath);
			const ext = localImagePath.split(".").pop();
			const uniqueId = uuidv4();
			const fileName = `${uniqueId}-${timestamp}.${ext}`;
			const storagePath = `cedars/${fileName}`;

			const { error } = await supabase.storage
				.from("blogs")
				.upload(storagePath, fileBuffer, {
					contentType,
				});

			if (error) {
				console.error(`Failed to upload ${localImagePath}:`, error.message);
			} else {
				imageSource = `${STORAGE_URL}/blogs/${storagePath}`;
				console.log(`Uploaded: ${localImagePath} -> ${imageSource}`);
			}
		} catch (err) {
			console.error(`Failed to read file ${fullPath}:`, (err as Error).message);
		}

		entries.push({
			title,
			summary: summaryState,
			imageSource,
			link,
			order: i,
			tag: "cedars",
		});
	}

	await db.insert(blogs).values(entries);

	console.log(`Inserted ${entries.length} blog entries`);
	process.exit(0);
}

await main();
