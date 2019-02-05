class Flags {

  constructor() {
    this.data = {};
  }

  init(data) {
    this.data = data;
  }

  get(key) {
    return this.data[key];
  }

}

export default new Flags();


export const DISABLE_CMMN = 'disable-cmmn';
export const DISABLE_DMN = 'disable-dmn';