import { createItem, getSingleton, listItems } from './dataClient.js'

function interpolate(template, values) {
  return String(template || '').replace(/{{\s*([^}]+)\s*}}/g, (_, key) => values[key.trim()] ?? '')
}

export async function notifyUsers(userIds, templateKey, values, actor) {
  const recipients = [...new Set(userIds.filter(Boolean))]
  if (!recipients.length) return []

  const templates = await getSingleton('notificationTemplates')
  const template = templates.success ? templates.data.templates?.[templateKey] : null
  const title = interpolate(template?.title || 'Camp for Nepal update', values)
  const message = interpolate(template?.message || '', values)

  return Promise.all(recipients.map((userId) => createItem('notifications', {
    userId,
    type: templateKey,
    title,
    message,
    link: values.link || '/',
    read: false,
  }, actor)))
}

export async function staffUserIds(roles) {
  const result = await listItems('users', { filters: { status: 'active' }, pageSize: 0 })
  if (!result.success) return []
  return result.data.filter((user) => roles.includes(user.role)).map((user) => user.id)
}
