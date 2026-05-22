package `in`.sahayai.chitti.vaani.services

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import `in`.sahayai.chitti.vaani.util.AuditLog
import `in`.sahayai.chitti.vaani.util.SafetyChecks

/**
 * VaaniAccessibilityService
 * -------------------------
 * Autonomous-tap helper for the Chitti Phone Agent. Bryan 2026-05-22:
 * "Accessibility Service — operate WhatsApp, YouTube, Gmail, any
 * installed app on user's behalf."
 *
 * Scope expansion plan (this file): the service is allowed to tap
 * targets inside a CURATED allowlist of apps and node identifiers.
 * Outside that allowlist it does nothing. This is the v1 widening
 * of the original WhatsApp-only scope; further apps land by adding
 * rows to `KNOWN_TARGETS` (the code path never changes).
 *
 * Security fences kept STRUCTURAL (Bryan's CONTEXT.md §0 rule):
 *
 *   1. Must be voice-armed. `arm(target, durationMs)` is called by
 *      MainActivity *only* after the user said "haan" within the last
 *      ~1.5 seconds. Without an arm, every accessibility event is
 *      ignored.
 *   2. Single-shot. The moment we tap, `armedUntil` is reset to 0.
 *      The next tap requires a fresh voice-armed `arm()` call.
 *   3. 2-second arm window (default). After 2 seconds the arm
 *      auto-expires — even if the target view never appeared.
 *   4. PIN-shape refusal. Before tapping, every sibling text node in
 *      the target's parent is run through `SafetyChecks.refuseIfPinLike`.
 *      A PIN-shaped string (4-6 digit, ATM/UPI/OTP pattern) aborts
 *      the tap AND disarms the service AND writes a REFUSED audit row.
 *   5. Package allowlist. Only events from packages in
 *      `KNOWN_TARGETS.map { it.packageName }` are even considered.
 *      Events from any other app — even malicious ones intentionally
 *      mimicking WhatsApp's view IDs — are dropped at the first check.
 *   6. Per-target identifier allowlist. Each target row in
 *      `KNOWN_TARGETS` names a specific view-id OR content-description
 *      that the helper is allowed to tap. Generic "tap any button"
 *      is NOT a target.
 *   7. Audit log on every state transition: arm, refuse, tap, expire.
 *
 * What's NEW vs the WhatsApp-only original (commit 059ab22):
 *   - `arm(target, durationMs)` replaces the hard-coded
 *     `armWhatsAppSend()`. The web tier calls it via the
 *     ChittiNative.armAccessibilityAction JS bridge after voice "haan".
 *   - `KNOWN_TARGETS` adds: YouTube first-result, YouTube play/pause,
 *     Gmail compose-send, Phone-app answer button. Each row carries
 *     its own viewId / contentDescription allowlist.
 *   - The 4 security fences above all still fire on every tap,
 *     regardless of which target.
 *
 * What's still REFUSED:
 *   - Unlock surfaces of any kind.
 *   - Auto-typing into password / PIN fields.
 *   - Taps fired without a fresh voice arm — even a 100-ms gap
 *     between arm and tap is fine, but a tap WITHOUT a prior arm is
 *     dropped.
 *
 * Google Play accessibility-misuse review: the per-target allowlist
 * + voice arm + 2-second window is exactly the pattern Google's docs
 * use to describe "narrow, user-initiated, time-bounded automation"
 * — the only pattern that passes the policy. See
 * `accessibility_service_description` in strings.xml for the user-
 * visible justification Play Console requires.
 */
class VaaniAccessibilityService : AccessibilityService() {

    /** A curated target the service is allowed to tap. */
    data class Target(
        val key: String,            // logical name used by MainActivity.arm(key)
        val packageName: String,    // exact package id
        val viewIds: List<String>,  // any of these node ids satisfies the match
        val contentDescriptions: List<String> = emptyList(),  // fallback
        val texts: List<String> = emptyList(),                // fallback (case-sensitive)
        val description: String,    // human-readable for audit log
    )

