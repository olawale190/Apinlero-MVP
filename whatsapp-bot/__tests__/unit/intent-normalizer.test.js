import { describe, it, expect } from '@jest/globals';
import { normalizeIntent, INTENTS } from '../../src/intent-normalizer.js';

describe('normalizeIntent', () => {
  it('maps new_order → NEW_ORDER', () => {
    expect(normalizeIntent('new_order')).toBe('NEW_ORDER');
  });

  it('maps price_enquiry → PRICE_CHECK', () => {
    expect(normalizeIntent('price_enquiry')).toBe('PRICE_CHECK');
  });

  it('maps modify_order → MODIFY_ORDER', () => {
    expect(normalizeIntent('modify_order')).toBe('MODIFY_ORDER');
  });

  it('maps meal_order → MEAL_ORDER', () => {
    expect(normalizeIntent('meal_order')).toBe('MEAL_ORDER');
  });

  it('maps budget_order → BUDGET_ORDER', () => {
    expect(normalizeIntent('budget_order')).toBe('BUDGET_ORDER');
  });

  it('maps running_total → RUNNING_TOTAL', () => {
    expect(normalizeIntent('running_total')).toBe('RUNNING_TOTAL');
  });

  it('maps quantity_estimate → QUANTITY_ESTIMATE', () => {
    expect(normalizeIntent('quantity_estimate')).toBe('QUANTITY_ESTIMATE');
  });

  it('maps address_update → ADDRESS_UPDATE', () => {
    expect(normalizeIntent('address_update')).toBe('ADDRESS_UPDATE');
  });

  it('maps general_query → GENERAL_INQUIRY', () => {
    expect(normalizeIntent('general_query')).toBe('GENERAL_INQUIRY');
  });

  it('maps greeting → GREETING', () => {
    expect(normalizeIntent('greeting')).toBe('GREETING');
  });

  it('maps reorder → REORDER', () => {
    expect(normalizeIntent('reorder')).toBe('REORDER');
  });

  it('passes through already-uppercase NEW_ORDER', () => {
    expect(normalizeIntent('NEW_ORDER')).toBe('NEW_ORDER');
  });

  it('passes through already-uppercase PRICE_CHECK', () => {
    expect(normalizeIntent('PRICE_CHECK')).toBe('PRICE_CHECK');
  });

  it('returns GENERAL_INQUIRY for null', () => {
    expect(normalizeIntent(null)).toBe('GENERAL_INQUIRY');
  });

  it('returns GENERAL_INQUIRY for undefined', () => {
    expect(normalizeIntent(undefined)).toBe('GENERAL_INQUIRY');
  });

  it('returns GENERAL_INQUIRY for empty string', () => {
    expect(normalizeIntent('')).toBe('GENERAL_INQUIRY');
  });

  it('returns GENERAL_INQUIRY for unknown intent', () => {
    expect(normalizeIntent('unknown_thing')).toBe('GENERAL_INQUIRY');
  });
});

describe('INTENTS', () => {
  it('exports all canonical intent names', () => {
    expect(Object.keys(INTENTS)).toEqual([
      'NEW_ORDER',
      'PRICE_CHECK',
      'MODIFY_ORDER',
      'MEAL_ORDER',
      'BUDGET_ORDER',
      'RUNNING_TOTAL',
      'QUANTITY_ESTIMATE',
      'ADDRESS_UPDATE',
      'GENERAL_INQUIRY',
      'GREETING',
      'REORDER',
    ]);
  });
});
