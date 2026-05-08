package `in`.sahayai.chitti.vaani.util

/**
 * Code-level hard refusals.
 *
 * Bryan's product rule:
 *   "Chitti will never unlock the phone, never share or store UPI PIN,
 *    never send money without the user's spoken consent + PIN entry
 *    inside the UPI app."
 *
 * These functions are called from MainActivity / each Service to make
 * the refusal an INVARIANT enforced in code, not just in policy.
 */
object SafetyChecks {

    private val UNLOCK_HINTS = Regex(
        "(?i)(^|\\b)(unlock|kholo|khol\\s*do|unlocking|bypasslock|bypass\\s*lock)(\\b|$)"
    )

    /** Throws if the inbound caller name suggests an unlock attempt. */
    fun requireNotUnlock(callerName: String) {
        if (UNLOCK_HINTS.containsMatchIn(callerName)) refuseUnlock("blocked: $callerName")
    }

    fun refuseUnlock(reason: String): Nothing {
        AuditLog.appendStatic("REFUSED-unlock", reason)
        throw SecurityException(
            "Chitti refuses to unlock the phone. There is no API for it, and there never will be."
        )
    }

    private val PIN_LIKE = Regex("(?:^|\\b)(\\d{4}|\\d{6})(?:\\b|$)")

    /** Refuses if any inbound string looks like a UPI PIN that might be leaking through. */
    fun refuseIfPinLike(s: String) {
        if (PIN_LIKE.find(s) != null) {
            AuditLog.appendStatic("REFUSED-pin-like", "blocked PIN-shaped string in payload")
            throw SecurityException(
                "Chitti will not accept or pass a PIN. UPI PIN must be entered in the UPI app's secure keypad."
            )
        }
    }
}
