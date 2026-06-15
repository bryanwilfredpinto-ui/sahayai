// World Class Chitti Vaani Android — Commando Discipline. Zero Excuses.
package `in`.sahayai.chitti.vaani.bridge

import android.content.Context
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.LargeTest
import `in`.sahayai.chitti.vaani.ChittiNativeBridge
import `in`.sahayai.chitti.vaani.util.AuditLog
import `in`.sahayai.chitti.vaani.util.SafetyChecks
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/**
 * ChittiNativeBridgeInstrumentedTest
 * ────────────────────────────────────
 * Instrumented (on-device / emulator) tests for the ChittiNativeBridge
 * Kotlin class and its JS layer.
 *
 * What is tested:
 *   T1  canHostNative() always returns true
 *   T2  lockPhone() returns "needs_device_admin" in emulator (no admin enrolled)
 *   T3  setSilentMode(true) returns "needs_notification_policy" in emulator
 *   T4  requestNightMode() returns "scheduled" (broadcast sent without error)
 *   T5  SafetyChecks.requireNotUnlock("lockPhone") does NOT throw
 *   T6  SafetyChecks.requireNotUnlock("unlockPhone") throws SecurityException
 *   T7  SafetyChecks.requireNotUnlock("bypassLock") throws SecurityException
 *   T8  SafetyChecks.refuseIfPinLike("1234") throws SecurityException
 *   T9  SafetyChecks.refuseIfPinLike("hello") does NOT throw
 *   T10 AuditLog.append() writes a line containing the verb to the log file
 *   T11 WebView exposes window.ChittiNative — bridge_smoke.html reads "bridge_ok"
 *   T12 bridge_smoke.html COP_DENYLIST JS fence returns "cop_denylist_ok"
 *
 * Design notes:
 *   • We instantiate ChittiNativeBridge(ctx) directly — no Activity needed.
 *   • T11/T12 load bridge_smoke.html from androidTest/assets via a plain
 *     WebView; we read the result DOM element via evaluateJavascript with
 *     a CountDownLatch (main-thread safe via Looper trick).
 *   • Tests assert behaviour ONLY — they never dial, send SMS, or
 *     interact with real OS services beyond what a unit test can observe.
 *
 * Golden Rule reminder:
 *   These tests must NOT trigger any outbound call, SMS, or real OS
 *   side-effect without explicit emulator-safe stubbing. Every bridge
 *   method that requires a System service returns a safe "needs_X" fallback
 *   on an emulator with no permissions — that's the assertable result.
 */
@RunWith(AndroidJUnit4::class)
@LargeTest
class ChittiNativeBridgeInstrumentedTest {

    private lateinit var ctx: Context
    private lateinit var bridge: ChittiNativeBridge

    @Before
    fun setup() {
        ctx = ApplicationProvider.getApplicationContext()
        AuditLog.init(ctx)
        bridge = ChittiNativeBridge(ctx)
    }

    // ── T1: canHostNative ──────────────────────────────────────────────────

    @Test
    fun t01_canHostNative_returnsTrue() {
        assertTrue(
            "ChittiNative.canHostNative() must always return true on Android",
            bridge.canHostNative(),
        )
    }

    // ── T2: lockPhone — no device admin in emulator ────────────────────────

    @Test
    fun t02_lockPhone_needsDeviceAdminInEmulator() {
        val result = bridge.lockPhone()
        assertEquals(
            "lockPhone() must return 'needs_device_admin' when admin is not enrolled",
            "needs_device_admin",
            result,
        )
    }

    // ── T3: setSilentMode — no DND access in emulator ─────────────────────

    @Test
    fun t03_setSilentMode_needsNotificationPolicyInEmulator() {
        // Emulators do not grant NotificationPolicy access to test packages by default.
        // The method must return "needs_notification_policy" in that state.
        val result = bridge.setSilentMode(true)
        // Two valid outcomes depending on emulator config:
        //   "needs_notification_policy" — no DND access (expected in CI)
        //   "silent"                   — emulator has DND access (manual grant)
        assertTrue(
            "setSilentMode(true) must return 'needs_notification_policy' or 'silent'; got: $result",
            result == "needs_notification_policy" || result == "silent",
        )
    }

    // ── T4: requestNightMode — no exception, returns "scheduled" ──────────

    @Test
    fun t04_requestNightMode_returnsScheduled() {
        val result = bridge.requestNightMode()
        assertEquals(
            "requestNightMode() must return 'scheduled'",
            "scheduled",
            result,
        )
    }

    // ── T5–T7: SafetyChecks.requireNotUnlock ──────────────────────────────

    @Test
    fun t05_safetyChecks_lockPhoneDoesNotThrow() {
        // "lockPhone" must pass — it IS the lock action, not unlock.
        try {
            SafetyChecks.requireNotUnlock("lockPhone")
        } catch (e: SecurityException) {
            fail("requireNotUnlock('lockPhone') must NOT throw but threw: ${e.message}")
        }
    }

    @Test
    fun t06_safetyChecks_unlockPhoneThrows() {
        try {
            SafetyChecks.requireNotUnlock("unlockPhone")
            fail("requireNotUnlock('unlockPhone') must throw SecurityException")
        } catch (e: SecurityException) {
            // expected
            assertTrue(
                "Exception message must contain 'refuses to unlock'",
                e.message?.contains("refuses to unlock") == true,
            )
        }
    }

