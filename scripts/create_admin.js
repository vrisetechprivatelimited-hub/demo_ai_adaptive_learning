// Run once: node scripts/create_admin.js
const { createUser } = require('../auth/userStore')

const [,, name='Admin', email='admin@vrisetech.com', mobile='9000000000', password='admin123'] = process.argv

try {
  const user = createUser(name, email, mobile, password, 'premium', 'admin')
  console.log('Admin created:', user.email, '| Role:', user.role)
} catch (e) {
  console.error('Error:', e.message)
}
