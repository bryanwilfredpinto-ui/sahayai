package `in`.sahayai.chitti.vaani.util

import org.junit.Assert.assertThrows
import org.junit.Assert.fail
import org.junit.Test

/**
 * Unit tests for SafetyChecks — the code-level hard refusals that enforce
 * Bryan's product rule: "Chitti will never unlock the phone, never share or
 * store a UPI PIN."
 *
 * These tests run on the JVM (no Android runtime needed) so they execute in
 * the standard unit-test source set. They must pass before every CI build.
 *
 * Note: AuditLog.appendStatic() falls through gracefully when FALLBACK_CTX
 * is null (which it is in the JVM test harness) — no initialisation required.
 */
class SafetyChecksTest {

    // ── requireNotUnlock ──────────────────────────────────────────────────

    /** Safe method names must pass without throwing. */
    @Test
    fun `requireNotUnlock passes for safe method name lockPhone`() {
        // "lockPhone" contains "lock" but NOT as an unlock hint — must pass.
        try {
            SafetyChecks.requireNotUnlock("lockPhone")
        } catch (e: SecurityException) {
            fail("requireNotUnlock threw unexpectedly for 'lockPhone': ${e.message}")
        }
    }

    /** "unlockPhone" must be blocked — it contains the unlock hint. */
    @Test
    fun `requireNotUnlock throws for unlockPhone`() {
        assertThrows(SecurityException::class.java) {
            SafetyChecks.requireNotUnlock("unlockPhone")
        }
    }

    /** Any caller name that contains "unlock" must be blocked. */
    @Test
    fun `requireNotUnlock throws for string containing unlock`() {
        assertThrows(SecurityException::class.java) {
            SafetyChecks.requireNotUnlock("tryUnlockDevice")
        }
    }

    /** Hindi unlock synonyms must also be blocked. */
    @Test
    fun `requireNotUnlock throws for Hindi kholo`() {
        assertThrows(SecurityException::class.java) {
            SafetyChecks.requireNotUnlock("kholo")
        }
    }

    // ── refuseUnlock ─────────────────────────────────────────────────────

    /** refuseUnlock always throws regardless of the reason string. */
    @Test
    fun `refuseUnlock always throws SecurityException`() {
        assertThrows(SecurityException::class.java) {
            SafetyChecks.refuseUnlock("bypassLock called")
        }
    }

    /** The thrown message must mention "unlock" so stack traces are clear. */
    @Test
    fun `refuseUnlock exception message mentions unlock`() {
        val ex = assertThrows(SecurityException::class.java) {
            SafetyChecks.refuseUnlock("some reason")
        }
        assert(ex.message?.lowercase()?.contains("unlock") == true) {
            "Expected 'unlock' in exception message but got: ${ex.message}"
        }
    }

    // ── refuseIfPinLike ───────────────────────────────────────────────────

    /** 4-digit strings that look like UPI PINs must be blocked. */
    @Test
    fun `refuseIfPinLike throws for 4-digit string`() {
        assertThrows(SecurityException::class.java) {
            SafetyChecks.refuseIfPinLike("1234")
        }
    }

    /** 6-digit strings that look like UPI PINs must be blocked. */
    @Test
    fun `refuseIfPinLike throws for 6-digit string`() {
        assertThrows(SecurityException::class.java) {
            SafetyChecks.refuseIfPinLike("123456")
        }
    }

    /** A real Indian mobile number (+91 XXXXX XXXXX) must NOT be blocked —
     *  it is 10 digits after the country code, not 4 or 6. */
    @Test
    fun `refuseIfPinLike passes for real phone number +919876543210`() {
        try {
            SafetyChecks.refuseIfPinLike("+919876543210")
        } catch (e: SecurityException) {
            fail("refuseIfPinLike should NOT block a real phone number: ${e.message}")
        }
    }

    /** Plain text with no digit sequence must pass. */
    @Test
    fun `refuseIfPinLike passes for plain text`() {
        try {
            SafetyChecks.refuseIfPinLike("namaste chitti")
        } catch (e: SecurityException) {
            fail("refuseIfPinLike threw unexpectedly for plain text: ${e.message}")
        }
    }

    /** 3-digit and 5-digit strings are not PIN-shaped — must pass. */
    @Test
    fun `refuseIfPinLike passes for 3-digit and 5-digit strings`() {
        try {
            SafetyChecks.refuseIfPinLike("123")
            SafetyChecks.refuseIfPinLike("12345")
        } catch (e: SecurityException) {
            fail("refuseIfPinLike threw unexpectedly for non-PIN digit strings: ${e.message}")
        }
    }

    /** Empty string must pass (no PIN-shaped content). */
    @Test
    fun `refuseIfPinLike passes for empty string`() {
        try {
            SafetyChecks.refuseIfPinLike("")
        } catch (e: SecurityException) {
            fail("refuseIfPinLike threw for empty string: ${e.message}")
        }
    }
}
