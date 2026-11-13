import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'node:url';
import type { Pool } from 'pg';
import { z } from 'zod';
import { passwordSchema } from '@tactyqal/contracts';
import { createPool } from './database.ts';
const guides = [
    { slug: 'start-with-a-problem-not-an-app', title: 'Start with a problem, not an app', category: 'startup-ideas', excerpt: 'A practical way to notice everyday friction and turn it into a question you can investigate.', headings: ['Notice the small workarounds', 'Ask about the last time', 'Write one useful question'], paragraphs: ['Watch for moments when someone reaches for a spreadsheet, sends the same message twice, or keeps a paper reminder beside a screen. A workaround is a clue about work that matters to that person. Keep a notebook of observations rather than jumping straight to a feature list.', 'Invite a potential user to describe the last time the problem happened. Ask what they did, what took the most effort, and what happened next. A specific story tells you more than asking whether someone would use an imaginary app.', 'Turn your notes into a question: how might we help a particular person complete a particular task in a particular situation? Keep it narrow enough that a first prototype can teach you something. You can broaden the idea when you have evidence.'] },
    { slug: 'your-first-five-user-conversations', title: 'Your first five user conversations', category: 'problem-solving', excerpt: 'Listen for stories, leave room for surprises, and learn before you start building.', headings: ['Choose people close to the problem', 'Listen without pitching', 'Find the repeating thread'], paragraphs: ['Start with people who have recently faced the situation you want to understand. Explain that you are learning, ask for their time, and let them choose what they are comfortable sharing. Avoid collecting sensitive personal details.', 'Ask open questions about an actual experience. Let the person finish before offering an explanation. When something sounds surprising, ask them to walk through it again. Your goal is to understand their world rather than get approval for your solution.', 'After each conversation, separate what you heard from what you inferred. Compare the notes and look for a repeated obstacle. Five conversations will not prove a market exists, but they can make your next experiment more focused.'] },
    { slug: 'a-prototype-is-a-question', title: 'A prototype is a question you can try', category: 'product-building', excerpt: 'Make the smallest version that helps someone show you what they understand.', headings: ['Choose the uncertainty', 'Sketch one journey', 'Watch someone use it'], paragraphs: ['Before choosing a tool, write down what you need to learn. Perhaps you do not know whether the navigation makes sense or whether a person understands the value of a result. Each uncertainty calls for a different kind of prototype.', 'Draw the few screens that connect a starting point to an outcome. Paper is enough for early questions. Label buttons with the action they perform and make the next step visible. Leave decorative details for a later pass.', 'Give someone a short task and watch quietly. Ask what they expect to happen before they tap. Record where the prototype supported them and where it created confusion. Revise the flow and try the same task again.'] },
    { slug: 'choose-a-small-first-release', title: 'Choose a small first release', category: 'product-building', excerpt: 'A complete, narrow journey is a useful foundation for a first app.', headings: ['Name the one outcome', 'Draw a boundary', 'Finish the whole journey'], paragraphs: ['Describe what a person should be able to accomplish in a single sentence. For a reading club, that might mean discovering a book and saving it for later. It does not require building recommendations, a social feed, and a shop at once.', 'Keep a separate list of ideas for later. Moving an idea there does not mean it is bad; it means you are protecting time for the first working version. Review the list after someone has used the core flow.', 'Include the less exciting states: an empty list, a failed request, an invalid field, and a successful save. A small release should still make sense when something goes wrong. Those details are part of the product.'] },
    { slug: 'test-an-idea-without-writing-code', title: 'Test an idea without writing code', category: 'startup-ideas', excerpt: 'Use a simple experiment to discover whether your idea helps with a real task.', headings: ['Choose a testable assumption', 'Try a manual version', 'Decide what to learn next'], paragraphs: ['An assumption becomes useful when it is specific. Instead of saying people need better study tools, ask whether a short planning session helps a student decide what to work on next. Write down what you would expect to observe.', 'A conversation, paper exercise, or manually prepared resource can test part of an idea. Explain what the experiment is and what it cannot do. Do not present a manual demo as a fully working automated service.', 'Compare the observations with your expectations. An experiment can suggest a change in audience, problem, or approach. Document the result so the next version starts from learning rather than memory.'] },
    { slug: 'write-a-launch-checklist', title: 'A calmer checklist for your first launch', category: 'product-building', excerpt: 'Prepare the product, the explanation, and a way to hear what happens next.', headings: ['Walk through the main task', 'Explain what is ready', 'Make space for feedback'], paragraphs: ['Open the app on a phone and a larger screen. Start as a new visitor and complete the main task without relying on your memory as the builder. Check the links, empty states, and a deliberate failure case.', 'Write a short introduction that identifies who the app helps and what it does today. Be honest about experimental features and limitations. A clear description helps the right people decide whether to try it.', 'Choose a small first audience and a simple way to hear from them. Ask about the task they tried and where they got stuck. Keep feedback separate from your planned features, then decide which change would make the core experience more useful.'] },
    { slug: 'turn-feedback-into-a-next-step', title: 'Turn feedback into a next step', category: 'problem-solving', excerpt: 'Separate observations from suggestions and find a manageable change worth testing.', headings: ['Record what happened', 'Look for the underlying need', 'Change one thing thoughtfully'], paragraphs: ['A suggestion is useful context, but the event behind it often matters more. Ask what the person was trying to do when they asked for a new feature. Write down the moment in their own words without including private details.', 'Several different suggestions may point to the same need. A request for a tutorial and a request for clearer labels might both signal that the first step is hard to find. Group observations before choosing a solution.', 'Pick a change you can describe and evaluate. Explain what you expect it to improve, make the change, and repeat the relevant task with a fresh reader. This creates a learning loop that remains useful long after the first release.'] },
] as const;
export async function seed(pool: Pool, email: string, password: string) {
    const credentials = z.object({ email: z.email(), password: passwordSchema.refine(v => v.length >= 12, 'Use at least 12 characters for the seed password.') }).parse({ email: email.trim().toLowerCase(), password });
    const hash = await bcrypt.hash(credentials.password, 12);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('INSERT INTO editors(email,password_hash,display_name) VALUES($1,$2,$3) ON CONFLICT(email) DO NOTHING', [credentials.email, hash, 'Demo editorial team']);
        const editor = await client.query('SELECT id FROM editors WHERE email=$1', [credentials.email]);
        for (const [slug, name] of [['startup-ideas', 'Startup Ideas'], ['product-building', 'Product Building'], ['problem-solving', 'Problem Solving']])
            await client.query('INSERT INTO categories(slug,name) VALUES($1,$2) ON CONFLICT DO NOTHING', [slug, name]);
        const categories = await client.query('SELECT id,slug FROM categories');
        for (const [index, g] of guides.entries()) {
            const category = categories.rows.find(c => c.slug === g.category);
            const cover = g.category === 'startup-ideas' ? 'ideas' : g.category === 'product-building' ? 'building' : 'problems';
            const body = '*Original synthetic guide for the Tactyqal hire-a-thon concept.*\n\n' + g.headings.map((h, i) => `## ${h}\n\n${g.paragraphs[i]}`).join('\n\n') + '\n\n## Try this next\n\nWrite down one small action you can take this week. Share what you learned with a mentor, then choose your next experiment.\n';
            const id = `20000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;
            await client.query(`INSERT INTO posts(id,title,slug,excerpt,body,category_id,author_id,cover_path,cover_alt,status,published_at,first_published_at)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'published',$10,$10) ON CONFLICT DO NOTHING`, [id, g.title, g.slug, g.excerpt, body, category.id, editor.rows[0].id, `/covers/${cover}.svg`, `Editorial illustration for ${g.title}`, new Date(Date.UTC(2026, 10, 12 - index, 9))]);
        }
        await client.query(`INSERT INTO posts(id,title,slug,excerpt,body,category_id,author_id) VALUES('20000000-0000-4000-8000-000000000099','A work in progress','a-work-in-progress','A synthetic draft for the editorial demo.','## Start here\n\nThis draft is private until it is published.',$1,$2) ON CONFLICT DO NOTHING`, [categories.rows[0].id, editor.rows[0].id]);
        await client.query('COMMIT');
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const pool = createPool(process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL);
    try {
        await seed(pool, process.env.DEMO_EDITOR_EMAIL || '', process.env.DEMO_EDITOR_PASSWORD || '');
        console.log('Demo seed complete. Existing records and passwords preserved.');
    }
    finally {
        await pool.end();
    }
}
