import { b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Radio, c as Activity, i as ScrollText, n as Smartphone, o as MessageCircle, r as ShieldCheck, s as KeyRound } from "../_libs/lucide-react.mjs";
import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Ck_LHtKG.js
var import_jsx_runtime = require_jsx_runtime();
function Seal({ className = "size-10" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 80 80",
		className,
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "40",
				cy: "40",
				r: "37",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.4"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "40",
				cy: "40",
				r: "33",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "0.6"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M40 52 V28 M40 36 C33 32 28 28 26 22 M40 34 C47 30 53 26 55 20 M40 40 C32 38 26 36 22 32 M40 42 C49 39 55 36 60 32",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.3",
				strokeLinecap: "round"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M28 54 C32 48 36 50 40 52 C44 50 48 48 52 54",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.2",
				strokeLinecap: "round"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "26",
				cy: "21",
				r: "1.4",
				fill: "currentColor"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "56",
				cy: "19",
				r: "1.4",
				fill: "currentColor"
			})
		]
	});
}
var empty = {
	silenceDays: 0,
	scanned: false,
	sam: false,
	messaged: false,
	reply: null
};
function riskOf(s) {
	if (s.reply === "alive") return .06;
	if (s.reply === "passed") return .97;
	let p = .11 + Math.min(s.silenceDays, 8) * .08;
	if (s.scanned) p += .08;
	if (s.sam) p += .14;
	if (s.reply === "unsure") p += .05;
	return Math.min(p, .92);
}
function toneOf(p, reply) {
	if (reply === "passed") return "Confirmed";
	if (reply === "alive") return "Present";
	if (p >= .7) return "Elevated";
	if (p >= .4) return "Quiet";
	return "Steady";
}
var useApp = create((set) => ({
	...empty,
	tab: "pulse",
	setTab: (tab) => set({ tab }),
	advance: () => set((s) => ({
		silenceDays: Math.min(s.silenceDays + 1, 8),
		reply: s.reply === "alive" ? null : s.reply
	})),
	scan: () => set({
		scanned: true,
		sam: true,
		tab: "watch"
	}),
	message: () => set({
		messaged: true,
		tab: "circle"
	}),
	answer: (reply) => set({
		reply,
		tab: reply === "passed" ? "wishes" : "pulse"
	}),
	reset: () => set({
		...empty,
		tab: "pulse"
	})
}));
var tabs = [
	{
		id: "pulse",
		label: "Pulse",
		icon: Radio
	},
	{
		id: "watch",
		label: "Watch",
		icon: Activity
	},
	{
		id: "circle",
		label: "Circle",
		icon: MessageCircle
	},
	{
		id: "vault",
		label: "Vault",
		icon: KeyRound
	},
	{
		id: "wishes",
		label: "Wishes",
		icon: ScrollText
	}
];
function Companion() {
	const tab = useApp((s) => s.tab);
	const setTab = useApp((s) => s.setTab);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-screen bg-paper text-ink",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex min-h-screen w-full max-w-md flex-col",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex items-center gap-3 px-5 pt-6 pb-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Seal, { className: "size-11 text-gold" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-xl leading-none tracking-wide",
								children: "Ereditas"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs tracking-widest text-muted uppercase",
								children: "Companion"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ml-auto rounded-full border border-line bg-card px-3 py-1 text-xs text-muted",
							children: "Demo"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
					className: "flex-1 px-5 pt-3 pb-28",
					children: [
						tab === "pulse" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pulse, {}),
						tab === "watch" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Watch, {}),
						tab === "circle" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, {}),
						tab === "vault" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Vault, {}),
						tab === "wishes" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wishes, {})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					className: "fixed inset-x-0 bottom-0 z-10 border-t border-line bg-card/95 backdrop-blur",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mx-auto grid max-w-md grid-cols-5",
						children: tabs.map((item) => {
							const Icon = item.icon;
							const on = tab === item.id;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setTab(item.id),
								className: `flex min-h-16 flex-col items-center justify-center gap-1 text-xs ${on ? "text-gold-deep" : "text-muted"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
									className: "size-5",
									strokeWidth: 1.6
								}), item.label]
							}, item.id);
						})
					})
				})
			]
		})
	});
}
function Pulse() {
	const state = useApp();
	const p = riskOf(state);
	const tone = toneOf(p, state.reply);
	const pct = Math.round(p * 100);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rise space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Good morning"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl leading-tight",
				children: state.reply === "passed" ? "The circle has answered." : state.reply === "alive" ? "You are still here." : p >= .7 ? "The watch is elevated." : p >= .4 ? "A quiet stretch." : "The watch is quiet."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gauge, {
				pct,
				tone
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-3 gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
						label: "Device",
						value: state.silenceDays === 0 ? "4h" : `${state.silenceDays}d`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
						label: "Meta",
						value: state.silenceDays < 2 ? "Active" : "Silent"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
						label: "$1 fee",
						value: state.silenceDays < 3 ? "Paid" : "Missed"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
				className: "space-y-2 rounded-card border border-line bg-card p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step, {
						n: "1",
						done: state.silenceDays > 0,
						text: "No device or Meta activity"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step, {
						n: "2",
						done: state.scanned,
						text: "News, obituaries, Facebook & Instagram"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step, {
						n: "3",
						done: state.sam,
						text: "SAM 3.1 memorial classification"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step, {
						n: "4",
						done: state.messaged,
						text: "WhatsApp tree to emergency contacts"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Step, {
						n: "5",
						done: state.reply === "passed",
						text: "Release the last-wishes vault"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Actions, {})
		]
	});
}
function Gauge({ pct, tone }) {
	const r = 68;
	const c = 2 * Math.PI * r;
	const dash = pct / 100 * c;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative mx-auto grid size-56 place-items-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: "0 0 180 180",
			className: "absolute inset-0 size-full -rotate-90",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "90",
				cy: "90",
				r,
				fill: "none",
				className: "stroke-line",
				strokeWidth: "8"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "90",
				cy: "90",
				r,
				fill: "none",
				className: tone === "Confirmed" ? "stroke-danger" : "stroke-gold",
				strokeWidth: "8",
				strokeLinecap: "round",
				strokeDasharray: `${dash} ${c}`
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-5xl leading-none",
				children: pct
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs tracking-widest text-muted uppercase",
				children: tone
			})]
		})]
	});
}
function Chip({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-line bg-card px-3 py-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 font-medium",
			children: value
		})]
	});
}
function Step({ n, done, text }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "flex items-start gap-3 text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs ${done ? "bg-gold text-card" : "border border-line text-muted"}`,
			children: n
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: done ? "text-ink" : "text-muted",
			children: text
		})]
	});
}
function Actions() {
	const s = useApp();
	if (s.reply === "passed") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick: () => s.setTab("wishes"),
		className: "h-12 w-full rounded-full bg-ink text-card",
		children: "Open last wishes"
	});
	if (s.reply === "alive") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick: s.reset,
		className: "h-12 w-full rounded-full bg-ink text-card",
		children: "Reset the watch"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: s.advance,
				disabled: s.silenceDays >= 8,
				className: "h-12 rounded-full bg-ink text-card disabled:opacity-40",
				children: "Advance one quiet day"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: s.scan,
				disabled: s.silenceDays < 2,
				className: "h-12 rounded-full border border-gold text-gold-deep disabled:opacity-40",
				children: s.sam ? "Memorial scan complete" : "Scan news and social"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: s.message,
				disabled: !s.sam,
				className: "h-12 rounded-full border border-line text-ink disabled:opacity-40",
				children: "Message the circle on WhatsApp"
			})
		]
	});
}
function Watch() {
	const s = useApp();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rise space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl",
				children: "Signals"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm leading-relaxed text-muted",
				children: "The companion listens to the phone, Meta apps, and the one-dollar heartbeat. Social posts from family are read only after the watch rises."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Signal, {
				icon: Smartphone,
				title: "This phone",
				detail: s.silenceDays === 0 ? "Unlocked 4 hours ago" : `No unlock for ${s.silenceDays} day${s.silenceDays > 1 ? "s" : ""}`
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Signal, {
				icon: Radio,
				title: "Facebook, Instagram, WhatsApp",
				detail: s.silenceDays < 2 ? "Recent session on Instagram" : "No Meta session in the window"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Signal, {
				icon: ShieldCheck,
				title: "Heartbeat fee",
				detail: s.silenceDays < 3 ? "$1 cleared this week" : "Recurring $1 did not clear"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-baseline justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-xl",
							children: "From the circle"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs tracking-widest text-muted uppercase",
							children: s.sam ? "SAM 3.1" : "Waiting"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Post, {
						src: "/media/candle.jpg",
						who: "Ana Martínez",
						where: "Instagram",
						caption: "A candle for you tonight.",
						boxes: s.sam ? [{
							label: "candle",
							top: "18%",
							left: "38%",
							w: "24%",
							h: "42%"
						}, {
							label: "flowers",
							top: "62%",
							left: "18%",
							w: "64%",
							h: "24%"
						}] : []
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Post, {
						src: "/media/frame.jpg",
						who: "Daniel Ruiz",
						where: "Facebook",
						caption: "Your frame stays on the table.",
						boxes: s.sam ? [{
							label: "black ribbon",
							top: "22%",
							left: "48%",
							w: "28%",
							h: "36%"
						}] : []
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Post, {
						src: "/media/lilies.jpg",
						who: "Sofía K.",
						where: "Instagram",
						caption: "Lilies, the way you liked them.",
						boxes: s.sam ? [{
							label: "lilies",
							top: "20%",
							left: "22%",
							w: "56%",
							h: "40%"
						}, {
							label: "cross",
							top: "58%",
							left: "40%",
							w: "22%",
							h: "22%"
						}] : []
					}),
					!s.sam && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Scan from Pulse to classify memorial objects in these posts."
					})
				]
			})
		]
	});
}
function Signal({ icon: Icon, title, detail }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "flex items-center gap-3 rounded-card border border-line bg-card p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "grid size-11 place-items-center rounded-full bg-paper text-gold-deep",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
				className: "size-5",
				strokeWidth: 1.6
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-medium",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: detail
		})] })]
	});
}
function Post({ src, who, where, caption, boxes }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "overflow-hidden rounded-card border border-line bg-card",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src,
				alt: "",
				className: "aspect-[4/5] w-full object-cover"
			}), boxes.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "absolute border border-gold bg-ink/20",
				style: {
					top: b.top,
					left: b.left,
					width: b.w,
					height: b.h
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "absolute top-1 left-1 bg-ink px-1.5 py-0.5 text-xs tracking-wide text-card uppercase",
					children: b.label
				})
			}, b.label))]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "px-4 py-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-medium",
					children: who
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-muted",
					children: [" · ", where]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: caption
			})]
		})]
	});
}
function Circle() {
	const s = useApp();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rise space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl",
				children: "Emergency circle"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm leading-relaxed text-muted",
				children: "WhatsApp first. Voice notes are transcribed. The tree stops at the first clear answer."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "overflow-hidden rounded-card border border-line bg-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex items-center gap-3 border-b border-line px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-10 place-items-center rounded-full bg-paper font-display text-gold-deep",
						children: "A"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium",
						children: "Ana Martínez"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: "WhatsApp · primary contact"
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-3 bg-paper px-4 py-4",
					children: s.messaged ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bubble, {
							side: "out",
							children: "Ereditas watch for Edwin is elevated. Have you seen him in the last day? Reply well, unsure, or passed."
						}),
						s.reply === "passed" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bubble, {
							side: "in",
							children: "He passed this morning. Please take care of the rest."
						}),
						s.reply === "alive" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bubble, {
							side: "in",
							children: "He is with me. All is well."
						}),
						s.reply === "unsure" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bubble, {
							side: "in",
							children: "I have not heard. I will call his sister."
						})
					] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "The message stays unsent until the memorial scan is done."
					})
				})]
			}),
			!s.messaged && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: s.message,
				disabled: !s.sam,
				className: "h-12 w-full rounded-full bg-ink text-card disabled:opacity-40",
				children: "Send WhatsApp to Ana"
			}),
			s.messaged && !s.reply && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => s.answer("alive"),
						className: "h-12 rounded-full border border-line",
						children: "Ana: he is well"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => s.answer("unsure"),
						className: "h-12 rounded-full border border-line",
						children: "Ana: not sure"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => s.answer("passed"),
						className: "h-12 rounded-full bg-ink text-card",
						children: "Ana: he has passed"
					})
				]
			}),
			s.reply === "passed" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-ok",
				children: "Confirmation recorded. The vault may release scoped access."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "space-y-2 text-sm text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "1 · Ana Martínez — WhatsApp" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "2 · Daniel Ruiz — WhatsApp, then voice" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "3 · Family lawyer — voice only" })
				]
			})
		]
	});
}
function Bubble({ side, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: `max-w-xs rounded-2xl px-3 py-2 text-sm leading-relaxed ${side === "out" ? "ml-auto bg-ink text-card" : "bg-card text-ink"}`,
		children
	});
}
var credentials = [
	{
		site: "Google",
		kind: "Drive & mail",
		heir: "Ana",
		action: "Share"
	},
	{
		site: "Instagram",
		kind: "Memorialization",
		heir: "Daniel",
		action: "Close"
	},
	{
		site: "Wallet",
		kind: "Seed, view-only",
		heir: "Ana",
		action: "Transfer"
	},
	{
		site: "Bank",
		kind: "Read access",
		heir: "Lawyer",
		action: "Hold"
	}
];
function Vault() {
	const passed = useApp((s) => s.reply === "passed");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rise space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl",
				children: "Vault"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm leading-relaxed text-muted",
				children: "Google Password Manager stays the living source. Ereditas only classifies beneficiaries and releases scoped links after confirmation. WhatsApp never stores the keys."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-card border border-line bg-card",
				children: credentials.map((row, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-line" : ""}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: row.site
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted",
							children: [
								row.kind,
								" · ",
								row.heir
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `rounded-full px-3 py-1 text-xs ${passed ? "bg-ink text-card" : "border border-line text-muted"}`,
						children: passed ? row.action : "Sealed"
					})]
				}, row.site))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: passed ? "One-time links prepared. Passwords stay encrypted; heirs receive scope, not a dump." : "Nothing leaves the vault while the watch is open."
			})
		]
	});
}
var wishes = [
	"Share the family Drive with Ana",
	"Request Instagram memorialization",
	"Hand the view-only wallet to Ana",
	"Email the lawyer the sealed packet",
	"Send the food order note you wrote"
];
function Wishes() {
	const passed = useApp((s) => s.reply === "passed");
	const reset = useApp((s) => s.reset);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rise space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl",
				children: "Last wishes"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm leading-relaxed text-muted",
				children: "Written while you were here. They run only after the circle confirms."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-2",
				children: wishes.map((wish, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-center gap-3 rounded-card border border-line bg-card px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `grid size-6 place-items-center rounded-full text-xs ${passed ? "bg-ok text-card" : "border border-line text-muted"}`,
						children: passed ? "✓" : i + 1
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: passed ? "text-ink" : "text-muted",
						children: wish
					})]
				}, wish))
			}),
			passed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: reset,
				className: "h-12 w-full rounded-full border border-line",
				children: "Replay the demo"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Locked. Confirm through the circle to release this list."
			})
		]
	});
}
var SplitComponent = Companion;
//#endregion
export { SplitComponent as component };
