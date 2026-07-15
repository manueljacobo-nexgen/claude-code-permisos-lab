(function (global) {
  const clean = {
    allow: ['Bash(npm run test)'],
    ask: ['Bash(rm *)'],
    deny: ['Bash(git push *)', 'Edit(package.json)', 'Edit(.env)']
  };

  const destructiveAllow = {
    allow: ['Bash(rm -rf /)', 'Bash(npm run test)'],
    ask: [],
    deny: ['Bash(git push *)', 'Edit(package.json)', 'Edit(.env)']
  };

  const wildcardAllow = {
    allow: ['Bash(*)', 'Bash(npm run test)'],
    ask: ['Bash(rm *)'],
    deny: ['Bash(git push *)', 'Edit(package.json)', 'Edit(.env)']
  };

  const conflict = {
    allow: ['Bash(npm run test)', 'Bash(git push *)'],
    ask: ['Bash(rm *)'],
    deny: ['Bash(git push *)', 'Edit(package.json)', 'Edit(.env)']
  };

  const missingSettings = null;
  const empty = { allow: [], ask: [], deny: [] };
  const invalid = '{ this is not valid json';

  const limitAllow = [];
  for (let i = 0; i < 60; i++) limitAllow.push(`Bash(rm -rf /tmp/${i})`);
  const limit = { allow: limitAllow, ask: [], deny: [] };

  global.PermAuditFixtures = {
    clean, destructiveAllow, wildcardAllow, conflict, missingSettings, empty, invalid, limit
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
