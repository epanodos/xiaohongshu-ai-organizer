import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CONFIRMATION_PHRASE as PUBLISHED_PHRASE,
  planHash as publishedHash,
  validatePlan as validatePublished,
} from '../skills/xhs-published-cleanup/scripts/plan_guard.mjs';
import {
  CONFIRMATION_PHRASE as FAVORITES_PHRASE,
  planHash as favoritesHash,
  validatePlan as validateFavorites,
} from '../skills/xhs-favorites-organizer/scripts/plan_guard.mjs';

function publishedPlan() {
  return {
    version: 1,
    mode: 'published-cleanup',
    createdAt: '2026-01-01T00:00:00.000Z',
    keepRules: ['Keep one demo note'],
    protectedNoteIds: ['note_demo_keep_001'],
    protectedBoardIds: [],
    plannedActions: [{ type: 'delete-note', targetId: 'note_demo_delete_001' }],
    unresolvedItems: [],
    confirmation: { confirmed: false, phrase: null, planHash: null },
  };
}

function favoritesPlan() {
  return {
    version: 1,
    mode: 'favorites-organizer',
    createdAt: '2026-01-01T00:00:00.000Z',
    keepRules: ['Keep AI and Design'],
    protectedNoteIds: ['note_demo_ai_001'],
    protectedBoardIds: ['board_demo_ai'],
    plannedActions: [
      { type: 'remove-favorite', targetId: 'note_demo_remove_001' },
      { type: 'delete-album', targetId: 'board_demo_old' },
    ],
    unresolvedItems: [],
    confirmation: { confirmed: false, phrase: null, planHash: null },
  };
}

test('published plan accepts a valid unconfirmed preview', () => {
  assert.equal(validatePublished(publishedPlan()).ok, true);
});

test('published plan rejects deletion of a protected note', () => {
  const plan = publishedPlan();
  plan.plannedActions[0].targetId = plan.protectedNoteIds[0];
  const result = validatePublished(plan);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /protected note/);
});

test('published confirmation is bound to the exact plan', () => {
  const plan = publishedPlan();
  plan.confirmation = {
    confirmed: true,
    phrase: PUBLISHED_PHRASE,
    planHash: publishedHash(plan),
  };
  assert.equal(validatePublished(plan, { requireConfirmed: true }).ok, true);
  plan.plannedActions.push({ type: 'delete-note', targetId: 'note_demo_delete_002' });
  const changed = validatePublished(plan, { requireConfirmed: true });
  assert.equal(changed.ok, false);
  assert.match(changed.errors.join('\n'), /stale/);
});

test('favorites plan accepts protected-union workflow', () => {
  assert.equal(validateFavorites(favoritesPlan()).ok, true);
});

test('favorites plan rejects removing a protected note', () => {
  const plan = favoritesPlan();
  plan.plannedActions[0].targetId = plan.protectedNoteIds[0];
  const result = validateFavorites(plan);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /protected note/);
});

test('favorites plan rejects deleting a protected album', () => {
  const plan = favoritesPlan();
  plan.plannedActions[1].targetId = plan.protectedBoardIds[0];
  const result = validateFavorites(plan);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /protected album/);
});

test('favorites plan enforces album deletion last', () => {
  const plan = favoritesPlan();
  plan.plannedActions.reverse();
  const result = validateFavorites(plan);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /after album deletion/);
});

test('favorites confirmation rejects unresolved items', () => {
  const plan = favoritesPlan();
  plan.unresolvedItems = ['Duplicate album name: AI'];
  plan.confirmation = {
    confirmed: true,
    phrase: FAVORITES_PHRASE,
    planHash: favoritesHash(plan),
  };
  const result = validateFavorites(plan, { requireConfirmed: true });
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /unresolvedItems/);
});
