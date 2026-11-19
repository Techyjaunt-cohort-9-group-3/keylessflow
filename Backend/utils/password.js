const bcrypt = require('bcryptjs');

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const PASSWORD_MESSAGE = 'Password must be at least 8 characters and contain a letter and a number';

// Mongoose plugin: hashes `password` on save and adds comparePassword()
function passwordPlugin(schema) {
  schema.pre('save', async function hashPassword() {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
  });

  schema.methods.comparePassword = function comparePassword(candidate) {
    return bcrypt.compare(candidate, this.password);
  };
}

module.exports = { passwordPlugin, PASSWORD_RULE, PASSWORD_MESSAGE };
