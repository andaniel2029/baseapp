const express = require('express')
const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updateDetails,
  updatePassword,
  getGroups,
  getGroup,
  leaveGroup,
} = require('../controllers/auth')

const router = express.Router()

const { protect } = require('../middleware/auth')

router.post('/register', register)
router.post('/login', login)
router.get('/me', protect, getMe)
router.put('/updateDetails', protect, updateDetails)
router.put('/updatePassword', protect, updatePassword)
router.post('/forgotPassword', forgotPassword)
router.put('/resetPassword/:resettoken', resetPassword)
router.route('/groups').get(protect, getGroups)
router.route('/groups/:id').get(protect, getGroup).delete(protect, leaveGroup)

module.exports = router
