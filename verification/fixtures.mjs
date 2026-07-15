export const clean = {
  allow: ['Bash(npm run test)'],
  ask: ['Bash(rm *)'],
  deny: ['Bash(git push *)', 'Edit(package.json)', 'Edit(.env)']
};

export const destructiveAllow = {
  allow: ['Bash(rm -rf /)', 'Bash(npm run test)'],
  ask: [],
  deny: ['Bash(git push *)', 'Edit(package.json)', 'Edit(.env)']
};

export const wildcardAllow = {
  allow: ['Bash(*)', 'Bash(npm run test)'],
  ask: ['Bash(rm *)'],
  deny: ['Bash(git push *)', 'Edit(package.json)', 'Edit(.env)']
};

export const conflict = {
  allow: ['Bash(npm run test)', 'Bash(git push *)'],
  ask: ['Bash(rm *)'],
  deny: ['Bash(git push *)', 'Edit(package.json)', 'Edit(.env)']
};

export const missingSettings = null;

export const empty = { allow: [], ask: [], deny: [] };

export const invalid = '{ this is not valid json';

// Genera 60 findings CRITICAL destructivos + 1 INFO
const limitAllow = [];
for (let i = 0; i < 60; i++) {
  limitAllow.push(`Bash(rm -rf /tmp/${i})`);
}
export const limit = { allow: limitAllow, ask: [], deny: [] };

export const all = {
  clean,
  destructiveAllow,
  wildcardAllow,
  conflict,
  missingSettings,
  empty,
  invalid,
  limit
};
