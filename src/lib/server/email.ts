import { env } from '$env/dynamic/private';

/**
 * Minimal Resend sender (REST, no SDK). Fail-open by design: when
 * RESEND_API_KEY is unset (no account yet / local dev) the email body is
 * logged to the server console instead, so flows like password reset stay
 * usable before the Resend account exists.
 *
 * Env: RESEND_API_KEY, RESEND_FROM (e.g. "Dead & Tattooed <no-reply@deadandtattooed.com>").
 */
export async function sendEmail(input: {
	to: string;
	subject: string;
	text: string;
	html?: string;
}): Promise<{ sent: boolean }> {
	const apiKey = env.RESEND_API_KEY;
	const from = env.RESEND_FROM || 'Dead & Tattooed <onboarding@resend.dev>';
	if (!apiKey) {
		console.warn(
			`[email] RESEND_API_KEY not set — NOT sending. to=${input.to} subject="${input.subject}"\n${input.text}`
		);
		return { sent: false };
	}
	const res = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			from,
			to: [input.to],
			subject: input.subject,
			text: input.text,
			html: input.html
		})
	});
	if (!res.ok) {
		// Log the body too: for reset/verification emails it carries the action
		// link, so a failed send (e.g. domain not yet verified) is still
		// rescuable from the function logs.
		console.error(
			`[email] Resend send failed (${res.status}): ${await res.text()} — undelivered to=${input.to} subject="${input.subject}"\n${input.text}`
		);
		return { sent: false };
	}
	return { sent: true };
}
