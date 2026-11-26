import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFamilyMeaningLine,
  determineDominantPollutant,
  findBestOutdoorWindow,
  getAqiCategory,
} from './aqi';
import type { UserProfile } from '../types/saans';

const sampleProfile: UserProfile = {
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

test('getAqiCategory returns accurate categories across US AQI bands', () => {
  assert.equal(getAqiCategory(32).id, 'good');
  assert.equal(getAqiCategory(88).id, 'moderate');
  assert.equal(getAqiCategory(135).id, 'sensitive');
  assert.equal(getAqiCategory(185).id, 'unhealthy');
  assert.equal(getAqiCategory(268).id, 'very_unhealthy');
  assert.equal(getAqiCategory(380).id, 'hazardous');
});

test('determineDominantPollutant identifies highest normalized pollutant', () => {
  assert.equal(determineDominantPollutant(165, 220, 45, 30), 'PM2.5');
  assert.equal(determineDominantPollutant(20, 320, 40, 25), 'PM10');
});

test('findBestOutdoorWindow picks lowest afternoon AQI pair', () => {
  const hourly = [
    { time: '2026-11-25T08:00', hour: 8, aqi: 310, pm25: 220 },
    { time: '2026-11-25T13:00', hour: 13, aqi: 170, pm25: 90 },
    { time: '2026-11-25T14:00', hour: 14, aqi: 165, pm25: 85 },
    { time: '2026-11-25T19:00', hour: 19, aqi: 295, pm25: 205 },
  ];
  const windowLabel = findBestOutdoorWindow(hourly, 'en');
  assert.match(windowLabel, /1:00 PM/);
});

test('buildFamilyMeaningLine personalizes for children and sensitivities in both EN and HI', () => {
  const enLine = buildFamilyMeaningLine(265, sampleProfile, 'en');
  assert.match(enLine, /2 children/);
  assert.match(enLine, /respiratory sensitivities/i);

  const hiLine = buildFamilyMeaningLine(265, sampleProfile, 'hi');
  assert.match(hiLine, /बच्चों/);
  assert.match(hiLine, /अस्थमा/);
});
