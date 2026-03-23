import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";
import { getPasswordRuleState, isPasswordCompliant, PASSWORD_RULE_TEXTS } from "../utils/passwordRules";
import { sendPortalEmail } from "../utils/emailService";

type AccountRecord = {
	email: string;
	password: string;
	securityQ1?: string;
	securityQ2?: string;
	securityQuestion?: string;
	securityAnswer?: string;
};

type UpdateResult = {
	changed: boolean;
	foundEmail: boolean;
};

export function ForgotPasswordPage() {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [securityAnswer, setSecurityAnswer] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const ruleState = getPasswordRuleState(newPassword);
	const matches = newPassword.length > 0 && newPassword === confirmPassword;

	async function handleReset(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setSuccess("");

		const normalizedEmail = email.trim().toLowerCase();
		const normalizedAnswer = securityAnswer.trim().toLowerCase();

		if (!normalizedEmail) {
			setError("Please enter your email.");
			return;
		}

		if (!normalizedAnswer) {
			setError("Please answer the security question.");
			return;
		}

		if (!isPasswordCompliant(newPassword)) {
			setError("New password does not meet all required rules.");
			return;
		}

		if (!matches) {
			setError("Passwords do not match.");
			return;
		}

		const updateInCollection = (key: string): UpdateResult => {
			const raw = localStorage.getItem(key);
			if (!raw) {
				return { changed: false, foundEmail: false };
			}

			const list = JSON.parse(raw) as AccountRecord[];
			let changed = false;
			let foundEmail = false;

			const updated = list.map((item) => {
				const matchesEmail = item.email?.trim().toLowerCase() === normalizedEmail;
				if (!matchesEmail) {
					return item;
				}

				foundEmail = true;

				const q1 = item.securityQ1?.trim().toLowerCase();
				const q2 = item.securityQ2?.trim().toLowerCase();
				const legacyQuestionAnswer = item.securityAnswer?.trim().toLowerCase();
				const matchesSecurity =
					(Boolean(q1) && q1 === normalizedAnswer)
					|| (Boolean(q2) && q2 === normalizedAnswer)
					|| (Boolean(legacyQuestionAnswer) && legacyQuestionAnswer === normalizedAnswer);

				if (!matchesSecurity) {
					return item;
				}

				changed = true;
				return {
					...item,
					password: newPassword,
				};
			});

			if (changed) {
				localStorage.setItem(key, JSON.stringify(updated));
			}

			return { changed, foundEmail };
		};

		const userAccounts = updateInCollection("user_accounts");
		const mockUsers = updateInCollection("mock_users");
		const staffSecurity = updateInCollection("staff_security");

		const invitedStaffRaw = localStorage.getItem("staff_members");
		const invitedStaff = invitedStaffRaw
			? (JSON.parse(invitedStaffRaw) as Array<{ email: string }>)
			: [];
		const foundInvitedEmail = invitedStaff.some((m) => m.email.trim().toLowerCase() === normalizedEmail);

		const foundAnyEmail =
			userAccounts.foundEmail
			|| mockUsers.foundEmail
			|| staffSecurity.foundEmail
			|| foundInvitedEmail;
		const changedAnyPassword = userAccounts.changed || mockUsers.changed || staffSecurity.changed;

		if (!foundAnyEmail) {
			setError("Email not recognized. Please use the email tied to your account.");
			return;
		}

		if (!changedAnyPassword) {
			setError("Email recognized, but the security answer is incorrect.");
			return;
		}

		const userSend = await sendPortalEmail({
			to: normalizedEmail,
			from: "goodreclying@partnherconfrim.com",
			subject:
				"Please this is not an offical email of Goods Recycling. Please contact us directly and dont open any links or files.",
			message:
				"Thank you for your sumbisson. Your password reset request is confirmed and completed right away.",
		});

		const staffSend = await sendPortalEmail({
			to: "admin@goodsrecycling.org",
			from: "goodreclying@partnherconfrim.com",
			subject: "Staff notice: partner password reset completed",
			message: `Password reset completed for account: ${normalizedEmail}`,
		});

		if (!userSend.sent || !staffSend.sent) {
			const details = [userSend.error, staffSend.error].filter(Boolean).join(" | ");
			setSuccess(`Password reset successful. Email fallback active: ${details}`);
		} else {
			setSuccess("Password reset successful. Confirmation emails were sent.");
		}

		setTimeout(() => navigate("/login"), 1000);
	}

	return (
		<main className="min-h-screen bg-gray-100 px-6 py-16">
			<section className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
				<h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
				<p className="mt-2 text-gray-600">Enter your email, answer one security question, and set a new password.</p>

				<form onSubmit={handleReset} className="mt-6 space-y-4">
					{error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
					{success && <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div>}

					<div>
						<label className="mb-1 block text-sm font-medium text-gray-700">Email *</label>
						<input
							type="email"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full rounded-lg border border-gray-300 px-3 py-2"
						/>
					</div>

					<div>
						<label className="mb-1 block text-sm font-medium text-gray-700">What city were you born in? *</label>
						<input
							type="text"
							required
							value={securityAnswer}
							onChange={(e) => setSecurityAnswer(e.target.value)}
							className="w-full rounded-lg border border-gray-300 px-3 py-2"
						/>
					</div>

					<div>
						<label className="mb-1 block text-sm font-medium text-gray-700">New Password *</label>
						<input
							type="password"
							required
							maxLength={10}
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							className="w-full rounded-lg border border-gray-300 px-3 py-2"
						/>
					</div>

					<div>
						<label className="mb-1 block text-sm font-medium text-gray-700">Confirm New Password *</label>
						<input
							type="password"
							required
							maxLength={10}
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							className="w-full rounded-lg border border-gray-300 px-3 py-2"
						/>
					</div>

					<div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-1.5">
						{(
							[
								{ met: ruleState.hasLength, text: PASSWORD_RULE_TEXTS.hasLength },
								{ met: ruleState.hasUppercase, text: PASSWORD_RULE_TEXTS.hasUppercase },
								{ met: ruleState.hasLowercase, text: PASSWORD_RULE_TEXTS.hasLowercase },
								{ met: ruleState.hasDigit, text: PASSWORD_RULE_TEXTS.hasDigit },
								{ met: ruleState.hasSpecial, text: PASSWORD_RULE_TEXTS.hasSpecial },
								{ met: matches, text: "Passwords match" },
							] as const
						).map((rule) => (
							<div key={rule.text} className={`flex items-center gap-2 text-xs ${rule.met ? "text-green-700" : "text-red-600"}`}>
								{rule.met ? <CheckCircle size={14} /> : <XCircle size={14} />}
								<span>{rule.text}</span>
							</div>
						))}
					</div>

					<button
						type="submit"
						className="w-full rounded-lg bg-gray-900 px-4 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
						disabled={!email.trim() || !securityAnswer.trim() || !isPasswordCompliant(newPassword) || !matches}
					>
						Reset Password
					</button>
				</form>

				<Link to="/" className="mt-5 inline-block text-sm text-gray-600 underline hover:text-gray-800">
					Back to Login
				</Link>
			</section>
		</main>
	);
}