    /** Bridge between MainActivity and the running service. The JS
     *  bridge holds a Context, not the service instance directly, so
     *  we route arm() through this static cursor. */
    companion object {
        @Volatile
        private var instance: VaaniAccessibilityService? = null

        /** All taps the Phone Agent is allowed to perform. Adding a new
         *  app = a new row here. The runtime never grants taps outside
         *  these rows, no matter what the JS bridge asks for. */
        val KNOWN_TARGETS: List<Target> = listOf(
            Target(
                key = "wa_send",
                packageName = "com.whatsapp",
                viewIds = listOf("com.whatsapp:id/send"),
                contentDescriptions = listOf("Send"),
                description = "WhatsApp send-message button",
            ),
            Target(
                key = "wa_send_business",
                packageName = "com.whatsapp.w4b",
                viewIds = listOf("com.whatsapp.w4b:id/send"),
                contentDescriptions = listOf("Send"),
                description = "WhatsApp Business send-message button",
            ),
            Target(
                key = "yt_first_result",
                packageName = "com.google.android.youtube",
                viewIds = listOf("com.google.android.youtube:id/result"),
                contentDescriptions = emptyList(),
                description = "YouTube — tap the first search result",
            ),
            Target(
                key = "yt_play_pause",
                packageName = "com.google.android.youtube",
                viewIds = listOf("com.google.android.youtube:id/player_control_play_pause_replay_button"),
                contentDescriptions = listOf("Play video", "Pause video"),
                description = "YouTube — play/pause toggle",
            ),
            Target(
                key = "gmail_send",
                packageName = "com.google.android.gm",
                viewIds = listOf("com.google.android.gm:id/send"),
                contentDescriptions = listOf("Send"),
                description = "Gmail send-mail button",
            ),
            Target(
                key = "dialer_answer",
                packageName = "com.google.android.dialer",
                viewIds = listOf(
                    "com.google.android.dialer:id/accept_button",
                    "com.android.incallui:id/answerVideoButton",
                ),
                contentDescriptions = listOf("Answer"),
                description = "Phone-app answer-call button (web fallback path)",
            ),
        )

        /**
         * Called by MainActivity after the user said "haan" within the
         * voice-confirm window. Arms the service for the given target
         * for `durationMs` ms (default 2000). Returns:
         *   "armed"             — accepted, will tap if it sees the target
         *   "unknown_target"    — `targetKey` not in KNOWN_TARGETS
         *   "service_not_bound" — accessibility service isn't running
         *                         (user hasn't granted the role yet)
         */
        fun arm(targetKey: String, durationMs: Long = 2000L): String {
            val svc = instance ?: return "service_not_bound"
            val target = KNOWN_TARGETS.firstOrNull { it.key == targetKey }
                ?: return "unknown_target"
            svc.armedTarget = target
            svc.armedUntil = System.currentTimeMillis() + durationMs
            AuditLog.append(svc, "AccessibilityService armed",
                "${target.key} · pkg=${target.packageName} · ${durationMs}ms")
            return "armed"
        }

        /** Returns the list of known target keys — surfaced via the
         *  JS bridge for honest UI labelling. */
        fun knownTargetKeys(): List<String> = KNOWN_TARGETS.map { it.key }
    }

    @Volatile private var armedUntil: Long = 0L
    @Volatile private var armedTarget: Target? = null

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        AuditLog.append(this, "AccessibilityService connected",
            "targets=" + KNOWN_TARGETS.joinToString(",") { it.key })
    }

    override fun onDestroy() {
        super.onDestroy()
        if (instance === this) instance = null
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        val now = System.currentTimeMillis()
        if (armedUntil < now) {
            // Auto-expire — audit-log once on the transition for noise control.
            if (armedTarget != null) {
                AuditLog.append(this, "AccessibilityService arm expired",
                    armedTarget?.key ?: "")
                armedTarget = null
            }
            return
        }
        val target = armedTarget ?: return
        if (event?.packageName?.toString() != target.packageName) return
        if (event.eventType != AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED &&
            event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return

        val root = rootInActiveWindow ?: return
        val hit = findTarget(root, target) ?: return

        // Defence — refuse if any sibling text in the focused row looks
        // PIN-shaped. Inherits the WhatsApp-era rule unchanged.
        val parent = hit.parent
        if (parent != null) {
            for (i in 0 until parent.childCount) {
                val ch = parent.getChild(i) ?: continue
                val t = ch.text?.toString() ?: continue
                runCatching { SafetyChecks.refuseIfPinLike(t) }.onFailure {
                    AuditLog.append(this, "AccessibilityService REFUSED",
                        "${target.key} · " + (it.message ?: "PIN-shape near tap target"))
                    armedUntil = 0L
                    armedTarget = null
                    return
                }
            }
        }

        hit.performAction(AccessibilityNodeInfo.ACTION_CLICK)
        AuditLog.append(this, "AccessibilityService tapped",
            "${target.key} · ${target.description}")
        armedUntil = 0L          // single-shot
        armedTarget = null
    }

    private fun findTarget(node: AccessibilityNodeInfo, target: Target): AccessibilityNodeInfo? {
        // Try by view IDs first (most stable across app versions).
        for (viewId in target.viewIds) {
            val hit = node.findAccessibilityNodeInfosByViewId(viewId).firstOrNull()
            if (hit != null) return hit
        }
        // Content-description allowlist — case-insensitive substring.
        for (cd in target.contentDescriptions) {
            val needle = cd.lowercase()
            val q = findByContentDescription(node, needle)
            if (q != null) return q
        }
        // Text allowlist — exact (case-sensitive) match.
        for (txt in target.texts) {
            val q = node.findAccessibilityNodeInfosByText(txt).firstOrNull { it.isClickable }
            if (q != null) return q
        }
        return null
    }

    private fun findByContentDescription(node: AccessibilityNodeInfo, needle: String): AccessibilityNodeInfo? {
        // Depth-first walk; stop at the first clickable node whose
        // contentDescription contains the needle.
        val cd = node.contentDescription?.toString()?.lowercase()
        if (cd != null && cd.contains(needle) && node.isClickable) return node
        for (i in 0 until node.childCount) {
            val ch = node.getChild(i) ?: continue
            val hit = findByContentDescription(ch, needle)
            if (hit != null) return hit
        }
        return null
    }

    /** Kept for source compatibility with the original WhatsApp-only
     *  bridge surface. Delegates to the new arm(targetKey, …). */
    @Deprecated("Use VaaniAccessibilityService.arm(\"wa_send\", durationMs)")
    fun armWhatsAppSend(durationMs: Long = 2000L) {
        arm("wa_send", durationMs)
    }

    override fun onInterrupt() { /* no-op */ }
}
