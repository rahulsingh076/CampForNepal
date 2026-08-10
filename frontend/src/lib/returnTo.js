// Keeps internal return destinations intact across onboarding and authentication.
export function locationTarget(location) {
  return {
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
  }
}

export function returnTarget(value, fallback, blockedPaths = []) {
  const target = typeof value === 'string' ? { pathname: value } : value
  const pathname = target?.pathname

  if (!pathname || !pathname.startsWith('/') || pathname.startsWith('//') || blockedPaths.includes(pathname)) {
    return fallback
  }

  return {
    pathname,
    search: target.search || '',
    hash: target.hash || '',
  }
}

