import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import Activity from '../../src/modules/activities/activity.model.js'
import { activityFixture, expectInvalidPath, validationErrorFor } from '../helpers/modelFixtures.js'

describe('Activity model', () => {
  test('a complete activity passes validation', async () => {
    const error = await validationErrorFor(new Activity(activityFixture()))
    assert.equal(error, null)
  })

  test('a missing title fails', async () => {
    const doc = new Activity(activityFixture({ title: undefined }))
    assert.ok(await expectInvalidPath(doc, 'title'))
  })

  test('an invalid slug fails', async () => {
    const doc = new Activity(activityFixture({ slug: 'Not A Slug' }))
    assert.ok(await expectInvalidPath(doc, 'slug'))
  })

  test('an unknown difficulty fails', async () => {
    const doc = new Activity(activityFixture({ difficulty: 'brutal' }))
    assert.ok(await expectInvalidPath(doc, 'difficulty'))
  })

  test('every canonical difficulty is accepted', async () => {
    const levels = [
      'easy', 'easy to moderate', 'moderate', 'challenging',
      'strenuous', 'strenuous and technical', 'extreme',
    ]
    for (const difficulty of levels) {
      const doc = new Activity(activityFixture({ difficulty }))
      assert.equal(await validationErrorFor(doc), null, `${difficulty} should be valid`)
    }
  })

  test('a title-case difficulty is normalised rather than rejected', async () => {
    // The package seed stores "Challenging"; activities store "challenging".
    // Both must land on the same stored value.
    const doc = new Activity(activityFixture({ difficulty: 'Challenging' }))
    assert.equal(await validationErrorFor(doc), null)
    assert.equal(doc.difficulty, 'challenging')
  })

  test('an unsafe URL fails', async () => {
    const doc = new Activity(activityFixture({ gallery: ['data:text/html,<script>'] }))
    assert.ok(await expectInvalidPath(doc, 'gallery'))
  })

  test('category is free text, so an unseen value is accepted', async () => {
    const doc = new Activity(activityFixture({ category: 'a-brand-new-category' }))
    assert.equal(await validationErrorFor(doc), null)
  })

  test('public JSON exposes id and hides _id', () => {
    const json = new Activity(activityFixture()).toJSON()
    assert.equal(typeof json.id, 'string')
    assert.equal(json._id, undefined)
  })
})
