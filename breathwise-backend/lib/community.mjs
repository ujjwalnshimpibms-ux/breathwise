/**
 * Community & RWA collective impact calculator.
 */

export const COMMUNITY_ACTIONS = [
  {
    id: 'zero_burning',
    co2KgPerHouseholdMonth: 14.5,
    pmDustGramsPerHouseholdMonth: 320,
  },
  {
    id: 'school_carpool',
    co2KgPerHouseholdMonth: 28.0,
    pmDustGramsPerHouseholdMonth: 95,
  },
  {
    id: 'wet_dust_control',
    co2KgPerHouseholdMonth: 1.5,
    pmDustGramsPerHouseholdMonth: 240,
  },
  {
    id: 'native_hedges',
    co2KgPerHouseholdMonth: 6.2,
    pmDustGramsPerHouseholdMonth: 140,
  },
  {
    id: 'no_idling_zone',
    co2KgPerHouseholdMonth: 9.8,
    pmDustGramsPerHouseholdMonth: 70,
  },
];

export function calculateCommunity({ households = 60, actionIds = [] }) {
  const numericHouseholds = Number(households);
  const safeHouseholds = Number.isFinite(numericHouseholds)
    ? Math.max(1, Math.min(5000, Math.round(numericHouseholds)))
    : 60;

  const validActionIds = Array.isArray(actionIds)
    ? [...new Set(actionIds.filter((id) => COMMUNITY_ACTIONS.some((a) => a.id === id)))]
    : [];

  let co2PerHousehold = 0;
  let pmGramsPerHousehold = 0;

  for (const action of COMMUNITY_ACTIONS) {
    if (validActionIds.includes(action.id)) {
      co2PerHousehold += action.co2KgPerHouseholdMonth;
      pmGramsPerHousehold += action.pmDustGramsPerHouseholdMonth;
    }
  }

  const monthlyCo2AvoidedKg = Math.round(co2PerHousehold * safeHouseholds);
  const monthlyPmDustPreventedKg = Math.round((pmGramsPerHousehold * safeHouseholds) / 100) / 10;
  const equivalentTreesPlanted = Math.round(monthlyCo2AvoidedKg / 1.8);
  const participationFactor = Math.min(1, safeHouseholds / 150);
  const actionFactor = Math.min(1, validActionIds.length / COMMUNITY_ACTIONS.length);
  const streetDustReductionPct = Math.round(
    24 * actionFactor * (0.35 + 0.65 * participationFactor)
  );

  return {
    households: safeHouseholds,
    actionIds: validActionIds,
    monthlyCo2AvoidedKg,
    monthlyPmDustPreventedKg,
    equivalentTreesPlanted,
    streetDustReductionPct,
    source: 'calculated',
    demo: false,
  };
}
