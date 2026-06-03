function timestamp() {
  return new Date().toISOString();
}

function log(level, scope, message, extra) {
  const payload = {
    time: timestamp(),
    level,
    scope,
    message,
    ...(extra ? { extra } : {}),
  };

  if (level === 'error') {
    console.error(JSON.stringify(payload));
    return;
  }

  if (level === 'warn') {
    console.warn(JSON.stringify(payload));
    return;
  }

  console.log(JSON.stringify(payload));
}

module.exports = {
  log,
  info: (scope, message, extra) => log('info', scope, message, extra),
  warn: (scope, message, extra) => log('warn', scope, message, extra),
  error: (scope, message, extra) => log('error', scope, message, extra),
};
