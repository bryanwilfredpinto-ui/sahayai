package `in`.sahayai.chitti.vaani.services

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import `in`.sahayai.chitti.vaani.util.AuditLog
import `in`.sahayai.chitti.vaani.util.SafetyChecks

/**
 * VaaniAccessibilityService
 * -------------------------
 * Strictly scoped autonomous-tap helper. Used ONLY to tap the WhatsApp
 * "send" button after the user gives voice consent within a 2-second
 * window — closing the gap that the web tier cannot bridge alone.
 *
 * Google Play's accessibility-misuse review will reject this service if
 * its scope is broad. So:
 *   - accessibility_service_config.xml restricts packageNames to com.whatsapp
 *   - We only act on a node whose viewIdResourceName matches the WA send
 *     button's known ID OR whose contentDescription matches "Send".
 *   - We refuse any tap inside a node whose text looks PIN-shaped.
 *   - We require an explicit one-shot ARM signal from MainActivity
 *     (set within 2s of voice "haan"); otherwise we ignore everything.
 */
class VaaniAccessibilityService : AccessibilityService() {

    @Volatile private var armedUntil: Long = 0L
    @Volatile private var pendingTarget: String = "wa_send"   // future-proof for other narrow targets

    /**
     * Called from MainActivity once the user has voice-confirmed "haan"
     * and we want WA to send. Stays armed for 2 seconds, single-shot.
     */
    fun armWhatsAppSend(durationMs: Long = 2000L) {
        armedUntil = System.currentTimeMillis() + durationMs
        pendingTarget = "wa_send"
        AuditLog.append(this, "AccessibilityService armed", "WA send window 2s")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        val now = System.currentTimeMillis()
        if (armedUntil < now) return        // not armed
        if (event?.packageName?.toString() != "com.whatsapp") return
        if (event.eventType != AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED &&
            event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return

        val root = rootInActiveWindow ?: return
        val sendBtn = findWaSendButton(root) ?: return

        // Defence: refuse if any sibling text in the focused row looks PIN-shaped.
        val parent = sendBtn.parent
        if (parent != null) {
            for (i in 0 until parent.childCount) {
                val ch = parent.getChild(i) ?: continue
                val t = ch.text?.toString() ?: continue
                runCatching { SafetyChecks.refuseIfPinLike(t) }.onFailure {
                    AuditLog.append(this, "AccessibilityService refused", it.message ?: "PIN-shape near send")
                    armedUntil = 0L
                    return
                }
            }
        }

        sendBtn.performAction(AccessibilityNodeInfo.ACTION_CLICK)
        AuditLog.append(this, "AccessibilityService tapped WA send", "after voice haan")
        armedUntil = 0L                    // single-shot
    }

    private fun findWaSendButton(node: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        // Try by view ID first (stable on most WA versions).
        val byId = node.findAccessibilityNodeInfosByViewId("com.whatsapp:id/send").firstOrNull()
        if (byId != null) return byId
        // Fall back to contentDescription "Send".
        val q = node.findAccessibilityNodeInfosByText("Send")
        return q.firstOrNull { it.isClickable }
    }

    override fun onInterrupt() { /* no-op */ }
}
