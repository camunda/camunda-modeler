export default {
  init: () => {},
  track(_, properties) {
    return {
      properties: {
        ...this.properties,
        ...properties
      }
    };
  },
  identify: () => {},
  register(properties) {
    this.properties = {
      ...this.properties,
      ...properties
    };
  },
  opt_in_tracking: () => {},
  opt_out_tracking: () => {},
  has_opted_in_tracking: () => false
};
