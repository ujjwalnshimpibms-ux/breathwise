import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCommunityImpact,
  calculateWhatIfImpact,
  getBaselineCleanAirScore,
  getTopThreeActionsNow,
} from './impact';
import { createDemoAirQuality, createSeededPlan } from '../data/demoData';
import { buildLocalChatFallback } from './localChatFallback';
import type { UserProfile } from '../types/saans';

const delhiFamily: UserProfile = {
  city: 'Delhi',
  country: 'India',
  latitude: 28.6139,
  longitude: 77.209,
  adults: 2,
  children: 2,
  elderly: 0,
  sensitivities: ['asthma'],
  hasPets: false,
  commuteMode: 'car',
  cookingFuel: 'lpg',
  heatingMethod: 'electric_heater',
  homeType: 'apartment',
  windowsFacingRoad: true,
  budget: 'medium',
  goal: 'protect_kids',
};

test('getBaselineCleanAirScore penalizes car + road-facing + biomass vs clean setup', () => {
  const baselineCar = getBaselineCleanAirScore(delhiFamily);
  const cleanerHome = getBaselineCleanAirScore({
    ...delhiFamily,
    commuteMode: 'bus_metro',
    cookingFuel: 'induction',
    windowsFacingRoad: false,
  });
  assert.ok(cleanerHome > baselineCar);
});

test('calculateWhatIfImpact returns PM drop, CO2, rupees saved, and Clean Air Score', () => {
  const noneSelected = calculateWhatIfImpact(delhiFamily, 180, {});
  assert.equal(noneSelected.estimatedPm25ExposureReductionPct, 0);
  assert.equal(noneSelected.co2AvoidedKgPerWeek, 0);
  assert.equal(noneSelected.rupeesSavedPerWeek, 0);

  const active = calculateWhatIfImpact(delhiFamily, 180, {
    drive_less: 3,
    induction_cooking: 1,
    seal_filter_bedroom: 1,
  });
  assert.ok(active.estimatedPm25ExposureReductionPct > 40);
  assert.ok(active.co2AvoidedKgPerWeek > 10);
  assert.ok(active.rupeesSavedPerWeek > 300);
  assert.ok(active.cleanAirScore > active.baselineScore);
});

test('getTopThreeActionsNow sorts recommendations by highest PM2.5 reduction', () => {
  const aqi = createDemoAirQuality('Delhi', 'en');
  const plan = createSeededPlan(delhiFamily, aqi, 'en');
  const top3 = getTopThreeActionsNow(plan, 'en');
  assert.equal(top3.length, 3);
  assert.ok(top3[0].pm25ReductionPct >= top3[1].pm25ReductionPct);
  assert.ok(top3[1].pm25ReductionPct >= top3[2].pm25ReductionPct);
});

test('buildLocalChatFallback returns personalized Hindi and English replies', () => {
  const aqi = createDemoAirQuality('Delhi', 'en');
  const enReply = buildLocalChatFallback('Best mask for today?', delhiFamily, aqi, 'en');
  assert.match(enReply.answer, /Delhi/);
  assert.ok(enReply.steps.length >= 2);
  assert.ok(enReply.whyThisHelps.length > 10);

  const hiReply = buildLocalChatFallback('क्या आज बच्चे बाहर खेल सकते हैं?', delhiFamily, aqi, 'hi');
  assert.match(hiReply.answer, /Delhi/);
  assert.ok(hiReply.steps.length >= 2);
  assert.ok(hiReply.whyThisHelps.length > 10);
});

test('calculateCommunityImpact scales proportionally with households', () => {
  const small = calculateCommunityImpact(['zero_burning', 'school_carpool'], 20);
  const large = calculateCommunityImpact(['zero_burning', 'school_carpool'], 100);
  assert.equal(large.monthlyCo2AvoidedKg, small.monthlyCo2AvoidedKg * 5);
  assert.ok(large.equivalentTreesPlanted > small.equivalentTreesPlanted);
  assert.ok(large.estimatedStreetDustReductionPct > small.estimatedStreetDustReductionPct);
});
