const origin = (value: string | undefined, fallback: string) => {
    const url = new URL(value || fallback);
    if (!['https:', 'http:'].includes(url.protocol))
        throw new Error('Expected an HTTP URL');
    return url.toString().replace(/\/$/, '');
};
export const siteUrl = origin(process.env.SITE_URL, 'http://localhost:3000');
export const blogUrl = origin(process.env.BLOG_WEB_URL, 'https://tactyqal.com/blog');
export const bookingUrl = origin(process.env.CONSULTATION_URL, 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ3JlaCrNitoPs8Bdr-FUP0cRfFI-MopSIH2azaPNDpRk56h6drYLbXSh-mDc9sfEZAQUKGdsUXs?gv=true');
export const milestones = [
    { weeks: '01 — 02', title: 'Find your problem.', description: 'Follow your curiosity. Talk to people, explore their needs, and choose an idea worth building.', output: 'A problem statement' },
    { weeks: '03 — 04', title: 'Make it tangible.', description: 'Sketch the experience and turn the strongest ideas into a prototype you can put in someone’s hands.', output: 'A clickable prototype' },
    { weeks: '05 — 06', title: 'Build your app.', description: 'Bring the pieces together with guided development. Test, learn, and make it work.', output: 'A working demo' },
    { weeks: '07 — 08', title: 'Put it out there.', description: 'Prepare your launch, tell your story, and learn how to reach the people you built it for.', output: 'A launch checklist & pitch' },
] as const;
export const faqs = [
    ['Does my teen need to know how to code?', 'No coding experience is needed. The program introduces app-building tools and guides your teen through making a working app, one step at a time.'],
    ['Do we need to arrive with an idea?', 'An idea is welcome, but it is not a prerequisite. The first two weeks focus on finding a problem, researching it, and choosing what to build.'],
    ['How does the mentoring work?', 'The program offers live, one-to-one, one-hour mentoring sessions. Use the free consultation to discuss scheduling, your teen’s interests, and the current program format.'],
    ['What happens over the eight weeks?', 'Your teen moves through research, design, app development, and launch preparation. The outputs shown here are examples; a project’s scope is shaped with the mentor.'],
    ['What does the program cost?', 'Ask about current pricing and availability during your free consultation. This concept demo does not advertise an unconfirmed offer.'],
] as const;
