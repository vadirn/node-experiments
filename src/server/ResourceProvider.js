const Boom = require('boom');

function decorateHandler(handler) {
  if (!handler) {
    return () => {
      throw Boom.notFound();
    };
  }
  return async (req, res, options = {}) => {
    try {
      const body = await handler(options);
      return body;
    } catch (err) {
      throw err;
    }
  };
}

module.exports = class ResourceProvider {
  constructor(options = {}) {
    const { pool } = options;

    this.pool = pool;
    this._resources = {};
  }
  query(text, params) {
    return this.pool.query(text, params);
  }
  addResource(resourceName, handlers = {}) {
    // bind ResourceProvider instance, so that other handlers can be accessed from within actions
    for (const action of Object.keys(handlers)) {
      handlers[action] = handlers[action].bind(this);
    }
    const { get, find, create, update, patch, remove } = handlers;
    // GET => get or find
    // POST => create
    // PUT => update
    // PATCH => patch
    // DELETE => remove
    this._resources[resourceName] = {
      handlers,
      hooks: {
        before: {
          all: [],
          get: [],
          find: [],
          create: [],
          update: [],
          patch: [],
          remove: [],
        },
        actions: {
          get: decorateHandler(get),
          find: decorateHandler(find),
          create: decorateHandler(create),
          update: decorateHandler(update),
          patch: decorateHandler(patch),
          remove: decorateHandler(remove),
        },
        after: {
          all: [],
          get: [],
          find: [],
          create: [],
          update: [],
          patch: [],
          remove: [],
        },
      },
    };
  }
  addBeforeHook(resourceName, hookType, hook) {
    if (this._resources[resourceName] && this._resources[resourceName].hooks.before[hookType]) {
      this._resources[resourceName].hooks.before[hookType].push(hook.bind(this));
    }
  }
  addAfterHook(resourceName, hookType, hook) {
    if (this._resources[resourceName] && this._resources[resourceName].hooks.after[hookType]) {
      this._resources[resourceName].hooks.after[hookType].push(hook.bind(this));
    }
  }
  getHandlers(resource) {
    return (this._resources[resource] && this._resources[resource].handlers) || {};
  }
  getHooks(options = {}) {
    const { method, id, resource } = options;

    if (!this._resources[resource]) {
      return [
        () => {
          throw Boom.notFound();
        },
      ];
    }

    const hooks = this._resources[resource].hooks;

    switch (method) {
      case 'GET':
        if (id) {
          // get
          return [...hooks.after.all, ...hooks.after.get, hooks.actions.get, ...hooks.before.get, ...hooks.before.all];
        }
        // find
        return [...hooks.after.all, ...hooks.after.find, hooks.actions.find, ...hooks.before.find, ...hooks.before.all];
      case 'POST':
        // create
        return [
          ...hooks.after.all,
          ...hooks.after.create,
          hooks.actions.create,
          ...hooks.before.create,
          ...hooks.before.all,
        ];
      case 'PUT':
        // update
        return [
          ...hooks.after.all,
          ...hooks.after.update,
          hooks.actions.update,
          ...hooks.before.update,
          ...hooks.before.all,
        ];
      case 'PATCH':
        // patch
        return [
          ...hooks.after.all,
          ...hooks.after.patch,
          hooks.actions.patch,
          ...hooks.before.patch,
          ...hooks.before.all,
        ];
      case 'DELETE':
        // remove
        return [
          ...hooks.after.all,
          ...hooks.after.remove,
          hooks.actions.remove,
          ...hooks.before.remove,
          ...hooks.before.all,
        ];
      default:
        return [
          () => {
            throw Boom.notFound();
          },
        ];
    }
  }
};