    @Test
    fun t07_safetyChecks_bypassLockThrows() {
        try {
            SafetyChecks.requireNotUnlock("bypassLock")
            fail("requireNotUnlock('bypassLock') must throw SecurityException")
        } catch (e: SecurityException) {
            // expected — "bypasslock" matches the UNLOCK_HINTS regex
        }
    }

    // ── T8–T9: SafetyChecks.refuseIfPinLike ──────────────────────────────

    @Test
    fun t08_safetyChecks_refuseIfPinLike_throwsFor4Digit() {
        try {
            SafetyChecks.refuseIfPinLike("1234")
            fail("refuseIfPinLike('1234') must throw SecurityException")
        } catch (e: SecurityException) {
            // expected
        }
    }

    @Test
    fun t08b_safetyChecks_refuseIfPinLike_throwsFor6Digit() {
        try {
            SafetyChecks.refuseIfPinLike("123456")
            fail("refuseIfPinLike('123456') must throw SecurityException")
        } catch (e: SecurityException) {
            // expected
        }
    }

    @Test
    fun t09_safetyChecks_refuseIfPinLike_noThrowForText() {
        // Normal text must not be refused
        try {
            SafetyChecks.refuseIfPinLike("hello@upi")
            SafetyChecks.refuseIfPinLike("9876543210")  // 10-digit phone — not 4 or 6 digits
            SafetyChecks.refuseIfPinLike("")
        } catch (e: SecurityException) {
            fail("refuseIfPinLike should NOT throw for normal strings; threw: ${e.message}")
        }
    }

    // ── T10: AuditLog appends a line to the log file ──────────────────────

    @Test
    fun t10_auditLog_appendsLine() {
        val verb   = "TEST_VERB_${System.currentTimeMillis()}"
        val detail = "instrumented-test-detail"
        AuditLog.append(ctx, verb, detail)

        val logFile = File(ctx.filesDir, "vaani_audit.log")
        assertTrue("vaani_audit.log must exist after AuditLog.append()", logFile.exists())

        val content = logFile.readText()
        assertTrue(
            "Audit log must contain the verb '$verb' after append",
            content.contains(verb),
        )
        assertTrue(
            "Audit log must contain the detail '$detail' after append",
            content.contains(detail),
        )
    }

    // ── T11: WebView exposes window.ChittiNative ──────────────────────────

    /**
     * Loads bridge_smoke.html from androidTest/assets into a WebView that
     * has the ChittiNativeBridge installed, then reads the #result element.
     *
     * Runs on the main thread via runOnMainThread helper; uses CountDownLatch
     * to wait up to 10 s for the page to finish loading and the JS to run.
     */
    @Test
    fun t11_webView_exposesBridge() {
        val latch  = CountDownLatch(1)
        val result = arrayOfNulls<String>(1)

        runOnMainThread {
            val wv = WebView(ctx)
            wv.settings.javaScriptEnabled = true
            wv.addJavascriptInterface(ChittiNativeBridge(ctx), "ChittiNative")

            wv.webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    // Give the inline <script> ~500ms to run, then read result
                    wv.postDelayed({
                        wv.evaluateJavascript(
                            "document.getElementById('result').textContent",
                        ) { value ->
                            // evaluateJavascript returns JSON-encoded string — strip quotes
                            result[0] = value?.trim('"') ?: "null"
                            latch.countDown()
                        }
                    }, 500L)
                }
            }
            // Load stub page from androidTest/assets
            wv.loadUrl("file:///android_asset/bridge_smoke.html")
        }

        assertTrue("WebView bridge check timed out", latch.await(10, TimeUnit.SECONDS))
        assertEquals(
            "bridge_smoke.html #result must be 'bridge_ok' (ChittiNative is exposed)",
            "bridge_ok",
            result[0],
        )
    }

    // ── T12: COP_DENYLIST JS fence in bridge_smoke.html ───────────────────

    @Test
    fun t12_copDenylistJs_allNumbersEnforced() {
        val latch  = CountDownLatch(1)
        val result = arrayOfNulls<String>(1)

        runOnMainThread {
            val wv = WebView(ctx)
            wv.settings.javaScriptEnabled = true
            wv.addJavascriptInterface(ChittiNativeBridge(ctx), "ChittiNative")

            wv.webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    wv.postDelayed({
                        wv.evaluateJavascript(
                            "document.getElementById('cop_result').textContent",
                        ) { value ->
                            result[0] = value?.trim('"') ?: "null"
                            latch.countDown()
                        }
                    }, 500L)
                }
            }
            wv.loadUrl("file:///android_asset/bridge_smoke.html")
        }

        assertTrue("COP denylist JS check timed out", latch.await(10, TimeUnit.SECONDS))
        assertEquals(
            "bridge_smoke.html #cop_result must be 'cop_denylist_ok'; got: ${result[0]}",
            "cop_denylist_ok",
            result[0],
        )
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    /**
     * Posts [block] to the main thread and waits for it to run.
     * WebView must be created on the main thread; tests run on a
     * JUnit worker thread, so we bridge with a CountDownLatch.
     */
    private fun runOnMainThread(block: () -> Unit) {
        val latch = CountDownLatch(1)
        android.os.Handler(android.os.Looper.getMainLooper()).post {
            block()
            latch.countDown()
        }
        latch.await(5, TimeUnit.SECONDS)
    }
}
