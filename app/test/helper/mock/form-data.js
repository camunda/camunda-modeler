function FormData() {
  this.data = {};
}

FormData.prototype.append = function(key, value) {
  this[key] = value;
};

module.exports = FormData;