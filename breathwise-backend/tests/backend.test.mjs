import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppServer } from '../server.mjs';
import { calculateWhatIf } from '../lib/whatif.mjs';
import { calculateCommunity } from '../lib/community.mjs';

test('calculateWhatIf handles both array and object selectedIds', () => {
  const fromArray = calculateWhatIf({
    selectedIds: ['drive_less', 'seal_filter_bedroom'],
    profile: { commuteMode: 'car', cookingFuel: 'lpg', windowsFacingRoad: true },
    currentPm25: 180,
  });
  const fromObj = calculateWhatIf({
    selectedIds: { drive_less: 3, seal_filter_bedroom: 1 },
    profile: { commuteMode: 'car', cookingFuel: 'lpg', windowsFacingRoad: true },
    currentPm25: 180,
  });
  assert.deepEqual(fromArray.pm25ReductionPct, fromObj.pm25ReductionPct);
  assert.equal(fromObj.source, 'calculated');
  assert.equal(fromObj.demo, false);
  assert.ok(fromObj.cleanAirScore > fromObj.baselineScore);
});

test('calculateCommunity scales totals proportionally', () => {
  const small = calculateCommunity({ households: 20, actionIds: ['zero_burning', 'school_carpool'] });
  const large = calculateCommunity({ households: 100, actionIds: ['zero_burning', 'school_carpool'] });
  assert.equal(large.monthlyCo2AvoidedKg, small.monthlyCo2AvoidedKg * 5);
  assert.equal(small.source, 'calculated');
});

test('HTTP endpoints respond cleanly with fallback when GEMINI_API_KEY is unset', async () => {
  const origKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = '';

  const server = createAppServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address();
  const baseUrl = `http://127.0.0.1:${addr.port}`;

  try {
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert.equal(healthRes.status, 200);
    const health = await healthRes.json();
    assert.equal(health.status, 'ok');
    assert.equal(health.hasGeminiKey, false);

    const whatIfRes = await fetch(`${baseUrl}/api/whatif`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selectedIds: { drive_less: 3 } }),
    });
    assert.equal(whatIfRes.status, 200);
    const whatIf = await whatIfRes.json();
    assert.ok(whatIf.co2AvoidedKgPerWeek > 0);

    const chatRes = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'hi',
        history: [],
        profile: { city: 'Delhi', children: 1 },
        aqi: { usAqi: 240, pollutants: { pm25: 150 } },
        language: 'en',
      }),
    });
    assert.equal(chatRes.status, 200);
    const chat = await chatRes.json();
    assert.equal(chat.source, 'fallback');
    assert.equal(chat.demo, true);
    assert.match(chat.answer, /Delhi/);
    assert.ok(chat.whyThisHelps.length > 10);
    assert.ok(chat.disclaimer.length > 10);

    const planRes = await fetch(`${baseUrl}/api/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: { city: 'Delhi', children: 2, commuteMode: 'car', cookingFuel: 'lpg' },
        aqi: { usAqi: 240, pollutants: { pm25: 150 } },
        language: 'hi',
      }),
    });
    assert.equal(planRes.status, 200);
    const plan = await planRes.json();
    assert.equal(plan.source, 'fallback');
    assert.equal(plan.demo, true);
    assert.equal(plan.routines.length, 4);
    assert.equal(plan.indoorHacks.length, 4);
    assert.equal(plan.alternatives.length, 3);
    assert.ok(plan.impactSummary.baselineScore >= 15);

    const commRes = await fetch(`${baseUrl}/api/community`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ households: 50, actionIds: ['zero_burning'] }),
    });
    assert.equal(commRes.status, 200);
    const comm = await commRes.json();
    assert.equal(comm.households, 50);
    assert.ok(comm.monthlyCo2AvoidedKg > 0);
  } finally {
    process.env.GEMINI_API_KEY = origKey;
    await new Promise((resolve) => server.close(resolve));
  }
});
