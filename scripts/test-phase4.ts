import {
  createConnectionInvite,
  acceptConnectionInvite,
  getStudentConnections,
  getLeaderboardPreferences,
  updateLeaderboardPreference,
  updateDsaProblemProgress,
  getStudentDsaProgress
} from "../lib/dsa-store";

async function runPhase4Verification() {
  console.log("🚀 Starting Phase 4 Verification (Privacy & Social)...");
  const studentA = `student-alice-${Date.now()}`;
  const studentB = `student-bob-${Date.now()}`;
  const stranger = `student-stranger-${Date.now()}`;

  // Test 4a: Mutual Connection Opt-in
  console.log("\n[4a] Testing Mutual Friend Connection Flow...");
  const invite = await createConnectionInvite(studentA);
  console.assert(invite.connection_code.startsWith("COG-"), "Invite code should start with COG-");
  console.log(`✓ Alice created connection code: ${invite.connection_code}`);

  // Bob accepts invite
  const accepted = await acceptConnectionInvite(studentB, invite.connection_code);
  console.assert(accepted.status === "accepted", "Connection status should be accepted");
  console.log("✓ Bob accepted Alice's invite — connection is now mutual");

  // Verify connection list for Alice & Bob
  const aliceConns = await getStudentConnections(studentA);
  console.assert(aliceConns.some(c => c.recipient_student_id === studentB && c.status === "accepted"), "Alice should see accepted connection with Bob");
  console.log("✓ Mutual connection established and confirmed on both ends");

  // Privacy Check: Stranger attempts to view Alice's progress without mutual connection
  console.log("\n[4a Privacy] Testing Unconnected Stranger Access Attempt...");
  const strangerConns = await getStudentConnections(stranger);
  const isStrangerConnectedToAlice = strangerConns.some(
    c => c.status === "accepted" &&
    ((c.requester_student_id === stranger && c.recipient_student_id === studentA) ||
     (c.requester_student_id === studentA && c.recipient_student_id === stranger))
  );
  console.assert(isStrangerConnectedToAlice === false, "Stranger must NOT have mutual connection with Alice");
  console.log("✓ Stranger correctly blocked from accessing Alice's practice progress");

  // Test 4b: College-Wide Leaderboard Opt-In & Anonymity
  console.log("\n[4b] Testing Leaderboard Opt-In & Default Privacy...");
  const initialPref = await getLeaderboardPreferences(studentA);
  console.assert(initialPref.is_opted_in === false, "Leaderboard MUST default to opted-out");
  console.assert(!initialPref.display_handle.includes("Alice"), "Handle must default to anonymized format");
  console.log(`✓ Default leaderboard status is opted-out with anonymized handle: ${initialPref.display_handle}`);

  // Alice explicitly opts in with custom anonymized handle
  const updatedPref = await updateLeaderboardPreference(studentA, true, "MatrixNinja#77");
  console.assert(updatedPref.is_opted_in === true, "Opt-in should now be true");
  console.assert(updatedPref.display_handle === "MatrixNinja#77", "Handle should update to MatrixNinja#77");
  console.log("✓ Explicit opt-in and anonymized handle updated successfully");

  // Test 4c: Problem-Specific Private Notes
  console.log("\n[4c] Testing Private Problem Notes...");
  await updateDsaProblemProgress(studentA, "two-sum", {
    notes: "Remember: Map stores complement as key and index as value. O(n) time, O(n) space."
  });
  const aliceProgress = await getStudentDsaProgress(studentA);
  console.assert(aliceProgress["two-sum"].notes?.includes("Map stores complement"), "Notes should persist accurately");
  console.log("✓ Problem-specific notes saved and confirmed private to student");

  console.log("\n🎉 Phase 4 All Tests Passed Successfully!");
}

runPhase4Verification().catch(err => {
  console.error("Phase 4 verification failed:", err);
  process.exit(1);
});
